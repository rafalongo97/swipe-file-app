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

async function testColumn(colName) {
  const dummyRow = {
    nome_produto: 'Teste Coluna',
    nicho: 'Teste',
    subnicho: 'Teste',
    data_primeiro_anuncio: '2026-07-01',
    tipo_funil: 'DR',
    formato_entrega: 'Vídeo',
    valor_front: 10.0,
    [colName]: colName === 'order_bumps' ? [] : 'test'
  };
  const { error } = await supabase.from('ofertas_swipe_file').insert([dummyRow]);
  if (error && error.message.includes("Could not find the '" + colName + "' column")) {
    console.log(`A coluna "${colName}" NÃO existe.`);
  } else {
    console.log(`A coluna "${colName}" EXISTE (retornou: ${error ? error.message : 'Sucesso!'}).`);
  }
}

async function run() {
  await testColumn('order_bumps');
  await testColumn('valores_order_bumps');
  await testColumn('nomes_order_bumps');
  await testColumn('qtd_order_bump');
}

run();
