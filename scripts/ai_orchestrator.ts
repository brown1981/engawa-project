import { createClient } from '@supabase/supabase-js';
import * as crypto from 'node:crypto';
import { AgentBrain } from '../src/services/agent_brain';

// --- 🛡 Worker-Compatible Decryption Logic ---
function getCryptoKey(masterKeyStr: string) {
  // Web Crypto の実装 masterKeyStr.padEnd(32, '0').slice(0, 32) に厳密に合わせる
  const padded = masterKeyStr.padEnd(32, '0').slice(0, 32);
  return Buffer.from(padded, 'utf8');
}

function decryptSync(encryptedText: string, masterKeyStr: string) {
  if (!encryptedText || !masterKeyStr) return null;
  try {
    const [ivHex, combinedHex] = encryptedText.split(':');
    if (!ivHex || !combinedHex) return null;

    const key = getCryptoKey(masterKeyStr);
    const iv = Buffer.from(ivHex, 'hex');
    const authTagHex = combinedHex.slice(-32);
    const contentHex = combinedHex.slice(0, -32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}
import { ChatMessage } from '../src/services/llm_client';
import { NotaryService } from '../src/services/notary';
import { F2PoolBridge } from '../src/services/f2pool_bridge';
import { CFOLogic } from '../src/services/cfo_logic';

/**
 * 🛰️ Engawa Cycle: AI Orchestrator V3 (LLM Contextual Intelligence)
 * 
 * リアルタイムのメッセージ監視に加え、過去の対話履歴を考慮した
 * 高度な AI 応答生成と、公証ログ生成を行います。
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('--- 🚀 Engawa AI Orchestrator V3 Starting ---');
console.log('Mode: Dynamic LLM Contextual Analysis + Notarization');

/**
 * 過去の対話履歴を取得する
 */
async function getHistory(limit: number = 10): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('agent_id, message')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Failed to fetch history:', error);
    return [];
  }

  // 時系列順に戻し、役割を LLM 用に変換
  return data.reverse().map(m => ({
    role: m.agent_id === 'commander' ? 'user' : 'assistant',
    content: m.message
  }));
}

/**
 * メッセージの共通処理（保存 ＆ 公証ログ生成）
 */
async function postMessage(agentId: string, agentName: string, message: string) {
  const notaryBlock = NotaryService.prepareNotaryBlock(agentId, message);
  
  const { error } = await supabase
    .from('messages')
    .insert([{
      agent_id: agentId,
      agent_name: agentName,
      message: message,
      timestamp: new Date().toISOString()
    }]);

  if (error) console.error(`❌ Failed to post [${agentName}]:`, error);
  else console.log(`✅ [${agentName}] Message notarized & stored.`);
}

/**
 * ⚡ リアルタイム監視 (Commander Directives with Context)
 */
supabase.channel('autonomous-operations')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
    const newMsg = payload.new;
    
    // 司令官からのメッセージにのみ反応
    if (newMsg.agent_id === 'commander') {
      console.log(`📡 Directive received: "${newMsg.message}"`);
      
      // 1. 文脈（履歴）を取得
      const history = await getHistory(10);
      
      // 2. 思考開始
      console.log(`🧠 AI is thinking with ${history.length} messages of context...`);
      const response = await AgentBrain.decideResponse(newMsg.message, history);
      
      // 3. 応答を公証して保存
      await postMessage(response.agentId, response.agentName, response.message);
    }
  })
  .subscribe();

/**
 * ⏲️ 定期分析 (F2Pool Analysis Cycle)
 */
const ANALYSIS_INTERVAL = 60 * 1000; // 1分間隔

