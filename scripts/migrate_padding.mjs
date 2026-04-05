import { createClient } from '@supabase/supabase-js';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- 🛡 Key Derivation Functions ---
function getOldCryptoKey(masterKeyStr) {
  const keyData = Buffer.alloc(32, 0); // Null padded (Old/Wrong)
  const buf = Buffer.from(masterKeyStr, 'utf8');
  buf.copy(keyData, 0, 0, Math.min(buf.length, 32));
  return keyData;
}

function getNewCryptoKey(masterKeyStr) {
  const padded = masterKeyStr.padEnd(32, '0').slice(0, 32); // '0' padded (New/Correct)
  return Buffer.from(padded, 'utf8');
}

// --- 🛡 Crypto Helper Functions ---
function decryptWithKey(encryptedText, key) {
  try {
    const [ivHex, combinedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
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

function encryptWithKey(text, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `ENC:${iv.toString('hex')}:${encrypted}${authTag}`;
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
const masterKey = env.ENCRYPTION_MASTER_KEY;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function migrate() {
  console.log('--- 🛡 Migrating Encryption Mismatch ---');
  const oldKey = getOldCryptoKey(masterKey);
  const newKey = getNewCryptoKey(masterKey);

  const { data } = await supabase.from('system_config').select('*').limit(1).maybeSingle();
  if (!data) return;

  const config = data.config_data;
  let changed = false;

  // AI Keys Migration
  if (config.aiKeys) {
    for (const [provider, val] of Object.entries(config.aiKeys)) {
      if (typeof val === 'string' && val.startsWith('ENC:')) {
        const raw = val.slice(4);
        console.log(`Checking [${provider}]...`);
        
        // 1. 新しいキーで復号できるかチェック（すでに正しい場合）
        if (decryptWithKey(raw, newKey)) {
          console.log(`   ✅ [${provider}] is already correct.`);
          continue;
        }

        // 2. 古いキーで復号を試みる
        const decrypted = decryptWithKey(raw, oldKey);
        if (decrypted) {
          console.log(`   🔄 [${provider}] Migrating...`);
          config.aiKeys[provider] = encryptWithKey(decrypted, newKey);
          changed = true;
        } else {
          console.log(`   ❌ [${provider}] Could NOT decrypt with old key. (Already corrupt or different key)`);
        }
      }
    }
  }

  // Mining Pool Migration
  if (config.miningPool?.apiKey?.startsWith('ENC:')) {
    const raw = config.miningPool.apiKey.slice(4);
    if (!decryptWithKey(raw, newKey)) {
      const decrypted = decryptWithKey(raw, oldKey);
      if (decrypted) {
        console.log(`   🔄 [MiningPool] Migrating...`);
        config.miningPool.apiKey = encryptWithKey(decrypted, newKey);
        changed = true;
      }
    } else {
        console.log(`   ✅ [MiningPool] is already correct.`);
    }
  }

  if (changed) {
    console.log('\n--- 📤 Saving migrated keys to Supabase ---');
    await supabase.from('system_config').update({ config_data: config }).eq('id', data.id);
    console.log('✨ Migration COMPLETE.');
  } else {
    console.log('\n✨ No keys needed migration.');
  }
}

migrate();
