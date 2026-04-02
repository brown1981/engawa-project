import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = '/Users/ooshirokazuki/.gemini/antigravity/scratch/engawa-project';
const CONFIG_FILE = path.join(PROJECT_ROOT, 'agents/api_config.json');

export async function POST(request: Request) {
  try {
    const newConfig = await request.json();

    // 1. Read existing config to ensure we don't wipe out other fields
    const currentConfigData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const currentConfig = JSON.parse(currentConfigData);

    // 2. Perform a deep merge or selective update
    // We expect the incoming 'newConfig' to match the schema we defined in Phase 11 & 12
    const updatedConfig = {
      ...currentConfig,
      ...newConfig,
      // Ensure nested objects are merged if they exist in newConfig
      miningPool: newConfig.miningPool ? { ...currentConfig.miningPool, ...newConfig.miningPool } : currentConfig.miningPool,
      aiKeys: newConfig.aiKeys ? { ...currentConfig.aiKeys, ...newConfig.aiKeys } : currentConfig.aiKeys,
      agentAssignments: newConfig.agentAssignments ? { ...currentConfig.agentAssignments, ...newConfig.agentAssignments } : currentConfig.agentAssignments
    };

    // 3. Save to file
    await fs.writeFile(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));

    return NextResponse.json({ success: true, message: 'Global system configuration updated' });
  } catch (error) {
    console.error('Config API Error:', error);
    return NextResponse.json({ error: 'Failed to synchronize system configuration' }, { status: 500 });
  }
}
