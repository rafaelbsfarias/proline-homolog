const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const addressId = '7e43783c-447b-4775-8bb9-35501b8fe6db';
const clientId = '20789efe-7b7d-4297-a78a-7369fa1de06a';

async function findCollectionData() {
  console.log('🔍 Procurando dados da coleta aprovada com valor 0.01...\n');

  // 1. Buscar em collection_addresses (tabela de precificação de coletas)
  console.log('1️⃣ Verificando collection_addresses...');
  const { data: collAddrs, error: e1 } = await supabase
    .from('collection_addresses')
    .select('*')
    .eq('address_id', addressId);

  if (!e1) {
    console.log(`   ✅ Encontrados: ${collAddrs?.length || 0} registros`);
    if (collAddrs && collAddrs.length > 0) {
      collAddrs.forEach(addr => {
        console.log(`      - ID: ${addr.id}`);
        console.log(`        Preço: R$ ${addr.price}`);
        console.log(`        Status: ${addr.status}`);
        console.log('');
      });
    }
  } else {
    console.log(`   ❌ Erro: ${e1.message}\n`);
  }

  // 2. Buscar vehicles que possam estar associados
  console.log('2️⃣ Verificando vehicles do cliente...');
  const { data: vehicles, error: e2 } = await supabase
    .from('vehicles')
    .select('*')
    .eq('client_id', clientId);

  if (!e2 && vehicles) {
    console.log(`   ✅ Veículos encontrados: ${vehicles.length}`);
    vehicles.forEach(v => {
      console.log(`      - ${v.plate} (${v.brand} ${v.model} ${v.year})`);
      console.log(`        Status: ${v.status || 'N/A'}`);
      console.log(`        Collection Address ID: ${v.collection_address_id || 'N/A'}`);
    });
    console.log('');
  }

  // 3. Verificar se há uma tabela de histórico de coletas
  console.log('3️⃣ Verificando collection_history...');
  const { data: history, error: e3 } = await supabase
    .from('collection_history')
    .select('*')
    .eq('client_id', clientId)
    .limit(10);

  if (!e3) {
    console.log(`   ✅ Histórico encontrado: ${history?.length || 0}`);
    if (history && history.length > 0) {
      history.forEach(h => {
        console.log(`      - Evento: ${h.event_type}`);
        console.log(`        Data: ${h.created_at}`);
        console.log(`        Address ID: ${h.address_id || 'N/A'}`);
      });
    }
    console.log('');
  } else {
    console.log(`   ❌ Tabela não encontrada ou erro: ${e3.message}\n`);
  }

  // 4. Verificar logistics_operations
  console.log('4️⃣ Verificando logistics_operations...');
  const { data: logistics, error: e4 } = await supabase
    .from('logistics_operations')
    .select('*')
    .limit(10);

  if (!e4) {
    console.log(`   ✅ Operações encontradas: ${logistics?.length || 0}`);
    if (logistics && logistics.length > 0) {
      console.log('   Estrutura:', Object.keys(logistics[0]));
    }
    console.log('');
  } else {
    console.log(`   ❌ ${e4.message}\n`);
  }
}

findCollectionData().catch(console.error);
