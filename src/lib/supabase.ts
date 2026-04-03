import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 🔧 Fix: 環境変数が未設定の場合、ビルド時制約のため Cloudflare ではそのままバンドルされる。
// その場合、空 URL の Supabase クライアントが getSession() で永久待機するため、防御的に初期化する。
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Supabase environment variables are not set. Dashboard will show login screen.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // 環境変数未設定時は自動リフレッシュを無効化しハングを防ぐ
      autoRefreshToken: !!supabaseUrl,
      persistSession: !!supabaseUrl,
    }
  }
);
