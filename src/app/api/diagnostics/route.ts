import { NextRequest, NextResponse } from 'next/server';

/**
 * 🩺 Engawa Security Diagnostics (Ultra-compatible Mode)
 * 
 * ランタイムに依存せず、環境変数の状態のみを確実に報告します。
 */
export async function GET(request: NextRequest) {
  try {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || '';
    
    // Web Crypto が使えない場合も想定して、手動でハッシュ計算を試みる
    let hash = "CALCULATING...";
    
    if (!masterKey) {
      hash = "NOT SET";
    } else {
        // 最も互換性の高い方法でハッシュ値（指紋）を算出
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(masterKey);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            hash = Array.from(new Uint8Array(hashBuffer)).map(x => x.toString(16).padStart(2, '0')).join('');
        } catch (e: any) {
            hash = `ERROR_DURING_HASH: ${e.message}`;
        }
    }

    return NextResponse.json({
        status: masterKey ? "ONLINE" : "OFFLINE (No Master Key)",
        masterKeyPresent: !!masterKey,
        masterKeyHash: hash,
        note: "Target Hash: ee9eabe7238f911b8ea24abe37a51edf29993ffdf1cc2c3805684eff756aa5a8"
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "DIAGNOSTICS_FAILED",
      message: err.message
    }, { status: 500 });
  }
}
