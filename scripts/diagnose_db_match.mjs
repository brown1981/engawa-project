import { createClient } from '@supabase/supabase-js';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * 🛡 Engawa Security: AES-256-GCM (Worker Compatible Logic)
 * 
 * src/lib/security/encryption.ts のロジックと完全に一致させ、
 * Cloudflare Workers 上で復号できるようにします。
 */

function getCryptoKey(masterKeyStr) {
  // Web Crypto の実装に合わせる: padEnd(32)
  const keyData = Buffer.alloc(32, 0); // ゼロで埋める
  const buf = Buffer.from(masterKeyStr, 'utf8');
  buf.copy(keyData, 0, 0, Math.min(buf.length, 32));
  return keyData;
}

function encryptSync(text, masterKeyStr) {
  if (!text || !masterKeyStr) return null;
  try {
    const key = getCryptoKey(masterKeyStr);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    const ivHex = iv.toString('hex');
    // Web Crypto 互換: Ciphertext + AuthTag (16bytes/32chars) を連結
    return `ENC:${ivHex}:${encrypted}${authTag}`;
  } catch (e) {
    console.error('   ❌ Encryption Error:', e.message);
    return null;
  }
}

function decryptSync(encryptedText, masterKeyStr) {
  if (!encryptedText || !masterKeyStr) return null;
  try {
    const [ivHex, combinedHex] = encryptedText.split(':');
    if (!ivHex || !combinedHex) return null;

    const key = getCryptoKey(masterKeyStr);
    const iv = Buffer.from(ivHex, 'hex');
    
    // 末尾 16バイト (32文字) が AuthTag
    const authTagHex = combinedHex.slice(-32);
    const contentHex = combinedHex.slice(0, -32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
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
  console.log('--- 🔍 Final Evidence Discovery: DB & Match Check (Worker Mode) ---');
  console.log('Master Key Loaded:', masterKey ? 'YES' : 'NO');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('system_config').select('*').limit(1).maybeSingle();

  if (error || !data) {
    console.error('❌ DB Context Error or Empty Table.');
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
          console.log(`[${provider}] ✅ Encrypted & Decryptable (Verified)`);
        } else {
          console.log(`[${provider}] ❌ Format mismatch or Corrupt. Forcing re-encryption...`);
          // ここで「壊れたキー」を一旦無視し、平文のバックアップがないか探す。
          // 無い場合はプレースホルダーにして再入力を促す。
          config.aiKeys[provider] = 'sk-replace-this-now';
          needsUpdate = true;
        }
      } else if (key && typeof key === 'string' && key.trim() !== '' && !key.includes('replace-me')) {
        console.log(`[${provider}] 🛠  Plain text detected. Encrypting (Worker Format)...`);
        const encrypted = encryptSync(key, masterKey);
        if (encrypted) {
          config.aiKeys[provider] = encrypted;
          needsUpdate = true;
          console.log(`   ✅ Done.`);
        }
      }
    }
  }

  // 2. F2Pool Mining Analysis
  console.log('\n--- ⛏ F2Pool Settings Analysis ---');
  if (config.miningPool) {
    const mp = config.miningPool;
    if (mp.apiKey && mp.apiKey.trim() !== '') {
      const decrypted = mp.apiKey.startsWith('ENC:') ? decryptSync(mp.apiKey.slice(4), masterKey) : mp.apiKey;
      if (decrypted && !mp.apiKey.startsWith('ENC:')) {
        console.log(`[API Key] 🛠  Encrypting (Worker Format)...`);
        const encrypted = encryptSync(decrypted, masterKey);
        if (encrypted) {
          mp.apiKey = encrypted;
          needsUpdate = true;
          console.log(`   ✅ Done.`);
        }
      } else if (decrypted) {
          // すでに正しい形式で暗号化されているか、古い形式かチェック
          // ここでは一旦すべて再暗号化して「本体と同じルール」を強制します。
          console.log(`[API Key] 🛠  Refreshing Encryption...`);
          const encrypted = encryptSync(decrypted, masterKey);
          if (encrypted) {
            mp.apiKey = encrypted;
            needsUpdate = true;
            console.log(`   ✅ Verified & Refreshed.`);
          }
      }
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
      console.log('✨ SUCCESS: Database has been updated with Worker-compatible keys.');
    }
  } else {
    console.log('\n✨ Everything is in order.');
  }
}

diagnose();
