import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 🔧 Fix: 環境変数が未設定、または説明文（日本語等）が誤って入力されている場合のクラッシュを防ぐ。
// HTTPヘッダーに使用できない文字（全角等）が含まれている場合はプレースホルダーに差し替える。
const isValidKey = (key: string) => key && /^[A-Za-z0-9-_=.]+$/.test(key);

if (!supabaseUrl || !isValidKey(supabaseAnonKey)) {
  console.error('❌ CRITICAL: Supabase environment variables are missing or invalid (Non-ASCII characters detected).');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  isValidKey(supabaseAnonKey) ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      // 環境変数未設定時は自動リフレッシュを無効化しハングを防ぐ
      autoRefreshToken: !!supabaseUrl,
      persistSession: !!supabaseUrl,
    }
  }
);
