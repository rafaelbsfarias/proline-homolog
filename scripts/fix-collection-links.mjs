import {
  createClient
} from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega explicitamente o .env.local
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local')
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: URL do Supabase ou Chave de Serviço não definidas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCollectionLinks() {
  console.log('Iniciando script para corrigir vínculos de coleta...');

  // 1. Find inconsistent vehicles
  const {
    data: vehicles,
    error: vehiclesError
  } = await supabase
    .from('vehicles')
    .select('id, plate, client_id, pickup_address_id')
    .eq('status', 'AGUARDANDO APROVAÇÃO DA COLETA')
    .is('collection_id', null);

  if (vehiclesError) {
    console.error('Erro ao buscar veículos inconsistentes:', vehiclesError);
    return;
  }

  if (!vehicles || vehicles.length === 0) {
    console.log('Nenhum veículo com vínculo de coleta quebrado encontrado. Os dados parecem consistentes.');
    return;
  }

  console.log(`Encontrados ${vehicles.length} veículos para corrigir.`);

  let fixedCount = 0;
  for (const vehicle of vehicles) {
    console.log(`
Processando veículo: ${vehicle.plate} (ID: ${vehicle.id})`);

    if (!vehicle.pickup_address_id) {
      console.warn(`  -> Ignorando: Veículo não possui pickup_address_id.`);
      continue;
    }

    // 2. Get the address string from the addresses table
    const {
      data: address,
      error: addressError
    } = await supabase
      .from('addresses')
      .select('street, number, city')
      .eq('id', vehicle.pickup_address_id)
      .single();

    if (addressError || !address) {
      console.warn(`  -> Ignorando: Endereço (ID: ${vehicle.pickup_address_id}) não encontrado.`);
      continue;
    }

    const addressLabel = `${address.street || ''}${address.number ? ', ' + address.number : ''}${address.city ? ' - ' + address.city : ''}`.trim();
    console.log(`  -> Endereço encontrado: "${addressLabel}"`);

    // 3. Find the matching vehicle_collections record
    const {
      data: collection,
      error: collectionError
    } = await supabase
      .from('vehicle_collections')
      .select('id')
      .eq('client_id', vehicle.client_id)
      .eq('collection_address', addressLabel)
      .order('created_at', {
        ascending: false
      }) // Get the latest one for this address
      .limit(1)
      .single();

    if (collectionError || !collection) {
      console.warn(`  -> Ignorando: Nenhuma coleta correspondente encontrada para o endereço.`);
      continue;
    }

    console.log(`  -> Coleta correspondente encontrada: ${collection.id}`);

    // 4. Update the vehicle's collection_id
    const {
      error: updateError
    } = await supabase
      .from('vehicles')
      .update({
        collection_id: collection.id
      })
      .eq('id', vehicle.id);

    if (updateError) {
      console.error(`  -> ERRO ao atualizar o veículo ${vehicle.plate}:`, updateError.message);
    } else {
      console.log(`  -> SUCESSO: Veículo ${vehicle.plate} vinculado à coleta ${collection.id}.`);
      fixedCount++;
    }
  }

  console.log(`
Concluído. ${fixedCount} de ${vehicles.length} veículos foram corrigidos.`);
}

fixCollectionLinks();
