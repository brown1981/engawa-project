import fs from 'fs';
import path from 'path';

async function auditEnvironment() {
  console.log('--- 🛡 Environment & Access Audit (Pure JS) ---');

  // 1. .env.local の物理的な存在確認と合鍵の有無
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local exists.');
    const content = fs.readFileSync(envPath, 'utf8');
    
    // キーが定義されているか、値があるかを確認
    const hasKey = content.includes('ENCRYPTION_MASTER_KEY');
    const hasValue = /ENCRYPTION_MASTER_KEY\s*=\s*.+/.test(content);
    
    console.log('ENCRYPTION_MASTER_KEY defined:', hasKey ? 'YES ✅' : 'NO ❌');
    console.log('ENCRYPTION_MASTER_KEY has value:', hasValue ? 'YES ✅' : 'NO ❌');
  } else {
    console.log('❌ .env.local NOT FOUND at root.');
  }

  // 2. 実行中の process.env の確認（Node.js が認識しているか）
  console.log('\n--- 🔋 Runtime Env Audit ---');
  console.log('ENCRYPTION_MASTER_KEY:', process.env.ENCRYPTION_MASTER_KEY ? 'RECOGNIZED ✅' : 'NOT RECOGNIZED ❌');
  
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    console.log('\n🚨 [CONCLUSION] The AI Brain is failing because the MASTER KEY is missing from the environment.');
  }
}

auditEnvironment();
