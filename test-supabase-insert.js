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
  console.log('--- TESTE 1: Inserindo linha mínima sem user_id ---');
  const dummyRow = {
    nome_produto: 'Teste RLS Mínimo',
    nicho: 'Teste',
    subnicho: 'Teste',
    data_primeiro_anuncio: '2026-07-01',
    tipo_funil: 'DR',
    formato_entrega: 'Vídeo',
    valor_front: 10.0
  };
  const res1 = await supabase.from('ofertas_swipe_file').insert([dummyRow]).select();
  console.log('Erro Teste 1:', res1.error);
  console.log('Dados Teste 1:', res1.data);

  console.log('--- TESTE 2: Inserindo com coluna user_id fictícia ---');
  const rowWithUser = {
    ...dummyRow,
    user_id: '00000000-0000-0000-0000-000000000000'
  };
  const res2 = await supabase.from('ofertas_swipe_file').insert([rowWithUser]).select();
  console.log('Erro Teste 2:', res2.error);
  console.log('Dados Teste 2:', res2.data);
}

run();
