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
    const from = message.from || "送信元不明";
    const subject = message.headers?.get('subject') || '(件名なし)';
    console.log(`📨 メール受信: ${from} | 件名: ${subject}`);
    
    try {
      // (1) 指定されたアドレスへ自動転送
      if (env.FORWARD_TO_EMAIL) {
        try {
          await message.forward(env.FORWARD_TO_EMAIL);
          console.log(`✅ 転送完了: ${env.FORWARD_TO_EMAIL}`);
        } catch (fwdErr: any) {
          console.error(`⚠️ 転送失敗 (転送先アドレスが正しく登録されているか確認ください): ${fwdErr.message}`);
          // 転送に失敗してもデータベースへの保存は続行します
        }
      }

      // (2) Supabase への保存
      const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ 保存中止: Supabase の接続情報が環境変数に見つかりません。");
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      let bodyText = "[本文の抽出に失敗しました]";
      try {
        bodyText = (await new Response(message.raw).text()) || "[本文なし]";
      } catch (readErr) {}

      const { data, error } = await supabase
        .from('emails')
        .insert([
          {
            from_address: from,
            to_address: message.to || "宛先不明",
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
        console.error("❌ DB保存失敗:", JSON.stringify(error));
      } else {
        console.log(`✨ DB保存成功: ID ${data?.[0]?.id || 'unknown'}`);
      }

    } catch (globalErr: any) {
      console.error("❌ メール処理中に致命的なエラーが発生しました:", globalErr.message || globalErr);
    }
  }
};
