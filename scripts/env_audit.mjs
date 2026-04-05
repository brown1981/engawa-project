import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

async function auditEnvironment() {
  console.log('--- 🛡 Environment & Access Audit ---');

  // 1. .env.local の物理的な存在確認
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local exists.');
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('ENCRYPTION_MASTER_KEY in file:', content.includes('ENCRYPTION_MASTER_KEY') ? 'PRESENT ✅' : 'MISSING ❌');
  } else {
    console.log('❌ .env.local NOT FOUND at root.');
  }

  // 2. 実行中の process.env の確認
  console.log('\n--- 🔋 Runtime Env Audit ---');
  console.log('ENCRYPTION_MASTER_KEY:', process.env.ENCRYPTION_MASTER_KEY ? 'DEFINED ✅' : 'UNDEFINED ❌');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED ✅' : 'UNDEFINED ❌');

  // 3. 鍵の形式チェック（DBを模倣）
  // ※ここではDB接続はせず、環境変数の整合性のみを確認します。
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    console.log('\n🚨 [CONCLUSION] The program cannot decrypt keys because the MASTER KEY is missing from the environment.');
  } else {
    console.log('\n✨ All environment configs appear healthy from here.');
  }
}

auditEnvironment();
