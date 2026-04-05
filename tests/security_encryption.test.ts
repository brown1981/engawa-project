import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encrypt, decrypt } from '../src/lib/security/encryption.js';

describe('Engawa Security: Encryption Provider', () => {
  const MASTER_KEY = 'test-master-key-perfectly-secure-long-string';
  const WRONG_KEY = 'wrong-master-key-is-unauthorized';

  it('should encrypt and decrypt a message correctly', async () => {
    const originalText = 'sk-proj-openai-api-key-12345';
    const encrypted = await encrypt(originalText, MASTER_KEY);
    
    // 正しいキーで復号化
    const decrypted = await decrypt(encrypted, MASTER_KEY);
    assert.strictEqual(decrypted, originalText);
  });

  it('should fail to decrypt with the wrong key', async () => {
    const originalText = 'sk-ant-anthropic-api-key-67890';
    const encrypted = await encrypt(originalText, MASTER_KEY);
    
    // 間違ったキーで復号化を試みる
    await assert.rejects(async () => {
      await decrypt(encrypted, WRONG_KEY);
    });
  });

  it('should generate different ciphertexts for the same input (Randomness)', async () => {
    const text = 'consistent-test-string';
    const encrypted1 = await encrypt(text, MASTER_KEY);
    const encrypted2 = await encrypt(text, MASTER_KEY);
    
    // 同じ文字でも暗号化の結果（IVが違うため）が異なることを確認
    assert.notStrictEqual(encrypted1, encrypted2);
    
    // しかし、両方とも正しく復号化できること
    assert.strictEqual(await decrypt(encrypted1, MASTER_KEY), text);
    assert.strictEqual(await decrypt(encrypted2, MASTER_KEY), text);
  });

  it('should handle complex characters (UTF-8)', async () => {
    const complexText = '暗号化テスト: 🔑 日本語 & Emoji 🚀';
    const encrypted = await encrypt(complexText, MASTER_KEY);
    const decrypted = await decrypt(encrypted, MASTER_KEY);
    
    assert.strictEqual(decrypted, complexText);
  });
});
