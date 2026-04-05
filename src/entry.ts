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
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing in env');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      const subject = message.headers.get('subject') || '(No Subject)';
      const from = message.from;
      const to = message.to;
      
      // メール本文の読み込み (簡易的なテキスト抽出)
      // より高度なパースが必要な場合は postal-mime などの導入を検討
      const rawEmail = await new Response(message.raw).text();
      
      // Supabase の emails テーブルに保存
      const { error } = await supabase
        .from('emails')
        .insert([
          {
            from_address: from,
            to_address: to,
            subject: subject,
            body_text: rawEmail, // 生のデータを一旦保存 (後にAIで解析)
            metadata: {
              native_worker: true,
              received_at: new Date().toISOString()
            }
          }
        ]);

      if (error) {
        console.error('❌ Failed to store email in Supabase:', error);
      } else {
        console.log(`✅ Email from ${from} stored successfully via native handler.`);
      }

    } catch (err) {
      console.error('❌ Error in email handler:', err);
    }
  }
};
