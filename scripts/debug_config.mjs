import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function debugConfig() {
  console.log('--- 🛡 DB Configuration Diagnostic ---');
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('system_config').select('*').limit(1).maybeSingle();

  if (error) {
    console.error('❌ DB Fetch Error:', error.message);
    return;
  }

  if (!data) {
    console.log('⚠️ system_config table is EMPTY.');
    return;
  }

  console.log('✅ Found config record (ID: 1)');
  const config = data.config_data || {};
  const aiKeys = config.aiKeys || {};

  console.log('\n--- 🔑 Key Analysis ---');
  for (const [provider, key] of Object.entries(aiKeys)) {
    if (!key) {
      console.log(`[${provider}]: EMPTY ❌`);
    } else if (typeof key === 'string' && key.startsWith('ENC:')) {
      console.log(`[${provider}]: ENCRYPTED ✅ (Starts with ENC:)`);
    } else {
      console.log(`[${provider}]: RAW TEXT ⚠️ (Starts with: ${String(key).slice(0, 5)}...)`);
    }
  }
}

debugConfig();
