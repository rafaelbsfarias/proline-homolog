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
// Substitua o valor abaixo por um token JWT válido de um usuário CLIENTE.
const CLIENT_JWT_TOKEN = 'YOUR_CLIENT_JWT_TOKEN'; // <<< SUBSTITUA PELO SEU TOKEN DE CLIENTE

// --- Função de Teste ---
async function testApi() {
  console.log('--- Iniciando Teste da API: /api/client/pending-collections ---');

  if (CLIENT_JWT_TOKEN === 'YOUR_CLIENT_JWT_TOKEN') {
    console.error('\nERRO: Preencha a variável CLIENT_JWT_TOKEN no script antes de executar.');
    console.error(
      "Para obter um token, faça login como cliente no app e inspecione o cabeçalho 'Authorization' de qualquer requisição autenticada."
    );
    process.exit(1);
  }

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
