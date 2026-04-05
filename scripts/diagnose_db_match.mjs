import { createClient } from '@supabase/supabase-js';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- 🛡 Self-contained Encryption/Decryption Logic ---
function encryptSync(text, masterKey) {
  if (!text || !masterKey) return null;
  try {
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(masterKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: ENC:IV(12b):Tag(16b):Ciphertext
    return `ENC:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error('   ❌ Encryption Error:', e.message);
    return null;
  }
}

function decryptSync(encryptedText, masterKey) {
  if (!encryptedText || !masterKey) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        console.error('   ❌ Decryption Format Error: Expected 3 parts, got', parts.length);
        return null;
    }
    const [ivHex, authTagHex, contentHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(masterKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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

async function diagnose() {
  console.log('--- 🔍 Final Evidence Discovery: DB & Match Check ---');
  console.log('Master Key Loaded:', masterKey ? 'YES' : 'NO');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('system_config').select('*').limit(1).maybeSingle();

  if (error) {
    console.error('❌ DB Context Error:', error.message);
    return;
  }

  if (!data) {
    console.log('⚠️ INFO: system_config table is EMPTY.');
    return;
  }

  let needsUpdate = false;
  const config = data.config_data;

  // 1. AI Keys Analysis
  console.log('\n--- 🔑 AI Keys Analysis ---');
  if (config.aiKeys) {
    for (const [provider, key] of Object.entries(config.aiKeys)) {
      if (typeof key === 'string' && key.startsWith('ENC:')) {
        const decrypted = decryptSync(key.slice(4), masterKey);
        if (decrypted) {
          console.log(`[${provider}] ✅ Encrypted & Decryptable`);
        } else {
          console.log(`[${provider}] ❌ Encrypted but Decryption FAILED (Corrupt or Wrong Key)`);
          // 特別に平文に戻すか再暗号化が必要な場合はここで介入
        }
      } else if (key && typeof key === 'string' && key.trim() !== '' && !key.includes('replace-me')) {
        console.log(`[${provider}] 🛠  Plain text detected. Encrypting...`);
        const encrypted = encryptSync(key, masterKey);
        if (encrypted) {
          config.aiKeys[provider] = encrypted;
          needsUpdate = true;
          console.log(`   ✅ Done.`);
        }
      } else {
        console.log(`[${provider}] - Skipping (Empty/Placeholder)`);
      }
    }
  }

  // 2. F2Pool Mining Analysis
  console.log('\n--- ⛏ F2Pool Settings Analysis ---');
  if (config.miningPool) {
    const mp = config.miningPool;
    if (mp.apiKey && typeof mp.apiKey === 'string' && mp.apiKey.trim() !== '') {
      if (mp.apiKey.startsWith('ENC:')) {
        const decrypted = decryptSync(mp.apiKey.slice(4), masterKey);
        if (decrypted) {
          console.log(`[API Key] ✅ Encrypted & Decryptable`);
        } else {
          console.log(`[API Key] ❌ Encrypted but Decryption FAILED`);
        }
      } else {
        console.log(`[API Key] 🛠  Plain text detected. Encrypting...`);
        const encrypted = encryptSync(mp.apiKey, masterKey);
        if (encrypted) {
          mp.apiKey = encrypted;
          needsUpdate = true;
          console.log(`   ✅ Done.`);
        }
      }
    } else {
      console.log(`[API Key] - Skipping (Empty)`);
    }
  }

  if (needsUpdate) {
    console.log('\n--- 📤 Updating Supabase ---');
    const { error: updateError } = await supabase
      .from('system_config')
      .update({ config_data: config })
      .eq('id', data.id);

    if (updateError) {
      console.error('❌ Update Failed:', updateError.message);
    } else {
      console.log('✨ SUCCESS: Database has been updated with encrypted keys.');
    }
  } else {
    console.log('\n✨ Everything is in order. No updates needed.');
  }
}

diagnose();
