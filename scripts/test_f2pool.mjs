import { F2PoolBridge } from '../src/services/f2pool_bridge.js';

async function test() {
  console.log('--- 🧪 Testing F2Pool Bridge Fix ---');
  try {
    const stats = await F2PoolBridge.fetchStats('bitcoin', 'engawa_miner');
    console.log('✅ Success:', stats);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

test();
