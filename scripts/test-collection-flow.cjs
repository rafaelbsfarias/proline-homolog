/**
 * Script para testar o fluxo completo de mudança de data de coleta
 * Testa: Cliente → Admin → Cliente → Admin
 * FOCO: Verificar se a data proposta pelo cliente aparece na interface do admin
 */

const BASE_URL = 'http://localhost:3000';

// Dados de teste
const TEST_DATA = {
  clientId: '2168155a-28ce-4845-872b-f9a7b5b7bf90',
  addressId: 'f6ed37bc-1267-4c7a-8be5-7d7b44230647',
  addressLabel: 'general labatut, 123 - salvador',
  dates: {
    adminInitial: '2025-09-03',     // Data inicial proposta pelo admin
    clientProposed: '2025-09-17',   // Data sugerida pelo cliente
    clientSecond: '2025-09-15'      // Segunda sugestão do cliente
  }
};

// Função para fazer requisições
async function makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  const options = {
    method,
    headers: defaultHeaders
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

// Função para verificar estado das tabelas com análise detalhada
async function checkDatabaseState(step) {
  console.log(`\n📋 === ESTADO DA BASE - ${step} ===`);
  
  // Verificar vehicle_collections
  const collectionsResult = await makeRequest(`/api/test-collections-state?clientId=${TEST_DATA.clientId}`);
  
  if (collectionsResult.data?.collections) {
    console.log(`\n🗃️  VEHICLE_COLLECTIONS (${collectionsResult.data.count} registros):`);
    collectionsResult.data.collections.forEach((c, i) => {
      console.log(`[${i+1}] ID: ${c.id.slice(0,8)}...`);
      console.log(`    Address: ${c.collection_address}`);
      console.log(`    Fee: ${c.collection_fee_per_vehicle}`);
      console.log(`    Date: ${c.collection_date}`);
      console.log(`    Status: ${c.status}`);
      console.log(`    Updated: ${c.updated_at}`);
    });
  }
  
  // Verificar vehicles
  const vehiclesResult = await makeRequest(`/api/test-vehicles-state?clientId=${TEST_DATA.clientId}&addressId=${TEST_DATA.addressId}`);
  
  if (vehiclesResult.data?.vehicles) {
    console.log(`\n🚗 VEHICLES (${vehiclesResult.data.count} registros):`);
    vehiclesResult.data.vehicles.forEach((v, i) => {
      console.log(`[${i+1}] ID: ${v.id.slice(0,8)}...`);
      console.log(`    Status: ${v.status}`);
      console.log(`    Estimated Date: ${v.estimated_arrival_date}`);
      console.log(`    Address ID: ${v.pickup_address_id}`);
    });
  }

  return { collections: collectionsResult.data, vehicles: vehiclesResult.data };
}

// Função para analisar o que o admin deveria ver
async function analyzeAdminView(step) {
  console.log(`\n🔍 === ANÁLISE DA VISÃO DO ADMIN - ${step} ===`);
  
  const state = await checkDatabaseState(`${step} - ANÁLISE`);
  
  if (state.vehicles?.vehicles?.length > 0 && state.collections?.collections?.length > 0) {
    const vehicle = state.vehicles.vehicles[0];
    const collections = state.collections.collections;
    
    console.log('\n📊 DADOS PARA INTERFACE DO ADMIN:');
    console.log(`Vehicle Status: ${vehicle.status}`);
    console.log(`Vehicle Date: ${vehicle.estimated_arrival_date}`);
    
    // Verificar se há data proposta pelo cliente
    const hasClientProposal = vehicle.status === 'APROVAÇÃO NOVA DATA';
    console.log(`\n${hasClientProposal ? '✅' : '❌'} Cliente propôs nova data: ${hasClientProposal}`);
    
    if (hasClientProposal) {
      console.log(`📅 Data proposta pelo cliente: ${vehicle.estimated_arrival_date}`);
      console.log('🎯 ADMIN DEVERIA VER: Opção para aceitar/rejeitar esta data');
    }
    
    // Verificar collections com fee
    const collectionWithFee = collections.find(c => c.collection_fee_per_vehicle > 0);
    if (collectionWithFee) {
      console.log(`\n💰 Collection com fee encontrada:`);
      console.log(`    ID: ${collectionWithFee.id.slice(0,8)}...`);
      console.log(`    Fee: R$ ${collectionWithFee.collection_fee_per_vehicle}`);
      console.log(`    Date: ${collectionWithFee.collection_date}`);
    } else {
      console.log('\n❌ PROBLEMA: Nenhuma collection com fee válido encontrada!');
    }
  }
}

// Teste 1: Cliente solicita mudança de data
async function testClientReschedule() {
  console.log('\n🎯 === TESTE 1: CLIENTE SOLICITA MUDANÇA DE DATA ===');
  
  const result = await makeRequest('/api/client/collection-reschedule', 'POST', {
    addressId: TEST_DATA.addressId,
    new_date: TEST_DATA.dates.clientProposed
  });
  
  await analyzeAdminView('APÓS RESCHEDULE DO CLIENTE');
  return result;
}

// Teste 2: Admin propõe nova data
async function testAdminPropose() {
  console.log('\n🎯 === TESTE 2: ADMIN PROPÕE NOVA DATA ===');
  
  const result = await makeRequest('/api/admin/propose-collection-date', 'POST', {
    clientId: TEST_DATA.clientId,
    addressId: TEST_DATA.addressId,
    new_date: TEST_DATA.dates.adminInitial
  });
  
  await analyzeAdminView('APÓS PROPOSTA DO ADMIN');
  return result;
}

// Teste 3: Cliente solicita nova mudança
async function testClientSecondReschedule() {
  console.log('\n🎯 === TESTE 3: CLIENTE SOLICITA SEGUNDA MUDANÇA ===');
  
  const result = await makeRequest('/api/client/collection-reschedule', 'POST', {
    addressId: TEST_DATA.addressId,
    new_date: TEST_DATA.dates.clientSecond
  });
  
  await analyzeAdminView('APÓS SEGUNDA MUDANÇA DO CLIENTE');
  return result;
}

// Teste 4: Admin tenta aceitar proposta
async function testAdminAccept() {
  console.log('\n🎯 === TESTE 4: ADMIN TENTA ACEITAR PROPOSTA ===');
  
  const result = await makeRequest('/api/admin/accept-client-proposed-date', 'POST', {
    clientId: TEST_DATA.clientId,
    addressId: TEST_DATA.addressId
  });
  
  await analyzeAdminView('APÓS TENTATIVA DE ACEITAR');
  return result;
}

// Teste 5: Verificar endpoint do admin dashboard
async function testAdminDashboard() {
  console.log('\n🎯 === TESTE 5: VERIFICAR DADOS DO DASHBOARD ADMIN ===');
  
  const result = await makeRequest(`/api/admin/client-collections-summary/${TEST_DATA.clientId}`);
  
  console.log('\n📊 DADOS DO DASHBOARD:');
  if (result.data && result.status === 200) {
    console.log('Collections Summary:', result.data);
    
    // Verificar se há pendências de aprovação
    const hasPendingApprovals = result.data.some && result.data.some(item => 
      item.status === 'APROVAÇÃO NOVA DATA' || 
      item.vehicles?.some(v => v.status === 'APROVAÇÃO NOVA DATA')
    );
    
    console.log(`\n${hasPendingApprovals ? '✅' : '❌'} Dashboard detecta pendências de aprovação: ${hasPendingApprovals}`);
  }
  
  return result;
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 === INICIANDO TESTES DE FLUXO DE COLETA ===');
  console.log('🎯 FOCO: Verificar se data proposta pelo cliente aparece no admin');
  console.log('📋 Dados de teste:', TEST_DATA);
  
  await analyzeAdminView('INICIAL');
  
  const results = {
    clientReschedule: await testClientReschedule(),
    adminPropose: await testAdminPropose(),  
    clientSecondReschedule: await testClientSecondReschedule(),
    adminAccept: await testAdminAccept(),
    adminDashboard: await testAdminDashboard()
  };
  
  console.log('\n📊 === RESUMO DOS RESULTADOS ===');
  Object.entries(results).forEach(([test, result]) => {
    const status = result.status === 200 ? '✅' : '❌';
    console.log(`${status} ${test}: ${result.status}`);
  });
  
  // Verificar se o problema da interface foi identificado
  console.log('\n🔍 === DIAGNÓSTICO DO PROBLEMA DA INTERFACE ===');
  console.log('1. ❓ Veículos têm status "APROVAÇÃO NOVA DATA"?');
  console.log('2. ❓ Collections têm fee válido?');
  console.log('3. ❓ Dashboard detecta pendências?');
  console.log('4. ❓ Componente DatePendingUnifiedSection recebe dados corretos?');
  
  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, TEST_DATA };
