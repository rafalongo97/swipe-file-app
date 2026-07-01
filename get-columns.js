const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('Buscando linha para ver as colunas...');
  const { data, error } = await supabase.from('ofertas_swipe_file').select('*').limit(1);
  if (error) {
    console.error('Erro:', error);
  } else if (data && data.length > 0) {
    console.log('Linha encontrada:', data[0]);
    console.log('Colunas:', Object.keys(data[0]));
  } else {
    console.log('Nenhuma linha encontrada.');
  }
}

run();
