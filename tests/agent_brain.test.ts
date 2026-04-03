import { AgentBrain } from '../src/services/agent_brain';

/**
 * 🧪 Agent Brain Unit Test
 * 
 * 大城様のメッセージに対し、AI が正しく「誰が答えるべきか」を
 * 判断できるかを自動検証します。
 */

async function runTests() {
  console.log('--- 🧪 Starting Agent Brain Unit Tests ---');
  let passCount = 0;
  let failCount = 0;

  const testCases = [
    { input: '現在の収支はどうなっている？', expected: 'cfo' },
    { input: 'ハッシュレートの効率化について相談したい', expected: 'cto' },
    { input: '全体の戦略を教えてくれ', expected: 'ceo' },
    { input: '利回りは 5% を超えたか？', expected: 'cfo' },
    { input: '進捗状況を教えて', expected: 'coo' },
    { input: 'プログラムの不具合がある', expected: 'cto' }
  ];

  for (const test of testCases) {
    try {
      const result = await AgentBrain.decideResponse(test.input);
      if (result.agentId === test.expected) {
        console.log(`✅ PASS: "${test.input}" -> ${result.agentId}`);
        passCount++;
      } else {
        console.error(`❌ FAIL: "${test.input}" -> Expected ${test.expected}, but got ${result.agentId}`);
        failCount++;
      }
    } catch (err) {
      console.error(`💥 EXCEPTION: "${test.input}" failed with error:`, err);
      failCount++;
    }
  }

  console.log(`\n--- 📊 Summary: ${passCount} passed, ${failCount} failed ---`);
  
  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
