-- ==========================================
-- 🏗️ Engawa Cycle - Email Infrastructure v1
-- ==========================================

-- 1. メールテーブルの作成
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. セキュリティ強化：RLS の有効化
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- 3. セキュリティポリシーの定義
-- ※ 閲覧は認証済み（大城様）のみ
CREATE POLICY "Allow read access to authenticated users" ON public.emails FOR SELECT USING (auth.role() = 'authenticated');

-- ※ 外部からの Webhook 書き込み（サービスロール等によるバイパスを想定）
-- もしくは特定の API Route からの INSERT を許可するためのポリシー
CREATE POLICY "Allow service role insert access" ON public.emails FOR INSERT WITH CHECK (true);

-- 4. リアルタイム配信の設定
ALTER PUBLICATION supabase_realtime ADD TABLE emails;
