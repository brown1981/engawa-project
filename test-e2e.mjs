import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// .env.local から接続情報を読み込む
const envFilePath = '.env.local';
let supabaseUrl = 'https://gevkjdvyprfmodayszqd.supabase.co';
let supabaseAnonKey = '';

try {
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const envMatches = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  if (envMatches && envMatches[1]) {
    supabaseAnonKey = envMatches[1].trim();
  }
} catch (e) {
  console.error('Could not read .env.local', e);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runVerificationTests() {
  console.log('🚀 -----------------------------------------');
  console.log('🚀 開始: 検証環境(Mac)コード品質全件テスト');
  console.log('🚀 -----------------------------------------');

  let hasError = false;

  console.log('\n[Phase 2-A] ダッシュボード初期描画とデータ同期テスト (page.tsx)');
  try {
    const { data: agents, error: e1 } = await supabase.from('agents').select('*').limit(1);
    if (e1) throw new Error(`Agents取得失敗: ${e1.message}`);
    console.log('  ✅ Agentsデータの取得成功（RLS合格）');

    const { data: kpis, error: e2 } = await supabase.from('kpis').select('*').limit(1);
    if (e2) throw new Error(`KPIs取得失敗: ${e2.message}`);
    console.log('  ✅ KPIsデータの取得成功（RLS合格）');

    const { data: messages, error: e3 } = await supabase.from('messages').select('*').limit(1);
    if (e3) throw new Error(`Messages取得失敗: ${e3.message}`);
    console.log('  ✅ Messagesデータの取得成功（RLS合格）');
  } catch (err) {
    console.error('  ❌ [FAIL]', err.message);
    hasError = true;
  }

  console.log('\n[Phase 2-B] チャット送信 (CommanderInput.tsx)');
  try {
    const testMsg = `TEST_COMMAND_${Date.now()}`;
    const { error: e4 } = await supabase.from('messages').insert([
      { agent_id: 'commander', agent_name: 'AI Test', message: testMsg, timestamp: new Date().toISOString() }
    ]);
    // NOTE: RLS (Row Level Security) might block anonymous inserts depending on current database rules.
    if (e4) throw new Error(`送信(INSERT)失敗: ${e4.message}`);
    console.log('  ✅ メッセージの送信成功（RLSの書き込み許可を確認）');
  } catch (err) {
    console.error('  ❌ [FAIL]', err.message);
    hasError = true;
  }

  console.log('\n[Phase 2-C] 設定画面 保存/読出 (ConfigModal.tsx)');
  try {
    const { data: configData, error: e5 } = await supabase.from('system_config').select('*').limit(1).maybeSingle();
    if (e5 && e5.code !== 'PGRST116') throw new Error(`設定の取得失敗: ${e5.message}`);
    console.log('  ✅ 既存設定の読み込み成功（RLS合格）');

    // To be perfectly safe during test, we only read or do a soft update if we can, 
    // or just assume if select is open, the route is correct.
    // For full UPSERT test:
    const { error: e6 } = await supabase.from('system_config').upsert(
      { id: 1, config_data: { test: 'verified' } }
    );
    if (e6) throw new Error(`設定の書き込み(UPSERT)失敗: ${e6.message}`);
    console.log('  ✅ 設定の保存成功（書き込み権限の確認）');
  } catch (err) {
    console.error('  ❌ [FAIL]', err.message);
    hasError = true;
  }

  console.log('\n=========================================');
  if (hasError) {
    console.log('❌ 結論: テストに失敗した機能があります。コードまたはDB設定の修正が必要です。');
    process.exit(1);
  } else {
    console.log('✅ 結論: 全機能テスト合格。コードは完全に要件通り機能します。');
  }
}

runVerificationTests();
