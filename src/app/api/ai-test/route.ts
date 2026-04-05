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
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || '';
    
    if (!masterKey) console.warn('⚠️ [Diagnostics/Chat] ENCRYPTION_MASTER_KEY is NOT set!');

    const { decrypt } = await import('../../../lib/security/encryption');

    const getSecureKey = async (raw: string | undefined): Promise<string> => {
      if (!raw) {
        console.warn('⚠️ [Diagnostics] Raw key from DB is empty.');
        return '';
      }
      if (raw.startsWith('ENC:')) {
        try {
          console.log('[Diagnostics] Attempting to decrypt ENC key...');
          const decrypted = await decrypt(raw.slice(4), masterKey);
          console.log('[Diagnostics] Decryption successful.');
          return decrypted;
        } catch (e: any) {
          console.error('❌ [Diagnostics/Chat] Decryption failed:', e.message);
          return '';
        }
      }
      console.log('[Diagnostics] Using legacy plain-text key.');
      return raw;
    };

    if (provider === 'openai') {
      const apiKey = await getSecureKey(aiKeys.openai);
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
      const apiKey = await getSecureKey(aiKeys.anthropic);
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
