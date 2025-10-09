#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reprocessInspection() {
  console.log('\n🔍 === REPROCESSANDO INSPEÇÃO EXISTENTE ===\n');

  // Usar uma das inspeções que já sabemos que tem service_orders mas não tem quotes
  const inspectionId = '60283b9e-9406-47d5-ac04-d62e008c25d7';

  console.log(`Inspeção: ${inspectionId}\n`);

  // 1. Buscar veículo e detalhes
  const { data: inspection } = await supabase
    .from('inspections')
    .select('vehicle_id, specialist_id')
    .eq('id', inspectionId)
    .single();

  if (!inspection) {
    console.log('❌ Inspeção não encontrada');
    return;
  }

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('client_id')
    .eq('id', inspection.vehicle_id)
    .single();

  console.log('Detalhes:');
  console.log(`  Vehicle ID: ${inspection.vehicle_id}`);
  console.log(`  Client ID: ${vehicle?.client_id}`);
  console.log(`  Specialist ID: ${inspection.specialist_id}`);
  console.log();

  // 2. Buscar os serviços necessários
  const { data: services } = await supabase
    .from('inspection_services')
    .select('category')
    .eq('inspection_id', inspectionId)
    .eq('required', true);

  console.log(`Serviços necessários: ${services?.length || 0}`);
  services?.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.category}`);
  });
  console.log();

  // 3. Buscar as service orders existentes
  const { data: serviceOrders } = await supabase
    .from('service_orders')
    .select('id, order_code, category_id')
    .eq('source_inspection_id', inspectionId);

  console.log(`Service Orders existentes: ${serviceOrders?.length || 0}`);
  console.log();

  // 4. Para cada service order, tentar criar quotes manualmente
  if (serviceOrders && serviceOrders.length > 0) {
    console.log('Criando quotes manualmente...\n');

    for (const so of serviceOrders) {
      console.log(`📦 Service Order: ${so.order_code}`);
      
      // Buscar parceiros
      const { data: partners, error: partnersError } = await supabase
        .from('partners_service_categories')
        .select('partner_id, partners!inner(profile_id, company_name)')
        .eq('category_id', so.category_id);

      if (partnersError) {
        console.log(`   ❌ Erro ao buscar parceiros:`, partnersError);
        continue;
      }

      console.log(`   Parceiros encontrados: ${partners?.length || 0}`);

      if (partners && partners.length > 0) {
        for (const partner of partners) {
          const profileId = Array.isArray(partner.partners)
            ? partner.partners[0]?.profile_id
            : partner.partners?.profile_id;

          const companyName = Array.isArray(partner.partners)
            ? partner.partners[0]?.company_name
            : partner.partners?.company_name;

          console.log(`   → Criando quote para ${companyName}...`);

          const { error: quoteError } = await supabase
            .from('quotes')
            .insert({
              service_order_id: so.id,
              partner_id: profileId,
              status: null,
              total_value: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (quoteError) {
            console.log(`      ❌ Erro:`, quoteError);
          } else {
            console.log(`      ✅ Quote criada com sucesso!`);
          }
        }
      }
      console.log();
    }
  }

  // 5. Verificar resultado
  console.log('================================================================================');
  console.log('VERIFICANDO RESULTADO:\n');

  const { data: finalQuotes } = await supabase
    .from('quotes')
    .select('id, partner_id, service_order_id, status')
    .in('service_order_id', serviceOrders?.map(so => so.id) || []);

  console.log(`Total de quotes criadas: ${finalQuotes?.length || 0}`);
  
  if (finalQuotes && finalQuotes.length > 0) {
    finalQuotes.forEach((q, i) => {
      console.log(`  ${i + 1}. Partner: ${q.partner_id}, Status: ${q.status}`);
    });
  }

  console.log('\n================================================================================\n');
}

reprocessInspection().catch(console.error);
