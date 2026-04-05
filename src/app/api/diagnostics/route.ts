import { NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '../../../lib/security/encryption';

/**
 * 🩺 Engawa Security Diagnostics
 * 
 * 本番環境での環境変数の読み込み状態と、暗号化ロジックの整合性をチェックします。
 */
export async function GET(request: NextRequest) {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY || '';
  
  // セキュリティのため、キーそのものは隠し、ハッシュ値のみを確認
  const hash = masterKey 
    ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(masterKey))
        .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''))
    : 'NOT SET';

  const testText = "Engawa Connection Test";
  let encryptionTest = "STAGED";
  let decryptionTest = "STAGED";
  let error = null;

  try {
    const encrypted = await encrypt(testText, masterKey);
    encryptionTest = "SUCCESS ✅";
    
    const decrypted = await decrypt(encrypted, masterKey);
    decryptionTest = (decrypted === testText) ? "SUCCESS ✅" : "FAILED ❌ (Mismatch)";
  } catch (e: any) {
    error = e.message;
  }

  return NextResponse.json({
    status: masterKey ? "ONLINE" : "OFFLINE (No Master Key)",
    masterKeyPresent: !!masterKey,
    masterKeyHash: hash,
    encryptionTest,
    decryptionTest,
    error,
    note: "If hash is 'NOT SET' or doesn't match local, decryption will always fail."
  });
}
