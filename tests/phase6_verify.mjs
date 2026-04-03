import { AgentBrain } from '../src/services/agent_brain.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testMeeting() {
  console.log('🧪 Starting Phase 6 Verification: Manual meeting trigger...');
  const agenda = 'ハッシュレートの突発的な低下に対する対策会議。CTOの見解とCFOの収支予測をお願いします。';
  
  try {
    const thread = [];
    
    // 1. CEO
    console.log('--- CEO Thinking ---');
    const ceo = await AgentBrain.debate('ceo', [{ role: 'user', content: agenda }]);
    console.log(`CEO: ${ceo.message.substring(0, 50)}...`);
    thread.push({ role: 'assistant', content: ceo.message });

    // 2. CFO
    console.log('--- CFO Thinking ---');
    const cfo = await AgentBrain.debate('cfo', thread);
    console.log(`CFO: ${cfo.message.substring(0, 50)}...`);
    thread.push({ role: 'assistant', content: cfo.message });

    console.log('✅ Phase 6 Logic Test: SUCCESS (Initial 2-step debate)');
  } catch (err) {
    console.error('❌ Phase 6 Logic Test: FAILED', err);
  }
}

testMeeting();
