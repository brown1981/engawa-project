import { createClient } from '@supabase/supabase-js';

/**
 * 🛰️ Engawa Core V2: Central Database Client
 * 
 * すべての環境（ローカル、ウェブサイト、バックグラウンドスクリプト）から
 * 共通の Supabase インスタンスにアクセスするための統合クライアント。
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// サービスロールキー（サーバーサイド用）が必要な場合は追加可能
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing. Some features may not work.');
}

// 標準クライアント（ウェブ・パブリック用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 管理用クライアント（バックグラウンドスクリプト・公証用）
export const getAdminClient = () => {
  if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin actions.');
  return createClient(supabaseUrl, supabaseServiceKey);
};
