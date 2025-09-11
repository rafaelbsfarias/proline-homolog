// scripts/api_tests/temp_test_run.js
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
const API_URL = `${API_BASE_URL}/api/admin/set-address-collection-fees`;

// --- Configuração do Teste ---
const ADMIN_AUTH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiI3MmNmNTJhMC05MmM5LTQzZDUtOTU5MS05ODQxNDBiZTQyNjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU1OTAxNTA0LCJpYXQiOjE3NTU4OTc5MDQsImVtYWlsIjoiYWRtaW5AcHJvbGluZWF1dG8uY29tLmJyIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiQWRtaW5pc3RyYWRvciBQcmluY2lwYWwiLCJwcm9maWxlX2lkIjoiNzJjZjUyYTAtOTJjOS00M2Q1LTk1OTEtOTg0MTQwYmU0MjY1Iiwicm9sZSI6ImFkbWluIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTU4OTc5MDR9XSwic2Vzc2lvbl9pZCI6IjhjN2VmNGU2LWNmODMtNGFhNy05M2VlLWEwYTVjNGY1OGUyMCIsImlzX2Fub255bW91cyI6ZmFsc2V9.EIt2V3UavDjv5o3YoNxVmh_THm8tQVBjbL2Ncra1SbU';
const CLIENT_ID = 'c43f8301-b3e9-4d50-87ae-feb8e0824ea1';
const ADDRESS_ID = '84c4f867-c684-4f62-9476-8f37543e8453';

// --- Payload do Teste ---
const testPayload = {
  clientId: CLIENT_ID,
  fees: [
    {
      addressId: ADDRESS_ID,
      fee: 75.0, // Valor da coleta por veículo
      date: '2025-08-22', // Data da coleta (formato AAAA-MM-DD)
    },
  ],
};

// --- Função de Teste ---
async function testApi() {
  console.log('--- Iniciando Teste da API: set-address-collection-fees ---');

  try {
    console.log('\nEnviando requisição para:', API_URL);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_AUTH_TOKEN}`,
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    console.log('\n--- Resposta da API ---');
    console.log('Status:', response.status);
    console.log('Corpo da Resposta:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Requisição BEM-SUCEDIDA!');
      console.log(
        'Verifique a tabela `vehicle_collections` e os status dos veículos no banco de dados para confirmar o resultado.'
      );
    } else {
      console.error('\n❌ ERRO na Requisição:', data.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('\n🚨 Erro crítico ao executar o teste:', error);
  }
}

testApi();
