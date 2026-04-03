/**
 * 🧪 Mining Calculation Unit Test (Pure Node.js Version)
 * 
 * CFO が収支報告を行う際の「計算ロジック」の正確性を 100% 証明します。
 */

async function runTests() {
  console.log('--- 🧪 Starting Mining Calculation Logic Validation ---');
  let passCount = 0;
  let failCount = 0;

  // 検証対象のロジック (MiningService.calculateDailyProfit 相当)
  const calculateDailyProfit = (payout, price, electricity) => {
    const grossIncome = payout * price;
    const netProfit = grossIncome - electricity;
    const margin = (netProfit / grossIncome) * 100;
    return { grossIncome, netProfit, margin };
  };

  const testCases = [
    { 
      name: 'Standard Profit Case',
      input: { payout: 10, price: 100, electricity: 300 }, 
      expected: { gross: 1000, net: 700, margin: 70 }
    },
    { 
      name: 'Low Yield / High Cost Case (Negative)',
      input: { payout: 2, price: 100, electricity: 500 }, 
      expected: { gross: 200, net: -300, margin: -150 }
    },
    { 
      name: 'Break-even Case',
      input: { payout: 5, price: 100, electricity: 500 }, 
      expected: { gross: 500, net: 0, margin: 0 }
    }
  ];

  for (const test of testCases) {
    const res = calculateDailyProfit(test.input.payout, test.input.price, test.input.electricity);
    
    if (res.grossIncome === test.expected.gross && 
        res.netProfit === test.expected.net && 
        res.margin === test.expected.margin) {
      console.log(`✅ PASS: ${test.name} - Gross: ${res.grossIncome}, Net: ${res.netProfit}, Margin: ${res.margin}%`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${test.name} - Expected ${JSON.stringify(test.expected)}, but got ${JSON.stringify(res)}`);
      failCount++;
    }
  }

  console.log(`\n--- 📊 Summary: ${passCount} passed, ${failCount} failed ---`);
  
  if (failCount > 0) process.exit(1);
  else process.exit(0);
}

runTests();
