const fs = require('fs');
const path = require('path');
const https = require('https');

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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Variáveis de ambiente ausentes no .env.local');
  process.exit(1);
}

const endpoint = `${url}/rest/v1/?apikey=${key}`;

https.get(endpoint, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const schema = JSON.parse(body);
      console.log('Resposta do Servidor:', schema);
    } catch (e) {
      console.error('Erro ao parsear JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Erro na requisição:', err.message);
});
