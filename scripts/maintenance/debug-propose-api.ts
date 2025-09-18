// Script de debug para testar a API propose-collection-date
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';

async function debugProposeCollectionDate(clientId: string, addressId: string) {
  const admin = SupabaseService.getInstance().getAdminClient();

  console.log('=== DEBUG PROPOSE COLLECTION DATE ===');
  console.log('Client ID:', clientId);
  console.log('Address ID:', addressId);

  // 1. Verificar se o endereço existe
  const { data: address, error: addrError } = await admin
    .from('addresses')
    .select('id, street, number, city')
    .eq('id', addressId)
    .maybeSingle();

  if (addrError || !address) {
    console.error('Address not found:', addrError);
    return;
  }

  const addressLabel = formatAddressLabel(address);
  const normalizedLabel = normalizeAddressLabel(addressLabel);

  console.log('Address found:', address);
  console.log('Formatted Label:', `"${addressLabel}"`);
  console.log('Normalized Label:', `"${normalizedLabel}"`);

  // 2. Verificar todos os registros de vehicle_collections para este cliente
  const { data: allCollections, error: collError } = await admin
    .from('vehicle_collections')
    .select(
      'id, collection_address, collection_fee_per_vehicle, status, collection_date, client_id'
    )
    .eq('client_id', clientId);

  console.log('\n=== ALL VEHICLE COLLECTIONS FOR CLIENT ===');
  console.log('Total records:', allCollections?.length || 0);
  console.log('Error:', collError);

  if (allCollections) {
    allCollections.forEach((col: any, index: number) => {
      const colNormalized = normalizeAddressLabel(col.collection_address);
      console.log(`${index + 1}. ID: ${col.id}`);
      console.log(`   Address: "${col.collection_address}"`);
      console.log(`   Normalized: "${colNormalized}"`);
      console.log(`   Fee: ${col.collection_fee_per_vehicle}`);
      console.log(`   Status: ${col.status}`);
      console.log(`   Date: ${col.collection_date}`);
      console.log(`   Exact Match: ${col.collection_address === addressLabel}`);
      console.log(`   Normalized Match: ${colNormalized === normalizedLabel}`);
      console.log('');
    });
  }

  // 3. Testar a query exata que o endpoint faz
  console.log('\n=== TESTING ENDPOINT QUERY ===');
  const { data: exactQuery, error: exactError } = await admin
    .from('vehicle_collections')
    .select('id, collection_fee_per_vehicle')
    .eq('client_id', clientId)
    .eq('collection_address', addressLabel)
    .in('status', ['requested', 'approved'])
    .order('collection_date', { ascending: false, nullsLast: true })
    .limit(1)
    .maybeSingle();

  console.log('Exact query result:', exactQuery);
  console.log('Exact query error:', exactError);

  // 4. Testar o fallback ILIKE
  const { data: ilikeQuery, error: ilikeError } = await admin
    .from('vehicle_collections')
    .select('id, collection_fee_per_vehicle')
    .eq('client_id', clientId)
    .ilike('collection_address', `%${addressLabel}%`)
    .in('status', ['requested', 'approved'])
    .order('collection_date', { ascending: false, nullsLast: true })
    .limit(1);

  console.log('ILIKE query result:', ilikeQuery);
  console.log('ILIKE query error:', ilikeError);

  // 5. Verificar veículos para este endereço
  const { data: vehicles, error: vehError } = await admin
    .from('vehicles')
    .select('id, status, pickup_address_id')
    .eq('client_id', clientId)
    .eq('pickup_address_id', addressId);

  console.log('\n=== VEHICLES FOR THIS ADDRESS ===');
  console.log('Total vehicles:', vehicles?.length || 0);
  console.log('Error:', vehError);

  if (vehicles) {
    vehicles.forEach((veh: any, index: number) => {
      console.log(`${index + 1}. ID: ${veh.id}, Status: ${veh.status}`);
    });
  }
}

export { debugProposeCollectionDate };
