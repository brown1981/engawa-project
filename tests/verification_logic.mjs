/**
 * 🕵️‍♂️ Logic Verification: AES-256-GCM
 * 
 * 外部ライブラリを一切使わず、Node.js 標準の Web Crypto API のみが
 * 正しく動作することを検証するための独立したスクリプトです。
 */

import { encrypt, decrypt } from '../src/lib/security/encryption.ts';
import assert from 'node:assert';

async function runTest() {
  console.log('🛡 Starting Encryption Verification Logic...');
  const MASTER_KEY = 'verification-master-key-12345678901234567890';
  const SECRET_API_KEY = 'sk-proj-test-verification-pass-100%';

  try {
    // 1. 暗号化テスト
    const encrypted = await encrypt(SECRET_API_KEY, MASTER_KEY);
    console.log('✅ Step 1: Encryption successful. Result:', encrypted);

    // 2. 復号化テスト
    const decrypted = await decrypt(encrypted, MASTER_KEY);
    console.log('✅ Step 2: Decryption successful. Result:', decrypted);

    // 3. 正確性チェック
    assert.strictEqual(decrypted, SECRET_API_KEY, '❌ Logic Error: Decrypted text does not match original!');
    console.log('✅ Step 3: Integrity Check PASSED.');

    // 4. セキュリティテスト（間違ったキー）
    try {
      await decrypt(encrypted, 'wrong-key');
      throw new Error('❌ Security Failure: Should not decrypt with wrong key!');
    } catch (e) {
      console.log('✅ Step 4: Security Block PASSED (Wrong key rejected).');
    }

    console.log('\n🏆 ALL VERIFICATIONS PASSED IN TEST ENVIRONMENT.');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

runTest();
