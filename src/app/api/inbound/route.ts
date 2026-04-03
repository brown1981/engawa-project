import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 🛰️ Engawa Cycle: Inbound Email Webhook (Resend Bridge)
 * 
 * Resend からの webhook シグナルを受信し、
 * 受信したメールを Supabase の `emails` テーブルに永続化します。
 */

// Supabase クライアントの初期化 (Service Role を使用して RLS をバイパス)
// Next.jsのビルド時に環境変数がなくてもエラーにならないようにフォールバックを設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key-for-build'; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Resend の Inbound Webhook ペイロード形式をパース
    // 参考: https://resend.com/docs/api-reference/webhooks/inbound
    const { from, to, subject, text, html, createdAt } = payload.data || payload;

    if (!from || !to) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Supabase に保存
    const { data, error } = await supabase
      .from('emails')
      .insert([
        {
          from_address: from,
          to_address: Array.isArray(to) ? to.join(', ') : to,
          subject: subject || '(No Subject)',
          body_text: text || '',
          body_html: html || '',
          created_at: createdAt || new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('❌ Failed to store email:', error);
      return NextResponse.json({ error: 'Database insertion failed' }, { status: 500 });
    }

    console.log(`✅ Email from ${from} received and stored.`);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('❌ Inbound Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// OPTIONS メソッドでの CORS 対応 (必要に応じて)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS'
    }
  });
}
