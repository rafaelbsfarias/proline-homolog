require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function debugQuoteFlow() {
  console.log('🔍 === DEBUG DO FLUXO DE QUOTES ===\n');

  try {
    // 1. Verificar inspeções finalizadas recentes
    console.log('📋 1. INSPEÇÕES FINALIZADAS RECENTES:');
    const { data: inspections, error: inspError } = await supabase
      .from('inspections')
      .select('id, vehicle_id, specialist_id, finalized, finalized_at, created_at')
      .eq('finalized', true)
      .order('finalized_at', { ascending: false })
      .limit(3);

    if (inspError) {
      console.error('❌ Erro:', inspError);
    } else {
      console.log(`✅ Encontradas ${inspections?.length || 0} inspeções finalizadas`);
      inspections?.forEach((insp, i) => {
        console.log(`  ${i + 1}. ID: ${insp.id}`);
        console.log(`     Vehicle: ${insp.vehicle_id}`);
        console.log(`     Finalizada em: ${insp.finalized_at}`);
      });
    }

    // 2. Para cada inspeção, verificar inspection_services
    if (inspections && inspections.length > 0) {
      const lastInspection = inspections[0];
      console.log(`\n📦 2. CATEGORIAS DA ÚLTIMA INSPEÇÃO (${lastInspection.id}):`);

      const { data: services, error: servError } = await supabase
        .from('inspection_services')
        .select('id, category, required, notes')
        .eq('inspection_id', lastInspection.id)
        .eq('required', true);

      if (servError) {
        console.error('❌ Erro:', servError);
      } else {
        console.log(`✅ ${services?.length || 0} categorias obrigatórias:`);
        services?.forEach((s, i) => {
          console.log(`  ${i + 1}. Categoria: ${s.category}`);
          console.log(`     Notes: ${s.notes || 'N/A'}`);
        });
      }

      // 3. Verificar service_orders criadas para esta inspeção
      console.log(`\n📝 3. SERVICE ORDERS CRIADAS:`);
      const { data: serviceOrders, error: soError } = await supabase
        .from('service_orders')
        .select('id, vehicle_id, status, order_code, category_id, service_categories(key, name)')
        .eq('source_inspection_id', lastInspection.id);

      if (soError) {
        console.error('❌ Erro:', soError);
      } else {
        console.log(`✅ ${serviceOrders?.length || 0} service orders criadas:`);
        serviceOrders?.forEach((so, i) => {
          console.log(`  ${i + 1}. ID: ${so.id}`);
          console.log(`     Order Code: ${so.order_code}`);
          console.log(`     Status: ${so.status}`);
          console.log(`     Categoria: ${so.service_categories?.name} (${so.service_categories?.key})`);
        });

        // 4. Para cada service_order, verificar quotes criadas
        if (serviceOrders && serviceOrders.length > 0) {
          console.log(`\n💰 4. QUOTES CRIADAS POR SERVICE ORDER:`);

          for (const so of serviceOrders) {
            const { data: quotes, error: quotesError } = await supabase
              .from('quotes')
              .select(`
                id, 
                partner_id, 
                status, 
                total_value, 
                created_at
              `)
              .eq('service_order_id', so.id);
            
            // Buscar info do parceiro separadamente
            const quotesWithPartner = await Promise.all((quotes || []).map(async (q) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', q.partner_id)
                .single();
              return { ...q, partner_profile: profile };
            }));

            if (quotesError) {
              console.error(`❌ Erro ao buscar quotes da SO ${so.id}:`, quotesError);
            } else {
              console.log(`\n  📋 Service Order: ${so.order_code} (${so.service_categories?.name})`);
              console.log(`  ✅ ${quotesWithPartner?.length || 0} quotes criadas:`);
              quotesWithPartner?.forEach((q, i) => {
                console.log(`    ${i + 1}. Quote ID: ${q.id}`);
                console.log(`       Partner: ${q.partner_profile?.full_name} (${q.partner_profile?.email})`);
                console.log(`       Status: ${q.status || 'NULL'}`);
                console.log(`       Valor: R$ ${q.total_value || 0}`);
                console.log(`       Criada em: ${q.created_at}`);
              });
            }
          }
        }
      }

      // 5. Verificar o que a função RPC retorna para um dos parceiros
      console.log(`\n🔍 5. TESTANDO FUNÇÃO RPC DO DASHBOARD:`);
      
      // Buscar um parceiro de teste
      const { data: partners } = await supabase
        .from('partners')
        .select('profile_id, company_name')
        .limit(1)
        .single();

      if (partners) {
        console.log(`\n  Testando para parceiro: ${partners.company_name}`);
        
        const { data: dashboardData, error: dashError } = await supabase
          .rpc('get_partner_dashboard_data', { p_partner_id: partners.profile_id });

        if (dashError) {
          console.error('  ❌ Erro na RPC:', dashError);
        } else {
          console.log('  ✅ Dados do dashboard:');
          console.log(`     Budget Counters:`, dashboardData?.budget_counters);
          console.log(`     Pending Quotes Count:`, dashboardData?.pending_quotes?.count);
          console.log(`     Pending Quotes Items:`, dashboardData?.pending_quotes?.items?.length || 0);
          
          if (dashboardData?.pending_quotes?.items?.length > 0) {
            console.log(`\n     Detalhes das quotes pendentes:`);
            dashboardData.pending_quotes.items.forEach((item, i) => {
              console.log(`       ${i + 1}. Quote ID: ${item.id}`);
              console.log(`          Vehicle: ${item.vehicle_plate}`);
              console.log(`          Status: ${item.status || 'NULL'}`);
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('\n🔍 === FIM DO DEBUG ===');
}

debugQuoteFlow();
