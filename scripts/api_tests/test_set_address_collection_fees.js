// scripts/api_tests/test_set_address_collection_fees.js
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
// Substitua os valores abaixo pelos dados corretos para o seu teste.

// 1. TOKEN DE ADMINISTRAÇÃO: Obtenha um token JWT válido de um usuário administrador.
//    Para isso, faça login como admin no app e inspecione o cabeçalho 'Authorization'
//    de qualquer requisição autenticada (o valor começa com "Bearer ").
const ADMIN_AUTH_TOKEN = 'YOUR_ADMIN_JWT_TOKEN'; // <<< SUBSTITUA PELO SEU TOKEN

// 2. ID DO CLIENTE: ID do cliente para o qual você está definindo as taxas.
const CLIENT_ID = 'YOUR_CLIENT_ID'; // <<< SUBSTITUA PELO ID DE UM CLIENTE REAL

// 3. ID DO ENDEREÇO: ID de um endereço associado ao cliente acima.
//    Os veículos neste endereço devem estar com o status 'PONTO DE COLETA SELECIONADO'.
const ADDRESS_ID = 'YOUR_ADDRESS_ID'; // <<< SUBSTITUA PELO ID DE UM ENDEREÇO REAL

// --- Payload do Teste ---
const testPayload = {
  clientId: CLIENT_ID,
  fees: [
    {
      addressId: ADDRESS_ID,
      fee: 75.0, // Valor da coleta por veículo
      date: '2025-08-22', // Data da coleta (formato AAAA-MM-DD)
    },
    // Adicione mais objetos de taxa aqui se precisar testar múltiplos endereços
  ],
};

// --- Função de Teste ---
async function testApi() {
  console.log('--- Iniciando Teste da API: set-address-collection-fees ---');

  if (
    ADMIN_AUTH_TOKEN === 'YOUR_ADMIN_JWT_TOKEN' ||
    CLIENT_ID === 'YOUR_CLIENT_ID' ||
    ADDRESS_ID === 'YOUR_ADDRESS_ID'
  ) {
    console.error(
      '\nERRO: Preencha as variáveis ADMIN_AUTH_TOKEN, CLIENT_ID, e ADDRESS_ID no script antes de executar.'
    );
    process.exit(1);
  }

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
