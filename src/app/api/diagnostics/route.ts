import { NextRequest, NextResponse } from 'next/server';

/**
 * 🩺 Engawa Security Diagnostics (Safe Mode)
 * 
 * 外部ライブラリや高度な計算（crypto等）を一切使わず、
 * 環境変数が「物理的にそこにあるか」だけを報告します。
 */
export async function GET(request: NextRequest) {
  try {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || '';
    
    let display = "NOT SET";
    if (masterKey) {
        // キーの最初と最後だけを表示（指紋の代わり）
        const start = masterKey.substring(0, 4);
        const end = masterKey.substring(masterKey.length - 4);
        display = `${start}...${end} (Length: ${masterKey.length})`;
    }

    return NextResponse.json({
        diagnostics: "ACTIVE",
        masterKeyStatus: masterKey ? "FOUND" : "NOT_FOUND",
        masterKeyPreview: display,
        envKeys: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('URL')),
        help: "If masterKeyStatus is NOT_FOUND, the Cloudflare Secret is missing."
    });
  } catch (err: any) {
    // ここまで来て真っ白になるのを防ぐため、文字として返す
    return new Response(`DIAGNOSTICS_CRASH: ${err.message}`, { status: 500 });
  }
}
