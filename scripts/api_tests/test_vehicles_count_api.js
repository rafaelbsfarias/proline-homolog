import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do .env.local na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.prolineauto.com.br';

async function testVehiclesCountApi() {
  // Substitua este token por um JWT válido de um usuário cliente
  // Você pode obter um token fazendo login no aplicativo e inspecionando as requisições de rede
  const clientJwt = 'YOUR_CLIENT_JWT_HERE';

  if (clientJwt === 'YOUR_CLIENT_JWT_HERE') {
    console.error(
      'ERRO: Por favor, substitua YOUR_CLIENT_JWT_HERE por um JWT válido de um usuário cliente.'
    );
    console.error(
      'Para obter um JWT, faça login como cliente no aplicativo e inspecione o cabeçalho Authorization de qualquer requisição autenticada.'
    );
    process.exit(1);
  }

  try {
    console.log(`Testando GET ${BASE_URL}/api/client/vehicles-count`);
    const response = await fetch(`${BASE_URL}/api/client/vehicles-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientJwt}`,
      },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('Teste de API de contagem de veículos BEM-SUCEDIDO!');
    } else {
      console.error('Teste de API de contagem de veículos FALHOU!');
    }
  } catch (error) {
    console.error('Erro ao fazer a requisição:', error);
  }
}

testVehiclesCountApi();
