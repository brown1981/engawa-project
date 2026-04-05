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
    const from = message.from || "unknown-sender";
    const subject = message.headers?.get('subject') || '(No Subject)';
    console.log(`📨 Inbound Email: ${from} | Subject: ${subject}`);
    
    try {
      // (1) 指定されたアドレスへ自動転送
      if (env.FORWARD_TO_EMAIL) {
        try {
          await message.forward(env.FORWARD_TO_EMAIL);
          console.log(`✅ Forwarded to: ${env.FORWARD_TO_EMAIL}`);
        } catch (fwdErr: any) {
          console.error(`⚠️ Forwarding failed (Make sure the destination is verified): ${fwdErr.message}`);
          // 転送失敗しても DB 保存は続行
        }
      }

      // (2) Supabase への保存
      const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ DB Insert Aborted: Missing Supabase Credentials in Env Vars.");
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      let bodyText = "[Body extraction failed]";
      try {
        bodyText = (await new Response(message.raw).text()) || "[Empty Body]";
      } catch (readErr) {}

      const { data, error } = await supabase
        .from('emails')
        .insert([
          {
            from_address: from,
            to_address: message.to || "unknown-recipient",
            subject: subject,
            body_text: bodyText,
            metadata: {
              source: "cloudflare-native-worker",
              forwarded: !!env.FORWARD_TO_EMAIL,
              timestamp: new Date().toISOString()
            }
          }
        ])
        .select();

      if (error) {
        console.error("❌ DB Insert Failed:", JSON.stringify(error));
      } else {
        console.log(`✨ DB Saved: Record ID ${data?.[0]?.id || 'unknown'}`);
      }

    } catch (globalErr: any) {
      console.error("❌ Fatal Error in Email Handler:", globalErr.message || globalErr);
    }
  }
};
