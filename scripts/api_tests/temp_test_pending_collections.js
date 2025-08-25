// scripts/api_tests/test_pending_collections_api.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do .env.local na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api/client/pending-collections`;

// --- Configuração do Teste ---
const CLIENT_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJkZjAzNWE0NS0xNzllLTQ2ZDQtYTQwOS0zOGQwOGIzYjJjNjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU1OTA4MjM0LCJpYXQiOjE3NTU5MDQ2MzQsImVtYWlsIjoiY2xpZW50ZUBwcm9saW5lYXV0by5jb20uYnIiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJDbGllbnRlIFRlc3RlIDQ2Nzg2IiwicHJvZmlsZV9pZCI6ImRmMDM1YTQ1LTE3OWUtNDZkNC1hNDA5LTM4ZDA4YjNiMmM2NSIsInJvbGUiOiJjbGllbnQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjp7fV0sInNlc3Npb25faWQiOiIyODkwODkzOC05NGQwLTQ2NGYtYWQ0NC05MjU4YmYwYmJkMWYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.6_IBpljyVM257-o10bLnbq_-dINdWMFfC0v9E_rACyo';

// --- Função de Teste ---
async function testApi() {
  console.log('--- Iniciando Teste da API: /api/client/pending-collections ---');

  try {
    console.log('\nEnviando requisição para:', API_URL);

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CLIENT_JWT_TOKEN}`,
      },
    });

    const data = await response.json();

    console.log('\n--- Resposta da API ---');
    console.log('Status:', response.status);
    console.log('Corpo da Resposta:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Requisição BEM-SUCEDIDA!');
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Foram encontradas ${data.length} coletas pendentes.`);
      } else {
        console.log('Nenhuma coleta pendente encontrada para este cliente.');
      }
    } else {
      console.error('\n❌ ERRO na Requisição:', data.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('\n🚨 Erro crítico ao executar o teste:', error);
  }
}

testApi();
