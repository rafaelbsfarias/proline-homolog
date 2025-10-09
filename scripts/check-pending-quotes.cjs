/**
 * Script para verificar se existem quotes pending_partner no banco
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkPendingQuotes() {
  console.log('Verificando quotes pending_partner...\n');

  const { data, error } = await supabase
    .from('quotes')
    .select(
      `
      id,
      partner_id,
      status,
      service_order_id
    `
    )
    .eq('status', 'pending_partner');

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log(`Total de quotes pending_partner: ${data?.length || 0}\n`);

  if (data && data.length > 0) {
    for (const quote of data) {
      // Buscar service_order
      const { data: so, error: soError } = await supabase
        .from('service_orders')
        .select('id, vehicle_id, inspection_service_id')
        .eq('id', quote.service_order_id)
        .single();

      if (soError) {
        console.log(`  Erro ao buscar SO: ${soError.message}`);
        continue;
      }

      // Buscar vehicle
      const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .select('id, plate, status')
        .eq('id', so.vehicle_id)
        .single();

      // Buscar inspection_service
      const { data: inspSvc, error: isError } = await supabase
        .from('inspection_services')
        .select('id, service_category_id')
        .eq('id', so.inspection_service_id)
        .single();

      // Buscar category
      let categoryName = 'N/A';
      if (inspSvc && inspSvc.service_category_id) {
        const { data: category } = await supabase
          .from('service_categories')
          .select('name')
          .eq('id', inspSvc.service_category_id)
          .single();
        categoryName = category?.name || 'N/A';
      }

      console.log(`Quote:`);
      console.log(`  ID: ${quote.id}`);
      console.log(`  Partner ID: ${quote.partner_id}`);
      console.log(`  Vehicle ID: ${vehicle?.id}`);
      console.log(`  Vehicle Plate: ${vehicle?.plate}`);
      console.log(`  Vehicle Status: ${vehicle?.status}`);
      console.log(`  Category: ${categoryName}`);
      console.log('');
    }
  } else {
    console.log('⚠️  Nenhum quote pending_partner encontrado.');
    console.log('Execute o fluxo de finalização de checklist pelo especialista primeiro.\n');
  }
}

checkPendingQuotes()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });
