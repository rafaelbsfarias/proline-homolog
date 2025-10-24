const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const clientId = '20789efe-7b7d-4297-a78a-7369fa1de06a';

async function testAPI() {
  console.log('🔍 Testando busca de dados para a API\n');

  // 1. Buscar todas as solicitações
  const { data: allRequests, error: reqError } = await supabase
    .from('delivery_requests')
    .select('id, vehicle_id, desired_date, created_by, status, address_id, fee_amount')
    .eq('client_id', clientId)
    .in('status', ['requested', 'approved', 'scheduled'])
    .order('created_at', { ascending: false });

  if (reqError) {
    console.error('❌ Erro ao buscar solicitações:', reqError);
    return;
  }

  console.log('📦 Solicitações encontradas:', allRequests?.length);
  allRequests?.forEach((req, i) => {
    console.log(`\n  ${i + 1}. Request ID: ${req.id}`);
    console.log(`     Vehicle ID: ${req.vehicle_id}`);
    console.log(`     Address ID: ${req.address_id || 'null (retirada)'}`);
    console.log(`     Fee: ${req.fee_amount ?? 'null'}`);
    console.log(`     Status: ${req.status}`);
  });

  // 2. Buscar endereços
  const addressIds = allRequests?.filter(r => r.address_id).map(r => r.address_id) || [];
  console.log(`\n📍 Address IDs para buscar: ${addressIds.length}`);
  console.log(`   IDs:`, addressIds);

  if (addressIds.length > 0) {
    const { data: addresses, error: addrError } = await supabase
      .from('addresses')
      .select('id, street, number, complement, neighborhood, city, state, zip_code')
      .in('id', addressIds);

    if (addrError) {
      console.error('❌ Erro ao buscar endereços:', addrError);
    } else {
      console.log('\n✅ Endereços encontrados:', addresses?.length);
      addresses?.forEach((addr, i) => {
        const label = [addr.street, addr.number, addr.neighborhood, addr.city].filter(Boolean).join(', ');
        console.log(`\n  ${i + 1}. Address ID: ${addr.id}`);
        console.log(`     Label: ${label}`);
        console.log(`     Full: ${addr.street} ${addr.number}, ${addr.neighborhood} - ${addr.city}`);
      });

      // 3. Buscar valores anteriores
      const { data: previousRequests, error: prevError } = await supabase
        .from('delivery_requests')
        .select('address_id, fee_amount, updated_at')
        .eq('client_id', clientId)
        .in('address_id', addressIds)
        .not('fee_amount', 'is', null)
        .order('updated_at', { ascending: false });

      console.log('\n💰 Valores anteriores de delivery_requests:', previousRequests?.length || 0);
      const feeMap = new Map();
      previousRequests?.forEach(req => {
        if (!feeMap.has(req.address_id)) {
          feeMap.set(req.address_id, req.fee_amount);
          console.log(`   Address ${req.address_id}: R$ ${req.fee_amount}`);
        }
      });

      // 3.2 Buscar valores de collection_history
      const { data: collectionHistory, error: historyError } = await supabase
        .from('collection_history')
        .select('collection_address, collection_fee_per_vehicle')
        .eq('client_id', clientId)
        .not('collection_fee_per_vehicle', 'is', null)
        .order('finalized_at', { ascending: false});

      if (!historyError && collectionHistory) {
        console.log('\n� Valores de collection_history:', collectionHistory.length);
        collectionHistory.forEach(ch => {
          console.log(`   ${ch.collection_address}: R$ ${ch.collection_fee_per_vehicle}`);
        });

        // Mapear para addresses
        addresses?.forEach(address => {
          // Criar versão normalizada do endereço (remover pontuação, espaços extras)
          const normalizeAddress = (addr) => {
            return addr.toLowerCase()
              .replace(/[,\-\.]/g, ' ') // Substituir pontuação por espaço
              .replace(/\s+/g, ' ') // Remover espaços múltiplos
              .trim();
          };

          const addressParts = [address.street, address.number, address.city].filter(Boolean);
          const addressNormalized = normalizeAddress(addressParts.join(' '));

          console.log(`   🔍 Procurando match para: "${addressNormalized}"`);

          const matchingCollection = collectionHistory.find(ch => {
            const chNormalized = normalizeAddress(ch.collection_address || '');
            console.log(`      Comparando com: "${chNormalized}"`);
            
            // Verificar se contém todas as partes principais
            return addressParts.every(part => 
              chNormalized.includes(normalizeAddress(part))
            );
          });

          if (matchingCollection) {
            feeMap.set(address.id, matchingCollection.collection_fee_per_vehicle);
            console.log(`   ✅ Match encontrado! ${address.id} → R$ ${matchingCollection.collection_fee_per_vehicle}`);
          } else {
            console.log(`   ❌ Nenhum match encontrado`);
          }
        });
      } else if (historyError) {
        console.error('❌ Erro ao buscar collection_history:', historyError);
      }

      // 4. Mapear tudo junto
      console.log('\n🔄 MAPEAMENTO FINAL:\n');
      allRequests?.forEach(req => {
        const addr = addresses?.find(a => a.id === req.address_id);
        const previousFee = req.address_id ? feeMap.get(req.address_id) : null;
        const finalFee = req.fee_amount ?? previousFee;

        const addrLabel = addr ? 
          [addr.street, addr.number, addr.neighborhood, addr.city].filter(Boolean).join(', ') : 
          '-';

        console.log(`Request: ${req.id.substring(0, 8)}...`);
        console.log(`  Type: ${req.address_id ? 'DELIVERY' : 'PICKUP'}`);
        console.log(`  Address: ${addrLabel}`);
        console.log(`  Original Fee: ${req.fee_amount ?? 'null'}`);
        console.log(`  Previous Fee: ${previousFee ?? 'null'}`);
        console.log(`  Final Fee: ${finalFee ?? 'null'}`);
        console.log('');
      });
    }
  }

  // 5. Buscar veículos
  const vehicleIds = allRequests?.map(r => r.vehicle_id) || [];
  const { data: vehicles, error: vehError } = await supabase
    .from('vehicles')
    .select('id, plate, brand, model, year')
    .in('id', vehicleIds);

  if (vehError) {
    console.error('❌ Erro ao buscar veículos:', vehError);
  } else {
    console.log('\n🚗 Veículos encontrados:', vehicles?.length);
    vehicles?.forEach(v => {
      console.log(`   ${v.plate} - ${v.brand} ${v.model} (${v.year})`);
    });
  }
}

testAPI().catch(console.error);
