import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      const k = parts[0];
      const v = parts.slice(1).join('=');
      if (k && v) env[k.trim()] = v.trim();
    });
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
  const { data, error } = await supabase.from('system_config').select('*').limit(1).maybeSingle();
  if (error) console.error(error);
  else console.log(JSON.stringify(data.config_data, null, 2));
}

dump();
