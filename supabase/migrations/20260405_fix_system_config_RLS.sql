-- ==========================================
-- 🛡 Fix: Grant permissions for system_config
-- ==========================================

-- 1. system_config テーブルの RLS を明示的に無効化（または匿名許可）
-- 今回は確実に動作させるため、匿名ユーザーに全権限を付与します。

DROP POLICY IF EXISTS "Allow anon ALL on system_config" ON public.system_config;

CREATE POLICY "Allow anon ALL on system_config"
    ON public.system_config FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 念のため、テーブル自体の RLS が有効な場合に備えて
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 2. 既存のレコード (ID=1) が無い場合に備えて初期化
INSERT INTO public.system_config (id, config_data)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. リアルタイム配信に含める
ALTER PUBLICATION supabase_realtime ADD TABLE system_config;
