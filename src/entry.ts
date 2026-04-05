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
    console.log("--- 📨 Native Email Handler Started ---");
    
    try {
      const from = message.from || "unknown-sender";
      const to = message.to || "unknown-recipient";
      const subject = message.headers?.get('subject') || '(No Subject)';
      
      console.log(`[Step 1] Basic Info: From=${from}, Subject=${subject}`);

      // 診断用：現在 Worker が認識している「カギの名前」をすべてリストアップ
      const availableKeys = Object.keys(env || {});
      console.log(`[Diagnostic] Available Env Keys: ${availableKeys.join(", ") || "(None)"}`);

      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[Error] Missing Env Vars. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        return; // 静かに終了して Dropped を回避
      }

      // Supabase クライアントの初期化を慎重に行う
      let supabase: any;
      try {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
        console.log("[Step 2] Supabase Client Initialized");
      } catch (clientErr: any) {
        console.error("[Error] Supabase client init failed:", clientErr.message);
        return;
      }

      // メール本文の読み込み (ここがエラーの原因になりやすいため、徹底的にガード)
      let bodyText = "Extracting body...";
      try {
        const rawContent = await new Response(message.raw).text();
        bodyText = rawContent || "[Empty Body]";
        console.log(`[Step 3] Body Extracted: ${bodyText.length} bytes`);
      } catch (readErr: any) {
        console.error("[Error] Body read failed:", readErr.message);
        bodyText = "[Failed to read email body content]";
      }

      // Supabase への書き込み
      console.log("[Step 4] Attempting Database Insert...");
      const { data, error } = await supabase
        .from('emails')
        .insert([
          {
            from_address: from,
            to_address: to,
            subject: subject,
            body_text: bodyText,
            metadata: {
              native_worker_v2: true,
              timestamp: new Date().toISOString()
            }
          }
        ])
        .select();

      if (error) {
        console.error("[Error] DB Insert Failed:", JSON.stringify(error));
      } else {
        console.log(`[Step 5] SUCCESS! New record ID: ${data?.[0]?.id || 'unknown'}`);
      }

    } catch (globalErr: any) {
      console.error("❌ FATAL CRASH in email handler:", globalErr.message || globalErr);
    }
    
    console.log("--- 📨 Native Email Handler Finished ---");
  }
};
