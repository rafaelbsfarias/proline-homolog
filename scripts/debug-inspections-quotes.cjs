require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugInspections() {
  console.log('🔍 === ANÁLISE DE INSPEÇÕES E QUOTES GERADAS ===\n');

  // 1. Buscar todas as inspeções finalizadas
  const { data: inspections, error: inspError } = await supabase
    .from('inspections')
    .select(`
      id,
      vehicle_id,
      finalized,
      finalized_at,
      vehicles (
        id,
        plate,
        brand,
        model,
        status
      )
    `)
    .eq('finalized', true)
    .order('finalized_at', { ascending: false });

  if (inspError) {
    console.error('❌ Erro ao buscar inspeções:', inspError);
    return;
  }

  console.log(`📋 Total de inspeções finalizadas: ${inspections?.length || 0}\n`);

  // Para cada inspeção, verificar:
  // 1. inspection_services (categorias marcadas)
  // 2. service_orders criadas
  // 3. quotes geradas
  for (const inspection of inspections || []) {
    const vehicle = inspection.vehicles;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 INSPEÇÃO: ${inspection.id}`);
    console.log(`   Veículo: ${vehicle?.plate} - ${vehicle?.brand} ${vehicle?.model}`);
    console.log(`   Status Atual: ${vehicle?.status}`);
    console.log(`   Finalizada em: ${inspection.finalized_at}`);

    // 1. Buscar inspection_services (categorias necessárias)
    const { data: services } = await supabase
      .from('inspection_services')
      .select('id, category, required, notes')
      .eq('inspection_id', inspection.id)
      .eq('required', true);

    console.log(`\n   📦 Categorias Obrigatórias: ${services?.length || 0}`);
    services?.forEach((s, i) => {
      console.log(`      ${i + 1}. ${s.category}${s.notes ? ` (${s.notes})` : ''}`);
    });

    // 2. Buscar service_orders criadas para esta inspeção
    const { data: serviceOrders } = await supabase
      .from('service_orders')
      .select(`
        id,
        status,
        order_code,
        category_id,
        created_at,
        service_categories (
          key,
          name
        )
      `)
      .eq('source_inspection_id', inspection.id);

    console.log(`\n   📝 Service Orders Criadas: ${serviceOrders?.length || 0}`);
    if (serviceOrders && serviceOrders.length > 0) {
      serviceOrders.forEach((so, i) => {
        console.log(`      ${i + 1}. ${so.order_code}`);
        console.log(`         Categoria: ${so.service_categories?.name} (${so.service_categories?.key})`);
        console.log(`         Status: ${so.status}`);
        console.log(`         Criada em: ${so.created_at}`);
      });

      // 3. Para cada service_order, buscar quotes
      for (const so of serviceOrders) {
        const { data: quotes } = await supabase
          .from('quotes')
          .select(`
            id,
            partner_id,
            status,
            total_value,
            created_at,
            profiles:partner_id (
              full_name,
              email
            )
          `)
          .eq('service_order_id', so.id);

        console.log(`\n         💰 Quotes para ${so.order_code}: ${quotes?.length || 0}`);
        if (quotes && quotes.length > 0) {
          for (const q of quotes) {
            // Buscar nome do parceiro
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', q.partner_id)
              .single();

            console.log(`            - Quote ID: ${q.id}`);
            console.log(`              Partner: ${profile?.full_name || 'NOME NÃO ENCONTRADO'} (${q.partner_id.slice(0, 8)}...)`);
            console.log(`              Status: ${q.status || 'NULL (pendente)'}`);
            console.log(`              Valor: R$ ${q.total_value || 0}`);
          }
        } else {
          console.log(`            ⚠️  NENHUMA QUOTE CRIADA!`);
        }
      }
    } else {
      console.log(`      ⚠️  NENHUMA SERVICE ORDER CRIADA!`);
      console.log(`      🔍 Possível causa: status do veículo não era compatível`);
    }
  }

  console.log(`\n${'='.repeat(80)}\n`);

  // Sumário final
  console.log('📊 SUMÁRIO:');
  const { data: totalInspections } = await supabase
    .from('inspections')
    .select('id', { count: 'exact' })
    .eq('finalized', true);

  const { data: totalServiceOrders } = await supabase
    .from('service_orders')
    .select('id', { count: 'exact' });

  const { data: totalQuotes } = await supabase
    .from('quotes')
    .select('id', { count: 'exact' });

  console.log(`   Total de inspeções finalizadas: ${totalInspections?.length || 0}`);
  console.log(`   Total de service orders: ${totalServiceOrders?.length || 0}`);
  console.log(`   Total de quotes: ${totalQuotes?.length || 0}`);
  console.log(`   Média de quotes por inspeção: ${totalInspections?.length ? (totalQuotes?.length || 0) / totalInspections.length : 0}`);
}

debugInspections();
