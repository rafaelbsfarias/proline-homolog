import { createClient } from '@supabase/supabase-js';

// Este script requer que as variáveis de ambiente estejam definidas.
// Você pode executá-lo da seguinte forma:
// NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/test-rpc-collection-details.mjs <seu_collection_id>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: URL do Supabase ou Chave de Serviço não definidas.');
  console.error('Por favor, defina as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRpc(collectionId) {
  if (!collectionId) {
    console.error('Erro: Nenhum collection_id fornecido.');
    console.log('\nUso: node scripts/test-rpc-collection-details.mjs <collection_id>');
    console.log('Exemplo: node scripts/test-rpc-collection-details.mjs a9fc7211-f1da-4084-bdc8-2278cb39aa8b');
    process.exit(1);
  }

  console.log(`Testando RPC 'get_vehicle_collection_details' com collection_id: ${collectionId}`);

  try {
    const { data, error } = await supabase.rpc('get_vehicle_collection_details', {
      p_collection_id: collectionId,
    });

    if (error) {
      console.error('\nChamada RPC falhou:');
      console.error(error);
      return;
    }

    console.log('\nChamada RPC bem-sucedida. Resultado:');
    console.log(JSON.stringify(data, null, 2));

  } catch (e) {
    console.error('\nOcorreu um erro inesperado:', e);
  }
}

const collectionIdFromArgs = process.argv[2];
testRpc(collectionIdFromArgs);
