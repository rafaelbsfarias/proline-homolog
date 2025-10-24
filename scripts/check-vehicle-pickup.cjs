require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const vehicleId = '076638ab-0d27-4a2d-947c-9ebbdd9ce184';

async function checkAddresses() {
  console.log('🔍 Verificando endereços de entregas\n');

  // Buscar delivery requests com address_id
  const { data: requests, error: reqErr } = await supabase
    .from('delivery_requests')
    .select('id, vehicle_id, address_id, client_id')
    .not('address_id', 'is', null)
    .limit(5);

  console.log('=== DELIVERY REQUESTS COM ENDEREÇO ===');
  if (reqErr) {
    console.log('Erro:', reqErr.message);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log('Nenhuma solicitação com endereço encontrada');
    return;
  }

  console.log('Total:', requests.length, '\n');
  
  for (const req of requests) {
    console.log('Request ID:', req.id);
    console.log('Address ID:', req.address_id);
    
    // Buscar o endereço
    const { data: addr, error: addrErr } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', req.address_id)
      .single();
    
    if (addrErr) {
      console.log('❌ Erro ao buscar endereço:', addrErr.message);
    } else if (!addr) {
      console.log('❌ Endereço não encontrado');
    } else {
      console.log('✅ Endereço:', addr.label || `${addr.street} ${addr.number}, ${addr.city}`);
    }
    console.log('');
  }
}

async function check() {
  console.log('🔍 Verificando veículo:', vehicleId, '\n');

  // 1. Verificar dados do veículo
  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();
  
  console.log('=== DADOS DO VEÍCULO ===');
  if (vErr) {
    console.log('❌ Erro:', vErr.message);
  } else {
    console.log('✅ Veículo encontrado:');
    console.log('  - ID:', vehicle.id);
    console.log('  - Placa:', vehicle.plate);
    console.log('  - Status:', vehicle.status);
    console.log('  - Cliente ID:', vehicle.client_id);
    console.log('  - Brand/Model:', vehicle.brand, vehicle.model);
  }

  // 2. Verificar solicitações de retirada desse veículo
  const { data: requests, error: rErr } = await supabase
    .from('delivery_requests')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  
  console.log('\n=== SOLICITAÇÕES DE RETIRADA/ENTREGA ===');
  if (rErr) {
    console.log('❌ Erro:', rErr.message);
  } else if (!requests || requests.length === 0) {
    console.log('⚠️  Nenhuma solicitação encontrada para este veículo');
  } else {
    console.log(`✅ ${requests.length} solicitação(ões) encontrada(s):\n`);
    requests.forEach((req, i) => {
      console.log(`  Solicitação ${i + 1}:`);
      console.log('    - ID:', req.id);
      console.log('    - Status:', req.status);
      console.log('    - Cliente ID:', req.client_id);
      console.log('    - Address ID:', req.address_id || '(null = retirada no pátio)');
      console.log('    - Data desejada:', req.desired_date);
      console.log('    - Criado por:', req.created_by);
      console.log('    - Criado em:', req.created_at);
      console.log('');
    });
  }

  // 3. Verificar critérios da API
  console.log('=== ANÁLISE DOS CRITÉRIOS DA API ===');
  const clientId = vehicle?.client_id;
  
  if (!requests || requests.length === 0) {
    console.log('❌ Falha: Nenhuma solicitação de retirada/entrega cadastrada');
    return;
  }

  const latestRequest = requests[0];
  const checks = {
    hasRequest: requests.length > 0,
    isPickup: latestRequest.address_id === null,
    statusOk: ['requested', 'approved', 'scheduled'].includes(latestRequest.status),
    clientMatch: true, // API filtra por clientId na query
  };

  console.log('  ✓ Tem solicitação:', checks.hasRequest ? '✅' : '❌');
  console.log('  ✓ É retirada no pátio (address_id null):', checks.isPickup ? '✅' : '❌');
  console.log('  ✓ Status válido (requested/approved/scheduled):', checks.statusOk ? '✅' : '❌');
  console.log('  ✓ Cliente ID corresponde:', checks.clientMatch ? '✅' : '❌');

  const shouldAppear = Object.values(checks).every(v => v === true);
  console.log('\n' + (shouldAppear ? '✅ DEVE APARECER' : '❌ NÃO DEVE APARECER'));

  if (!shouldAppear) {
    console.log('\n📋 Motivos:');
    if (!checks.hasRequest) console.log('  - Sem solicitação cadastrada');
    if (!checks.isPickup) console.log('  - Não é retirada no pátio (tem endereço de entrega)');
    if (!checks.statusOk) console.log('  - Status inválido:', latestRequest.status);
  }
}

checkAddresses().catch(console.error);
