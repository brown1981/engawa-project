-- ==========================================
-- 🤖 Engawa Cycle - AI Agent V2 Schema
-- 20260404_ai_agent_v2.sql
-- ==========================================

-- 1. システム設定テーブル (APIキーの保存先)
CREATE TABLE IF NOT EXISTS public.system_config (
    id BIGINT PRIMARY KEY DEFAULT 1, -- 常にID=1のレコード1件のみ
    config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APIコスト記録テーブル（コスト可視化の土台）
CREATE TABLE IF NOT EXISTS public.api_cost_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    agent_id TEXT,
    model TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    cost_jpy NUMERIC(10, 4) DEFAULT 0,
    triggered_by TEXT DEFAULT 'commander', -- 'timer' | 'commander' | 'kpi_alert'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 会議ログテーブル（3モードの実行履歴）
CREATE TABLE IF NOT EXISTS public.system_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode TEXT NOT NULL, -- 'report' | 'bid' | 'emergency'
    trigger_type TEXT NOT NULL,
    status TEXT DEFAULT 'running', -- 'running' | 'completed' | 'escalated'
    agenda TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 3. セキュリティ設定（RLS有効化）
ALTER TABLE public.api_cost_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_meetings ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシー（認証済みユーザーのみ全操作可能）
CREATE POLICY "Allow full access to authenticated users"
    ON public.api_cost_logs FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to authenticated users"
    ON public.system_meetings FOR ALL
    USING (auth.role() = 'authenticated');

-- 5. リアルタイム配信の更新（新テーブルを追加）
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
    agents, kpis, messages, api_cost_logs, system_meetings;

-- 6. コスト集計用ビュー（ダッシュボードの表示を高速化）
CREATE OR REPLACE VIEW public.api_cost_summary AS
SELECT
    DATE_TRUNC('day', created_at)   AS day,
    DATE_TRUNC('week', created_at)  AS week,
    DATE_TRUNC('month', created_at) AS month,
    agent_id,
    model,
    triggered_by,
    COUNT(*) AS call_count,
    SUM(tokens_in)  AS total_tokens_in,
    SUM(tokens_out) AS total_tokens_out,
    SUM(cost_jpy)   AS total_cost_jpy,
    AVG(cost_jpy)   AS avg_cost_jpy
FROM public.api_cost_logs
GROUP BY 1, 2, 3, 4, 5, 6;
