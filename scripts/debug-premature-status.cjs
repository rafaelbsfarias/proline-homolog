require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPrematureStatus() {
  console.log('\n🔍 Buscando quotes com status pending_client_approval e sent_to_admin_at NULL:\n');
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('status', 'pending_client_approval')
    .is('sent_to_admin_at', null);
  
  if (error) {
    console.error('Erro:', error.message);
    return;
  }
  
  console.log(`Total: ${quotes?.length || 0}\n`);
  
  if (!quotes || quotes.length === 0) {
    console.log('Nenhum quote encontrado nessa situação');
    return;
  }
  
  for (const q of quotes) {
    console.log('='.repeat(80));
    console.log(`ID: ${q.id}`);
    console.log(`Status: ${q.status}`);
    console.log(`Total: R$ ${q.total_value || 0}`);
    console.log(`Partner ID: ${q.partner_id}`);
    console.log(`Criado: ${q.created_at}`);
    console.log(`Atualizado: ${q.updated_at}`);
    console.log(`Enviado admin: ${q.sent_to_admin_at || 'NULL'}`);
    console.log(`Aprovação admin: ${q.admin_approval_date || 'NULL'}`);
    
    // Buscar service order relacionada
    const { data: so } = await supabase
      .from('service_orders')
      .select('vehicle_id')
      .eq('quote_id', q.id)
      .single();
    
    if (so) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('license_plate, brand, model')
        .eq('id', so.vehicle_id)
        .single();
      
      if (vehicle) {
        console.log(`Veículo: ${vehicle.license_plate} - ${vehicle.brand} ${vehicle.model}`);
      }
    }
    
    console.log();
  }
  
  // Buscar histórico do vehicle_history
  console.log('\n📋 Verificando vehicle_history:\n');
  const quoteIds = quotes.map(q => q.id);
  
  const { data: history } = await supabase
    .from('vehicle_history')
    .select('*')
    .in('quote_id', quoteIds)
    .order('created_at', { ascending: false });
  
  if (history && history.length > 0) {
    history.forEach(h => {
      console.log(`${h.created_at}`);
      console.log(`  Quote: ${h.quote_id?.substring(0, 8)}...`);
      console.log(`  Action: ${h.action}`);
      console.log(`  Performed by: ${h.performed_by}`);
      console.log();
    });
  } else {
    console.log('Nenhum histórico encontrado');
  }
}

debugPrematureStatus().catch(console.error);
