/**
 * Script para simular a lógica de busca de collections e identificar o problema
 */

const collections = [
  {
    id: 'ae4ed8e7-dc84-4b81-90a5-69086816a358',
    client_id: '2168155a-28ce-4845-872b-f9a7b5b7bf90',
    collection_address: 'general labatut, 123 - salvador',
    collection_fee_per_vehicle: null,
    status: 'requested',
    created_at: '2025-09-01T20:30:24.516761+00:00',
    updated_at: '2025-09-01T21:41:05.398503+00:00',
    collection_date: '2025-09-30'
  },
  {
    id: '5acd09e8-6d7a-438b-aae3-c06c5b4feb82',
    client_id: '2168155a-28ce-4845-872b-f9a7b5b7bf90',
    collection_address: 'general labatut, 123 - salvador',
    collection_fee_per_vehicle: 8.99,
    status: 'requested',
    created_at: '2025-09-01T20:29:31.767267+00:00',
    updated_at: '2025-09-01T21:50:22.233031+00:00',
    collection_date: '2025-09-10'
  }
];

function simulateOldLogic(collections, userId, addressLabel) {
  console.log('\n🔍 === SIMULANDO LÓGICA ANTIGA (PROBLEMÁTICA) ===');
  
  // Lógica antiga: pegar por created_at desc (mais recente primeiro)
  const filtered = collections
    .filter(c => 
      c.client_id === userId && 
      c.collection_address === addressLabel &&
      ['requested', 'approved'].includes(c.status)
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const result = filtered[0] || null;
  console.log('Resultado da busca antiga:', {
    id: result?.id,
    fee: result?.collection_fee_per_vehicle,
    date: result?.collection_date,
    problem: result?.collection_fee_per_vehicle === null ? '❌ FEE é NULL!' : '✅ Fee OK'
  });
  
  return result;
}

function simulateNewLogic(collections, userId, addressLabel) {
  console.log('\n🔧 === SIMULANDO LÓGICA NOVA (CORRIGIDA) ===');
  
  // Lógica nova: priorizar registros com fee > 0
  const withFee = collections
    .filter(c => 
      c.client_id === userId && 
      c.collection_address === addressLabel &&
      ['requested', 'approved'].includes(c.status) &&
      c.collection_fee_per_vehicle > 0
    )
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  let result = withFee[0] || null;
  
  // Fallback: se não encontrou com fee, pegar qualquer um
  if (!result) {
    console.log('⚠️  Fallback: buscando sem filtro de fee');
    const allFiltered = collections
      .filter(c => 
        c.client_id === userId && 
        c.collection_address === addressLabel &&
        ['requested', 'approved'].includes(c.status)
      )
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    result = allFiltered[0] || null;
  }
  
  console.log('Resultado da busca nova:', {
    id: result?.id,
    fee: result?.collection_fee_per_vehicle,
    date: result?.collection_date,
    status: result?.collection_fee_per_vehicle > 0 ? '✅ Fee válido!' : '⚠️  Fee inválido'
  });
  
  return result;
}

// Testar com os dados reais
const userId = '2168155a-28ce-4845-872b-f9a7b5b7bf90';
const addressLabel = 'general labatut, 123 - salvador';

console.log('🎯 === TESTANDO LÓGICAS DE BUSCA ===');
console.log('Collections disponíveis:', collections.length);
console.log('\nDetalhes:');
collections.forEach((c, i) => {
  console.log(`[${i+1}] ID: ${c.id.slice(0,8)}..., Fee: ${c.collection_fee_per_vehicle}, Date: ${c.collection_date}`);
});

const oldResult = simulateOldLogic(collections, userId, addressLabel);
const newResult = simulateNewLogic(collections, userId, addressLabel);

console.log('\n🏆 === RESULTADO COMPARATIVO ===');
console.log('Lógica antiga resultaria em fee:', oldResult?.collection_fee_per_vehicle);
console.log('Lógica nova resultaria em fee:', newResult?.collection_fee_per_vehicle);

const improvement = (oldResult?.collection_fee_per_vehicle === null) && (newResult?.collection_fee_per_vehicle > 0);
console.log(`\n${improvement ? '🎉 CORREÇÃO FUNCIONARÁ!' : '❌ Ainda há problema'}`);

if (improvement) {
  console.log('✅ A nova lógica encontrará o registro com fee válido (8.99)');
  console.log('✅ O reschedule preservará o fee durante a atualização');
  console.log('✅ O admin conseguirá aceitar a proposta sem erro');
} else {
  console.log('❌ A correção precisa de mais ajustes');
}
