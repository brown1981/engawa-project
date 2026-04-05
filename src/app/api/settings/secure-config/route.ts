import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from '../../../../lib/security/encryption';

/**
 * 🔒 Secure Configuration API
 * 
 * ダッシュボードからの機密設定を暗号化して保存、
 * またはマスクされた安全な形式で取得します。
 */

export const dynamic = 'force-dynamic';

// Supabase クライアントの遅延初期化
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production.');
    }
    // ビルド中や開発中は、初期化せず null を返すかダミーを返すことでクラッシュを防ぐ
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-not-for-production';

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ config_data: {} });

    const config = data.config_data || {};
    const aiKeys = config.aiKeys || {};

    // 取得時はキーを「マスク」して返す（ブラウザに生データは流さない）
    const maskedAiKeys: Record<string, string> = {};
    for (const [provider, key] of Object.entries(aiKeys)) {
      if (typeof key === 'string' && key.startsWith('ENC:')) {
        try {
          const decrypted = await decrypt(key.slice(4), masterKey);
          maskedAiKeys[provider] = `${decrypted.slice(0, 5)}****************`;
        } catch (e) {
          maskedAiKeys[provider] = '[ERROR: Decryption Failed]';
        }
      } else if (key) {
        maskedAiKeys[provider] = '**************** (Raw)';
      } else {
        maskedAiKeys[provider] = '';
      }
    }

    return NextResponse.json({
      config_data: {
        ...config,
        aiKeys: maskedAiKeys
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { config } = await req.json();
    if (!config) throw new Error('Missing configuration data');

    console.log('--- 🔐 Secure Config Update Started ---');
    
    // 保存前に API キーを暗号化
    const aiKeys = config.aiKeys || {};
    const encryptedAiKeys: Record<string, string> = {};

    for (const [provider, key] of Object.entries(aiKeys)) {
      if (typeof key === 'string' && key.trim() !== '') {
        // すでにマスクされた値を送ってきた場合は、既存の値を維持するためにスキップ
        if (key.includes('****')) {
          console.log(`[Skip] Provider ${provider} has masked value, maintaining current DB value.`);
          continue; 
        }
        
        // 新規入力された「生」のキーを暗号化
        console.log(`[Encrypt] Encrypting new key for provider: ${provider}`);
        const encrypted = await encrypt(key, masterKey);
        encryptedAiKeys[provider] = `ENC:${encrypted}`;
      }
    }

    // 最新の全設定をマージ（上書きを防ぐため、一度取得してから更新）
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Database configuration missing');

    const { data: configData, error: fetchError } = await supabase.from('system_config').select('*').limit(1).maybeSingle();
    if (fetchError) console.error('⚠️ Fetch Error during merge:', fetchError);

    if (!configData) {
      console.error('❌ [Diagnostics] system_config record (ID=1) NOT FOUND IN DB.');
      return NextResponse.json({ success: false, error: 'データベースに設定レコードが見つかりません。まず[Save]を押して初期化してください。' });
    }

    const currentAiKeys = configData?.config_data?.aiKeys || {};
    
    const finalAiKeys = {
      ...currentAiKeys,      // 前回の全キー（ENC:付き含む）
      ...encryptedAiKeys    // 今回新しく入力されたキー（ENC:付き）
    };

    const finalConfigData = {
      ...(configData?.config_data || {}),
      ...config,
      aiKeys: finalAiKeys
    };

    console.log('[Save] Attempting upsert to id: 1...');
    const { error } = await supabase
      .from('system_config')
      .upsert({ id: 1, config_data: finalConfigData });

    if (error) {
       console.error('❌ Upsert Error Details:', error);
       throw new Error(`Database Upsert Failed: ${error.message} (Hint: Check RLS policies)`);
    }

    console.log('--- ✅ Secure Config Update Finished Successfully ---');
    return NextResponse.json({ success: true, message: 'Settings encrypted and saved successfully.' });

  } catch (err: any) {
    console.error('❌ POST /api/settings/secure-config error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
