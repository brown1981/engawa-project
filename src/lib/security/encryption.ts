/**
 * 🛡 Engawa Security: AES-256-GCM Encryption Provider
 * 
 * このモジュールは、APIキーなどの機密情報を安全に暗号化・復号化します。
 * Cloudflare Workers (Web Crypto API) および Node.js 環境の両方で動作します。
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // GCM 推奨の初期化ベクトル長
const KEY_ALGO = { name: ALGORITHM, length: 256 };

/**
 * マスターキー（環境変数）から CryptoKey を生成
 */
async function getCryptoKey(masterKeyStr: string): Promise<CryptoKey> {
  if (!masterKeyStr || masterKeyStr.length < 8) {
    throw new Error('ENCRYPTION_MASTER_KEY is missing or too short. Check your Cloudflare environment variables.');
  }
  
  // 文字列を 32バイト (256ビット) の Uint8Array に変換
  const encoder = new TextEncoder();
  const keyData = encoder.encode(masterKeyStr.padEnd(32, '0').slice(0, 32));
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    KEY_ALGO,
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * テキストを暗号化
 * 出力形式: [iv(hex)]:[ciphertext(hex)]
 */
export async function encrypt(text: string, masterKey: string): Promise<string> {
  try {
    const key = await getCryptoKey(masterKey);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(text);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded
    );
    
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const cipherHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${ivHex}:${cipherHex}`;
  } catch (err: any) {
    console.error('❌ Encryption Error:', err.message);
    throw err;
  }
}

/**
 * 暗号化されたテキストを復号化
 */
export async function decrypt(encryptedText: string, masterKey: string): Promise<string> {
  try {
    const [ivHex, cipherHex] = encryptedText.split(':');
    if (!ivHex || !cipherHex) throw new Error('Invalid encrypted text format (missing colon or hex strings)');
    
    const key = await getCryptoKey(masterKey);
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (err: any) {
    console.error('❌ Decryption Error:', err.message);
    throw err;
  }
}
