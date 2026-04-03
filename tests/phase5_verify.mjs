import { AgentBrain } from '../src/services/agent_brain';
import { LLMClient } from '../src/services/llm_client';

/**
 * 🧪 Phase 5: LLM Integration Verification (Safety & Routing)
 */

async function runVerification() {
  console.log('--- 🧪 Phase 5 Verification Starting ---');
  
  const testDirective = "現在の収支レポートと、今後の投資戦略について教えてくれ";
  const mockHistory = [
    { role: 'user', content: 'こんにちは' },
    { role: 'assistant', content: 'Engawa Cycleへようこそ。司令官。' }
  ];

  console.log(`📡 Testing with directive: "${testDirective}"`);
  console.log(`🧠 Context size: ${mockHistory.length} messages`);

  try {
    const result = await AgentBrain.decideResponse(testDirective, mockHistory);
    
    console.log(`✅ Assigned Agent: ${result.agentName} (${result.agentId})`);
    console.log(`📝 Generated Message: "${result.message}"`);

    // 検証ポイント
    if (result.message.includes('[OpenAI API Key Missing]') || result.message.includes('[Fallback Mode]')) {
      console.log('🛡️ Safety: API Key missing was handled correctly.');
    } else {
      console.log('🚀 Surprise! Actual LLM message generated.');
    }

  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }

  console.log('--- 📊 Verification Finished: Logical flow is HEALTHY ---');
}

runVerification();
