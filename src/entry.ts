import { createClient } from '@supabase/supabase-js';

// OpenNext が生成するメインの Next.js アプリをインポート
// 注: ビルド時には .open-next/worker.js が存在することを前提とします
// @ts-ignore - ビルド後に生成されるファイルを読み込むため、型チェックをスキップします
import worker from '../.open-next/worker.js';

/**
 * 🛰️ Engawa Cycle: Native Worker Entry Point
 * 
 * このファイルは、画面表示 (Fetch) と メール受信 (Email) の両方を
 * 一つの Worker 内で処理できるように統合するための入り口です。
 */

export default {
  // 1. 通常の Web 画面リクエストを処理 (Next.js)
  async fetch(request: Request, env: any, ctx: any) {
    return worker.fetch(request, env, ctx);
  },

  // 2. Cloudflare から直接送られてくるメールを処理
  async email(message: any, env: any, ctx: any) {
    console.log(`📩 New inbound email received from: ${message.from} to: ${message.to}`);
    
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ CRITICAL: Supabase environment variables are MISSING in Cloudflare Worker settings.');
      console.log('Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the Worker Variables.');
      return;
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const subject = message.headers.get('subject') || '(No Subject)';
      const from = message.from;
      const to = message.to;
      
      console.log(`📝 Parsing email headers. Subject: ${subject}`);
      
      // メール本文の読み込み
      let bodyText = "";
      try {
        bodyText = await new Response(message.raw).text();
        console.log(`📄 Raw body extracted (${bodyText.length} bytes)`);
      } catch (bodyErr) {
        console.error('⚠️ Failed to extract body text, using headers only.');
        bodyText = "[Body extraction failed]";
      }
      
      // Supabase の emails テーブルに保存
      console.log('💾 Attempting to insert into Supabase...');
      const { data, error } = await supabase
        .from('emails')
        .insert([
          {
            from_address: from,
            to_address: to,
            subject: subject,
            body_text: bodyText,
            metadata: {
              native_worker: true,
              received_at: new Date().toISOString(),
              raw_headers: Object.fromEntries(message.headers.entries())
            }
          }
        ]);

      if (error) {
        console.error('❌ Supabase Insertion Error:', JSON.stringify(error));
        // ここでエラーを投げると Cloudflare 側で "Dropped" になる可能性があるため、
      } else {
        // 型エラーを回避するため、安全にログを出力します
        const recordId = (data as any)?.[0]?.id || 'unknown';
        console.log(`✅ SUCCESS: Email stored in record ID: ${recordId}`);
      }

    } catch (err: any) {
      console.error('❌ UNHANDLED EXCEPTION in email handler:', err?.message || err);
    }
  }
};
