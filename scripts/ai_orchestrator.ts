import { createClient } from '@supabase/supabase-js';
import { AgentBrain } from '../src/services/agent_brain';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * 🛰️ Engawa Cycle: AI Orchestrator (Autonomous Worker)
 * 
 * 常に Supabase のメッセージを監視し、
 * 司令官（大城様）の発言を検知して AI エージェントに返信を促します。
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // 本来サービスロールキー推奨だが開発用
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('--- 🚀 Engawa AI Orchestrator Starting ---');
console.log('Listening for Commander directives...');

const channel = supabase
  .channel('autonomous-operations')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    async (payload) => {
      const newMsg = payload.new;

      // 司令官（Commander）の発言のみに応答（無限ループ防止）
      if (newMsg.agent_id === 'commander') {
        console.log(`📡 Directive received: "${newMsg.message}"`);
        
        // 1. エージェントによる思考（Agent Brain）
        console.log('🧠 AI Team is analyzing...');
        const response = await AgentBrain.decideResponse(newMsg.message);
        
        // 2. 数秒待機（考えている感を演出）
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. 回答の投稿
        const { error } = await supabase
          .from('messages')
          .insert([
            {
              agent_id: response.agentId,
              agent_name: response.agentName,
              message: response.message,
              timestamp: new Date().toISOString()
            }
          ]);

        if (error) {
          console.error('❌ Failed to post AI response:', error);
        } else {
          console.log(`✅ ${response.agentName} responded.`);
        }
      }
    }
  )
  .subscribe();

// プロセス維持
setInterval(() => {}, 1000);
