import { NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '../../../lib/security/encryption';

export const runtime = 'edge';

/**
 * 🩺 Engawa Security Diagnostics
 * 
 * 本番環境での環境変数の読み込み状態と、暗号化ロジックの整合性をチェックします。
 */
export async function GET(request: NextRequest) {
  try {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || '';
    
    // セキュリティのため、キーそのものは隠し、ハッシュ値のみを確認
    const hashUnprocessed = masterKey 
        ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(masterKey))
        : null;
    
    const hash = hashUnprocessed
        ? Array.from(new Uint8Array(hashUnprocessed)).map(x => x.toString(16).padStart(2, '0')).join('')
        : 'NOT SET';

    const testText = "Engawa Connection Test";
    let encryptionTest = "STAGED";
    let decryptionTest = "STAGED";

    const encrypted = await encrypt(testText, masterKey);
    encryptionTest = "SUCCESS ✅";
    
    const decrypted = await decrypt(encrypted, masterKey);
    decryptionTest = (decrypted === testText) ? "SUCCESS ✅" : "FAILED ❌ (Mismatch)";

    return NextResponse.json({
        status: masterKey ? "ONLINE" : "OFFLINE (No Master Key)",
        masterKeyPresent: !!masterKey,
        masterKeyHash: hash,
        encryptionTest,
        decryptionTest,
        note: "If hash is 'NOT SET' or doesn't match local, decryption will always fail."
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "CRITICAL_ERROR",
      message: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
