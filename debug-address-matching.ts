import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';

async function debugAddressMatching() {
  const admin = SupabaseService.getInstance().getAdminClient();

  // Simular o endereço problemático
  const testAddress = {
    street: 'general labatut',
    number: '12388',
    city: 'salvador',
  };

  const addressLabel = formatAddressLabel(testAddress);
  const normalizedLabel = normalizeAddressLabel(addressLabel);

  console.log('=== DEBUG ADDRESS MATCHING ===');
  console.log('Test Address:', testAddress);
  console.log('Formatted Label:', addressLabel);
  console.log('Normalized Label:', normalizedLabel);

  // Buscar todos os registros de vehicle_collections para análise
  const { data: allCollections, error } = await admin
    .from('vehicle_collections')
    .select(
      'id, client_id, collection_address, collection_fee_per_vehicle, status, collection_date'
    )
    .in('status', ['requested', 'approved'])
    .limit(50);

  if (error) {
    console.error('Error fetching collections:', error);
    return;
  }

  console.log('\n=== ALL COLLECTIONS ===');
  console.log(`Total records: ${allCollections?.length || 0}`);

  // Analisar cada registro
  const matches = [];
  const partialMatches = [];

  allCollections?.forEach((collection: any) => {
    const collectionNormalized = normalizeAddressLabel(collection.collection_address);
    const exactMatch = collection.collection_address === addressLabel;
    const normalizedMatch = collectionNormalized === normalizedLabel;
    const containsMatch = collection.collection_address.toLowerCase().includes('general labatut');

    if (exactMatch || normalizedMatch) {
      matches.push({
        id: collection.id,
        address: collection.collection_address,
        normalized: collectionNormalized,
        fee: collection.collection_fee_per_vehicle,
        status: collection.status,
        exactMatch,
        normalizedMatch,
      });
    }

    if (containsMatch) {
      partialMatches.push({
        id: collection.id,
        address: collection.collection_address,
        fee: collection.collection_fee_per_vehicle,
        status: collection.status,
      });
    }
  });

  console.log('\n=== EXACT/NORMALIZED MATCHES ===');
  console.log(`Found ${matches.length} matches:`);
  matches.forEach(match => {
    console.log(`- ID: ${match.id}`);
    console.log(`  Address: "${match.address}"`);
    console.log(`  Normalized: "${match.normalized}"`);
    console.log(`  Fee: ${match.fee}`);
    console.log(`  Status: ${match.status}`);
    console.log(`  Exact Match: ${match.exactMatch}`);
    console.log(`  Normalized Match: ${match.normalizedMatch}`);
    console.log('');
  });

  console.log('\n=== PARTIAL MATCHES (contains "general labatut") ===');
  console.log(`Found ${partialMatches.length} partial matches:`);
  partialMatches.forEach(match => {
    console.log(
      `- ID: ${match.id}, Address: "${match.address}", Fee: ${match.fee}, Status: ${match.status}`
    );
  });

  // Testar a query exata que o endpoint faz
  console.log('\n=== TESTING ENDPOINT QUERY ===');
  const { data: exactQueryResult, error: exactError } = await admin
    .from('vehicle_collections')
    .select('id, collection_fee_per_vehicle')
    .eq('client_id', 'test-client-id') // Substitua por um client_id real para teste
    .eq('collection_address', addressLabel)
    .in('status', ['requested', 'approved'])
    .order('collection_date', { ascending: false, nullsLast: true })
    .limit(1)
    .maybeSingle();

  console.log('Exact query result:', exactQueryResult);
  console.log('Exact query error:', exactError);

  // Testar ILIKE fallback
  const { data: ilikeResult, error: ilikeError } = await admin
    .from('vehicle_collections')
    .select('id, collection_fee_per_vehicle')
    .eq('client_id', 'test-client-id') // Substitua por um client_id real para teste
    .ilike('collection_address', addressLabel)
    .in('status', ['requested', 'approved'])
    .order('collection_date', { ascending: false, nullsLast: true })
    .limit(1);

  console.log('ILIKE query result:', ilikeResult);
  console.log('ILIKE query error:', ilikeError);
}

export { debugAddressMatching };