async function runAnalysisLoop() {
  console.log('📈 Running F2Pool Analysis Loop (Database-Driven)...');
  try {
    // 1. 最新の設定をDBから取得
    const { data: configData, error: configError } = await supabase
      .from('system_config')
      .select('config_data')
      .limit(1)
      .maybeSingle();

    if (configError || !configData?.config_data?.miningPool) {
      console.warn('⚠️ Orchestrator: Failed to fetch miningPool config from DB. Falling back.');
    }

    const { miningPool } = configData?.config_data || {};
    const currency = miningPool?.currency || 'bitcoin';
    const accountName = miningPool?.accountName || 'privatebrown';
    let apiKey = miningPool?.apiKey || '';

    // 2. APIキーが暗号化されている場合は復号
    if (apiKey.startsWith('ENC:')) {
      const masterKey = process.env.ENCRYPTION_MASTER_KEY;
      if (!masterKey) {
        console.error('❌ Orchestrator: ENCRYPTION_MASTER_KEY is missing from environment.');
      } else {
        apiKey = decryptSync(apiKey.slice(4), masterKey) || '';
      }
    }

    // 3. F2Poolから統計情報を取得
    const stats = await F2PoolBridge.fetchStats(currency, accountName, apiKey).catch((err) => {
      console.warn(`⚠️ Orchestrator: Fetch failed for ${accountName} (${currency}):`, err.message);
      return {
        hashrate: 0,
        value_24h: 0,
        total_paid: 0,
        status: 'error'
      };
    });

    const analysis = await CFOLogic.analyzeProfitability(stats);

    if (analysis.recommendation === 'restart') {
      await postMessage('cfo', 'GPT-4o (CFO)', analysis.reasoning);
    } else {
      console.log(`🔎 CFO analysis: yield is ${analysis.yieldPercent.toFixed(2)}%. No trigger.`);
    }

  } catch (err) {
    console.error('❌ Analysis Cycle error:', err);
  } finally {
    // 自律トリガーのチェックを追加
    await checkAutonomousTriggers();
  }
}

runAnalysisLoop();
setInterval(runAnalysisLoop, ANALYSIS_INTERVAL);

/**
 * 🛰️ 自律型戦略会議 (Autonomous Strategic Meeting)
 * エスカレーション・ロジック：2回以上の議論で同一傾向ならCEO決断、不能なら司令官へ上申
 */
async function runStrategicMeeting(agenda: string) {
  console.log(`🎙️ CEO is convening a strategic meeting: "${agenda}"`);
  
  const thread: ChatMessage[] = [];
  let round = 1;
  const MAX_ROUNDS = 2; // 指示に基づき2回までのループを許容

  // 1. CEO による会議招集
  const opening = await AgentBrain.debate('ceo', [{ role: 'user', content: `会議を開始します。アジェンダ：${agenda}` }]);
  await postMessage(opening.agentId, opening.agentName, opening.message);
  thread.push({ role: 'assistant', content: opening.message });

  while (round <= MAX_ROUNDS) {
    console.log(`--- Debate Round ${round} ---`);
    
    // CFO による財務分析
    const cfoResponse = await AgentBrain.debate('cfo', thread);
    await postMessage(cfoResponse.agentId, cfoResponse.agentName, cfoResponse.message);
    thread.push({ role: 'assistant', content: cfoResponse.message });

    // CTO による技術的解決策の提案
    const ctoResponse = await AgentBrain.debate('cto', thread);
    await postMessage(ctoResponse.agentId, ctoResponse.agentName, ctoResponse.message);
    thread.push({ role: 'assistant', content: ctoResponse.message });

    // CEO が現在の議論を評価
    const evaluation = await AgentBrain.debate('ceo', [
      ...thread, 
      { role: 'user', content: `【ラウンド${round}評価】合意形成はできましたか？ 決断できる場合は「決断：」で始め、継続が必要なら「継続：」、司令官への上申が必要なら「留保：」で始めてください。` }
    ]);
    
    await postMessage(evaluation.agentId, evaluation.agentName, evaluation.message);
    thread.push({ role: 'assistant', content: evaluation.message });

    if (evaluation.message.includes('決断：')) {
      console.log('✅ CEO made a decision.');
      break;
    } else if (evaluation.message.includes('留保：') || round === MAX_ROUNDS) {
      console.log('⚠️ Escalating to Commander (User)...');
      await postMessage('assistant', 'System Assistant', '【保留・上申】AIエージェント間で意見が分かれたか、重大な判断が必要なため、司令官（ユーザー）の最終承認を待ちます。ダッシュボードの指示入力をお願いします。');
      break;
    }

    round++;
  }
  
  console.log('🎯 Strategic Meeting Session Ended.');
}

/**
 * ⚡ 自律トリガーの監視
 */
async function checkAutonomousTriggers() {
  const { data: kpis } = await supabase.from('kpis').select('*');
  const dscr = kpis?.find(k => k.id === 'dscr')?.value || 1.84;

  // 重要指標が急落した場合（例：1.8未満）
  if (dscr < 1.8) {
    await runStrategicMeeting('【緊急】DSCR（財務安全性）が目標値を下回っています。即時改善策を策定してください。');
  }
}

// 6時間おきに定例戦略会議を開催
const STRATEGIC_REVIEW_INTERVAL = 6 * 60 * 60 * 1000;
setInterval(() => runStrategicMeeting('定期戦略四半期レビュー：現状のポートフォリオと収支安定性の確認。'), STRATEGIC_REVIEW_INTERVAL);
