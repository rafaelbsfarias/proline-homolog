const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function debugPartnerDashboard() {
  console.log('📊 === DEBUG DASHBOARD DO PARCEIRO ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const partnerId = '5713fa01-3475-4c52-ad64-5230285adef1';

  try {
    console.log('🔍 Testando função get_partner_dashboard_data...');
    
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_partner_dashboard_data', { p_partner_id: partnerId });

    if (dashboardError) {
      console.error('❌ Erro ao executar função dashboard:', dashboardError);
      return;
    }

    console.log('✅ Dados do dashboard:');
    console.log(JSON.stringify(dashboardData, null, 2));

    
    console.log('\n📋 Análise detalhada dos quotes pendentes:');
    const pendingQuotes = dashboardData?.pending_quotes;
    console.log('  Count:', pendingQuotes?.count || 0);
    console.log('  Items:', pendingQuotes?.items?.length || 0);
    
    if (pendingQuotes?.items && pendingQuotes.items.length > 0) {
      pendingQuotes.items.forEach((item, index) => {
        console.log(`  ${index + 1}. Quote ID: ${item.id}`);
        console.log(`     Vehicle: ${item.vehicle_plate} (${item.vehicle_brand} ${item.vehicle_model})`);
        console.log(`     Client: ${item.client_name}`);
        console.log(`     Status: ${item.status}`);
        console.log(`     Date: ${item.date}`);
        console.log(`     Value: ${item.total_value}`);
      });
    }

    
    console.log('\n🔍 Verificação manual da query de quotes pendentes...');
    
    const { data: manualQuotes, error: manualError } = await supabase
      .from('quotes')
      .select(`
        id,
        status,
        partner_id,
        created_at,
        total_value,
        service_order_id,
        service_orders (
          id,
          client_id,
          vehicle_id,
          vehicles (
            plate,
            brand,
            model
          )
        )
      `)
      .eq('partner_id', partnerId)
      .in('status', ['pending_admin_approval', 'pending_client_approval']);

    if (manualError) {
      console.error('❌ Erro na query manual:', manualError);
    } else {
      console.log('✅ Query manual - Quotes encontrados:', manualQuotes?.length || 0);
      if (manualQuotes && manualQuotes.length > 0) {
        manualQuotes.forEach((quote, index) => {
          console.log(`  ${index + 1}. ID: ${quote.id}`);
          console.log(`     Status: ${quote.status}`);
          console.log(`     Service Order: ${quote.service_order_id}`);
          console.log(`     Vehicle Data:`, quote.service_orders?.vehicles);
        });
      }
    }


    console.log('\n🔍 Verificando os quotes do partner...');
    
    const { data: allQuotes, error: allQuotesError } = await supabase
      .from('quotes')
      .select('id, status, created_at, service_order_id')
      .eq('partner_id', partnerId);

    if (allQuotesError) {
      console.error('❌ Erro ao buscar todos os quotes:', allQuotesError);
    } else {
      console.log('✅ Total de quotes do partner:', allQuotes?.length || 0);
      if (allQuotes && allQuotes.length > 0) {
        allQuotes.forEach((quote, index) => {
          console.log(`  ${index + 1}. ID: ${quote.id} | Status: ${quote.status} | Date: ${quote.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('📊 === FIM DO DEBUG ===');
}

debugPartnerDashboard();
}

debugPartnerDashboard();
