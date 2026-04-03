import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const binDir = '/Users/ooshirokazuki/.nvm/versions/node/v24.14.1/bin';
const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };

function run(cmd) {
    console.log(`Running: ${cmd}`);
    execSync(cmd, { env, stdio: 'inherit', cwd: process.cwd() });
}

try {
    console.log('🚀 Phase 7 Deployment Starting...');
    run('npm install');
    run('npm run build');
    run('node scripts/deploy.mjs');
    console.log('✅ Phase 7 Deployment Successful!');
} catch (err) {
    console.error('❌ Phase 7 Deployment Failed:', err.message);
    process.exit(1);
}
