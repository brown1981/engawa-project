import { createClient } from '@supabase/supabase-js';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- 🛡 Self-contained Decryption Logic ---
function decryptSync(encryptedText, masterKey) {
  if (!encryptedText || !masterKey) return null;
  try {
    const parts = encryptedText.split(':');
    let ivHex, authTagHex, contentHex;

    if (parts.length === 2) {
      // Heal logic: Splitting the second part into AuthTag (32 hex chars) and Content
      ivHex = parts[0];
      const secondPart = parts[1];
      authTagHex = secondPart.substring(0, 32);
      contentHex = secondPart.substring(32);
      console.log('   🛠  Attempting to HEAL corrupt 2-part format...');
    } else if (parts.length === 3) {
      [ivHex, authTagHex, contentHex] = parts;
    } else {
      return null;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(masterKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('   ❌ Healing/Decryption failed:', e.message);
    return null;
  }
}

function encryptSync(text, masterKey) {
  if (!text || !masterKey) return null;
  try {
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(masterKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `ENC:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    return null;
  }
}

// --- 🔍 Environment Loader ---
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      const k = parts[0];
      const v = parts.slice(1).join('=');
      if (k && v) env[k.trim()] = v.trim();
    });
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const masterKey = env.ENCRYPTION_MASTER_KEY;

async function heal() {
  console.log('--- 🛡 Healing Corrupt OpenAI Key ---');
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('system_config').select('*').limit(1).maybeSingle();

  if (error || !data) return;

  const aiKeys = data.config_data.aiKeys;
  const openaiKey = aiKeys.openai;

  if (openaiKey && openaiKey.startsWith('ENC:')) {
    const raw = openaiKey.slice(4);
    const decrypted = decryptSync(raw, masterKey);
    if (decrypted) {
      console.log('✅ SUCCESS: Key healed and decrypted! Re-encrypting in correct format...');
      const reEncrypted = encryptSync(decrypted, masterKey);
      if (reEncrypted) {
        data.config_data.aiKeys.openai = reEncrypted;
        await supabase.from('system_config').update({ config_data: data.config_data }).eq('id', data.id);
        console.log('✨ SUCCESS: All fixed.');
      }
    } else {
      console.log('❌ UNRECOVERABLE: The key is too far gone. Human intervention required.');
    }
  }
}

heal();
