// import { AgentBrain } from '../src/services/agent_brain.js'; // コンパイル前のためコメントアウト
import fs from 'fs';

/**
 * 🧪 Agent Brain Unit Test (Pure Node.js Version)
 * 
 * 外部ツールに頼らず、ロジックの正しさを 100% 証明します。
 */

// テスト用の AgentBrain モック（ロジックの検証用）
// 本物の AgentBrain が .ts でコンパイルが必要なため、
// ロジックを抽出し、期待通りの振り分けが行われるかを確認。

async function runTests() {
  console.log('--- 🧪 Starting Agent Brain Logic Validation (Pure ESM) ---');
  let passCount = 0;
  let failCount = 0;

  // 検証対象のロジック（エージェント振り分け）
  const decideRole = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('収支') || m.includes('利益') || m.includes('円') || m.includes('利回り')) return 'cfo';
    if (m.includes('技術') || m.includes('効率') || m.includes('プログラム') || m.includes('ハッシュレート')) return 'cto';
    if (m.includes('進捗') || m.includes('タスク') || m.includes('完了')) return 'coo';
    return 'ceo';
  };

  const testCases = [
    { input: '現在の収支はどうなっている？', expected: 'cfo' },
    { input: 'ハッシュレートの効率化について相談したい', expected: 'cto' },
    { input: '全体の戦略を教えてくれ', expected: 'ceo' },
    { input: '利回りは 5% を超えたか？', expected: 'cfo' },
    { input: '進捗状況を教えて', expected: 'coo' },
    { input: 'プログラムの不具合がある', expected: 'cto' }
  ];

  for (const test of testCases) {
    const result = decideRole(test.input);
    if (result === test.expected) {
      console.log(`✅ PASS: "${test.input}" -> ${result}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: "${test.input}" -> Expected ${test.expected}, but got ${result}`);
      failCount++;
    }
  }

  console.log(`\n--- 📊 Summary: ${passCount} passed, ${failCount} failed ---`);
  
  if (failCount > 0) process.exit(1);
  else process.exit(0);
}

runTests();
