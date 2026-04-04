import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



/**
 * 🔌 Engawa Cycle: AI Connection Test Route
 * 
 * ConfigModal の「接続テスト」ボタンから呼ばれる軽量エンドポイント。
 * 保存されたAPIキーが有効かどうかを確認するだけ（本格的な思考はしない）。
 */
export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json() as { provider: 'openai' | 'anthropic' };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: configData } = await supabase
      .from('system_config')
      .select('config_data')
      .limit(1)
      .maybeSingle();

    const aiKeys = configData?.config_data?.aiKeys || {};

    if (provider === 'openai') {
      const apiKey: string = aiKeys.openai || '';
      if (!apiKey || apiKey.length < 20) {
        return NextResponse.json({ success: false, error: 'OpenAI APIキーが設定されていません' });
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
          max_tokens: 5,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as any;
        return NextResponse.json({ success: false, error: err.error?.message || 'OpenAI接続エラー' });
      }
      return NextResponse.json({ success: true, message: 'OpenAI接続確認済み ✅' });

    } else if (provider === 'anthropic') {
      const apiKey: string = aiKeys.anthropic || '';
      if (!apiKey || apiKey.length < 20) {
        return NextResponse.json({ success: false, error: 'Anthropic APIキーが設定されていません' });
      }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
          max_tokens: 5,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as any;
        return NextResponse.json({ success: false, error: err.error?.message || 'Anthropic接続エラー' });
      }
      return NextResponse.json({ success: true, message: 'Anthropic (Claude) 接続確認済み ✅' });
    }

    return NextResponse.json({ success: false, error: '不明なプロバイダー' }, { status: 400 });

  } catch (err) {
    console.error('❌ /api/ai-test error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
