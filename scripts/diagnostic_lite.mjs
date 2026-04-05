import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function run() {
  console.log('--- 🛡 DB Diagnostic (Pure JS) ---');
  
  // .env.local を自力でパース
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
  });

  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']; // とりあえず Anon で試す
  
  console.log('URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('system_config').select('*').limit(1).maybeSingle();

  if (error) {
    console.error('❌ Fetch Error:', error.message);
    return;
  }

  if (!data) {
    console.log('⚠️ No config record found.');
    return;
  }

  console.log('✅ Found config.');
  const aiKeys = data.config_data?.aiKeys || {};
  console.log('\n--- 🔑 Key Verification ---');
  for (const [provider, val] of Object.entries(aiKeys)) {
    const status = (typeof val === 'string' && val.startsWith('ENC:')) ? 'ENCRYPTED ✅' : 'RAW/EMPTY ❌';
    console.log(`[${provider}]: ${status}`);
    if (status === 'ENCRYPTED ✅') {
      console.log(`  Value: ${val.slice(0, 15)}...`);
    } else {
      console.log(`  Value: ${String(val)}`);
    }
  }
}

run();
