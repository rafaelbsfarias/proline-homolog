/**
 * Script para testar o fluxo completo de mudança de data de coleta
 * Testa: Cliente → Admin → Cliente → Admin
 */

const BASE_URL = 'http://localhost:3000';

// Dados de teste
const TEST_DATA = {
  clientId: '2168155a-28ce-4845-872b-f9a7b5b7bf90',
  addressId: 'f6ed37bc-1267-4c7a-8be5-7d7b44230647',
  addressLabel: 'general labatut, 123 - salvador',
  dates: {
    initial: '2025-09-30',
    adminProposed: '2025-09-12',
    clientReschedule: '2025-09-15',
  },
};

// Função para fazer requisições autenticadas
async function makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const options = {
    method,
    headers: defaultHeaders,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n🔄 ${method} ${endpoint}`);
    if (body) console.log('📤 Body:', JSON.stringify(body, null, 2));

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.text();

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    console.log(`📊 Status: ${response.status}`);
    console.log(`📥 Response:`, jsonData);

    return { status: response.status, data: jsonData };
  } catch (error) {
    console.error(`❌ Error in ${endpoint}:`, error.message);
    return { status: 500, error: error.message };
  }
}

// Função para verificar estado das tabelas
async function checkDatabaseState(step) {
  console.log(`\n📋 === ESTADO DA BASE - ${step} ===`);

  // Verificar vehicle_collections
  const collectionsResult = await makeRequest(
    `/api/test-collections-state?clientId=${TEST_DATA.clientId}`
  );

  // Verificar vehicles
  const vehiclesResult = await makeRequest(
    `/api/test-vehicles-state?clientId=${TEST_DATA.clientId}&addressId=${TEST_DATA.addressId}`
  );
}

// Teste 1: Cliente solicita mudança de data
async function testClientReschedule() {
  console.log('\n🎯 === TESTE 1: CLIENTE SOLICITA MUDANÇA DE DATA ===');

  const result = await makeRequest('/api/client/collection-reschedule', 'POST', {
    addressId: TEST_DATA.addressId,
    new_date: TEST_DATA.dates.clientReschedule,
  });

  await checkDatabaseState('APÓS RESCHEDULE DO CLIENTE');
  return result;
}

// Teste 2: Admin propõe nova data
async function testAdminPropose() {
  console.log('\n🎯 === TESTE 2: ADMIN PROPÕE NOVA DATA ===');

  const result = await makeRequest('/api/admin/propose-collection-date', 'POST', {
    clientId: TEST_DATA.clientId,
    addressId: TEST_DATA.addressId,
    new_date: TEST_DATA.dates.adminProposed,
  });

  await checkDatabaseState('APÓS PROPOSTA DO ADMIN');
  return result;
}

// Teste 3: Cliente solicita nova mudança
async function testClientSecondReschedule() {
  console.log('\n🎯 === TESTE 3: CLIENTE SOLICITA SEGUNDA MUDANÇA ===');

  const result = await makeRequest('/api/client/collection-reschedule', 'POST', {
    addressId: TEST_DATA.addressId,
    new_date: TEST_DATA.dates.initial,
  });

  await checkDatabaseState('APÓS SEGUNDA MUDANÇA DO CLIENTE');
  return result;
}

// Teste 4: Admin tenta aceitar proposta
async function testAdminAccept() {
  console.log('\n🎯 === TESTE 4: ADMIN TENTA ACEITAR PROPOSTA ===');

  const result = await makeRequest('/api/admin/accept-client-proposed-date', 'POST', {
    clientId: TEST_DATA.clientId,
    addressId: TEST_DATA.addressId,
  });

  await checkDatabaseState('APÓS TENTATIVA DE ACEITAR');
  return result;
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 === INICIANDO TESTES DE FLUXO DE COLETA ===');
  console.log('📋 Dados de teste:', TEST_DATA);

  await checkDatabaseState('INICIAL');

  const results = {
    clientReschedule: await testClientReschedule(),
    adminPropose: await testAdminPropose(),
    clientSecondReschedule: await testClientSecondReschedule(),
    adminAccept: await testAdminAccept(),
  };

  console.log('\n📊 === RESUMO DOS RESULTADOS ===');
  Object.entries(results).forEach(([test, result]) => {
    const status = result.status === 200 ? '✅' : '❌';
    console.log(`${status} ${test}: ${result.status}`);
  });

  // Verificar se o bug foi resolvido
  const bugResolved = results.adminAccept.status === 200;
  console.log(`\n${bugResolved ? '🎉' : '❌'} Bug ${bugResolved ? 'RESOLVIDO' : 'AINDA EXISTE'}`);

  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, TEST_DATA };
