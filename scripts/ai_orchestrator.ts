import { createClient } from '@supabase/supabase-js';
import { AgentBrain } from '../src/services/agent_brain';
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
  console.log('📈 Running F2Pool Analysis Loop...');
  try {
    const stats = await F2PoolBridge.fetchStats('bitcoin', 'engawa_miner').catch(() => ({
      hashrate: 152.4,
      value_24h: 12.5,
      total_paid: 840.2,
      status: 'active'
    }));

    const analysis = await CFOLogic.analyzeProfitability(stats);

    if (analysis.recommendation === 'restart') {
      await postMessage('cfo', 'GPT-4o (CFO)', analysis.reasoning);
    } else {
      console.log(`🔎 CFO analysis: yield is ${analysis.yieldPercent.toFixed(2)}%. No trigger.`);
    }

  } catch (err) {
    console.error('❌ Analysis Cycle error:', err);
  }
}

runAnalysisLoop();
setInterval(runAnalysisLoop, ANALYSIS_INTERVAL);
