-- ==========================================
-- 🏗️ Engawa Cycle - Master Schema v2 (Production Ready)
-- ==========================================

-- 1. テーブルのクリーンアップ（既存のものを一旦整理）
-- DROP TABLE IF EXISTS public.agents CASCADE;
-- DROP TABLE IF EXISTS public.kpis CASCADE;
-- DROP TABLE IF EXISTS public.messages CASCADE;

-- 2. エージェント情報のマスターテーブル
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_active TIMESTAMPTZ DEFAULT NOW(),
    model TEXT NOT NULL,
    current_task TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KPI（重要指標）のマスターテーブル
CREATE TABLE IF NOT EXISTS public.kpis (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    target NUMERIC DEFAULT 0,
    unit TEXT,
    trend TEXT DEFAULT 'neutral',
    color TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 意思決定ログ（メッセージ）のマスターテーブル
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    agent_name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. セキュリティ強化：Row Level Security (RLS) の有効化
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. セキュリティポリシーの定義（基本：閲覧は誰でも、書き込みは大城様のみ）
-- ※ 匿名ユーザー (anon) は読み取り専用
CREATE POLICY "Allow public read access" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.kpis FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.messages FOR SELECT USING (true);

-- ※ 認証済みユーザー（大城様）はすべての操作が可能
CREATE POLICY "Allow full access to authenticated users" ON public.agents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.kpis FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.messages FOR ALL USING (auth.role() = 'authenticated');

-- 7. リアルタイム配信（レプリケーション）の再設定
-- 一旦パブリケーションをリセットして、正確に登録します
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE agents, kpis, messages;

-- 8. 自動更新トリガー（updated_at の自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_modtime BEFORE UPDATE ON agents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kpis_modtime BEFORE UPDATE ON kpis FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
