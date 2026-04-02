import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = '/Users/ooshirokazuki/.gemini/antigravity/scratch/engawa-project';
const CONFIG_FILE = path.join(PROJECT_ROOT, 'agents/api_config.json');

// F2Pool API URL: https://api.f2pool.com/{currency}/{account_name}
// For ZEC mining (Antminer Z15 Pro)
const F2POOL_BASE_URL = 'https://api.f2pool.com/zec';

export async function GET() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const { miningPool } = JSON.parse(configData);

    // Simulated Fetch for F2Pool (Production integration point)
    // In real use: fetch(`${F2POOL_BASE_URL}/${miningPool.accountName}`)
    const mockHashrate = '840 kSol/s'; // Z15 Pro is approx 420kg x 2
    const miningRevenueJPY = 49200;    // Simulation based on ZEC price
    
    // Financial calculations as per business_context.md
    const subRevenueJPY = 12500;
    const consultingRevenueJPY = 25000;
    const totalRevenue = miningRevenueJPY + subRevenueJPY + consultingRevenueJPY;
    const monthlyRepayment = 42000;
    
    const dscr = totalRevenue / monthlyRepayment;

    return NextResponse.json({
      pool: {
        name: 'F2Pool',
        account: miningPool.accountName,
        currency: 'ZEC',
        hashrate: mockHashrate,
        status: 'online',
        payoutAddress: 't1S... (Auto-synced from Pool)' // Simulation of API-fetched address
      },
      kpis: {
        dscr: parseFloat(dscr.toFixed(2)),
        revenue: totalRevenue,
        repayment: monthlyRepayment,
        efficiency: 93 // Mock efficiency based on heat reuse
      },
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('F2Pool API Sync Error:', error);
    return NextResponse.json({ error: 'Connection to F2Pool failed' }, { status: 500 });
  }
}
