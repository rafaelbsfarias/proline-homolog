const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function populateServicesTable() {
  console.log('🔄 === POPULANDO TABELA SERVICES ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Buscar todos os partner_services
    console.log('👥 Buscando partner_services...');
    const { data: partnerServices, error: partnerServicesError } = await supabase
      .from('partner_services')
      .select('*');

    if (partnerServicesError) {
      console.error('❌ Erro ao buscar partner_services:', partnerServicesError);
      return;
    }

    console.log('✅ Partner services encontrados:', partnerServices?.length || 0);

    if (!partnerServices || partnerServices.length === 0) {
      console.log('ℹ️ Nenhum partner service encontrado para migrar');
      return;
    }

    // Primeiro, verificar a estrutura da tabela services
    console.log('\n🔍 Verificando estrutura da tabela services...');
    const { data: sampleService, error: sampleError } = await supabase
      .from('services')
      .select('*')
      .limit(1);

    if (sampleError && !sampleError.message.includes('relation') && !sampleError.message.includes('does not exist')) {
      console.error('❌ Erro ao verificar estrutura de services:', sampleError);
      return;
    }

    // Migrar cada partner_service para a tabela services
    console.log('\n🔄 Migrando partner_services para services...');
    
    for (const partnerService of partnerServices) {
      const serviceData = {
        id: partnerService.id, // Usar o mesmo ID para manter a relação
        description: partnerService.name,
        value: partnerService.price,
        status: 'active',
        created_at: partnerService.created_at || new Date().toISOString(),
        estimated_days: 1, // Valor padrão
        parts_needed: false // Valor padrão
      };

      console.log(`  📝 Criando service: ${serviceData.description}`);

      const { data: createdService, error: createError } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (createError) {
        // Se já existe, pular
        if (createError.code === '23505') {
          console.log(`  ⚪ Service já existe: ${serviceData.description}`);
        } else {
          console.error(`  ❌ Erro ao criar service ${serviceData.description}:`, createError);
        }
      } else {
        console.log(`  ✅ Service criado: ${createdService.id} - ${createdService.description}`);
      }
    }

    // Verificar se agora temos services
    console.log('\n✅ Verificando services após migração...');
    const { data: allServices, error: allServicesError } = await supabase
      .from('services')
      .select('id, description, value')
      .limit(10);

    if (allServicesError) {
      console.error('❌ Erro ao verificar services:', allServicesError);
    } else {
      console.log('✅ Services na tabela:', allServices?.length || 0);
      if (allServices && allServices.length > 0) {
        allServices.forEach((service, index) => {
          console.log(`  ${index + 1}. ID: ${service.id} | Descrição: ${service.description} | Valor: ${service.value}`);
        });
      }
    }

    // Teste final: tentar criar uma quote com quote_item
    console.log('\n🧪 Teste final do fluxo completo...');
    
    if (allServices && allServices.length > 0) {
      const testQuoteData = {
        service_order_id: '5145908d-fd10-4d48-ae9b-4b5ff41383c6',
        partner_id: '86e44b50-3ecd-4d24-bb69-35a83ae09f8a',
        total_value: allServices[0].value,
        status: 'pending_admin_approval',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: testQuote, error: testQuoteError } = await supabase
        .from('quotes')
        .insert(testQuoteData)
        .select()
        .single();

      if (testQuoteError) {
        console.error('❌ Erro ao criar quote de teste:', testQuoteError);
      } else {
        console.log('✅ Quote de teste criada:', testQuote.id);
        
        const testQuoteItemData = {
          quote_id: testQuote.id,
          service_id: allServices[0].id,
          quantity: 1,
          unit_price: allServices[0].value,
          total_price: allServices[0].value,
          notes: 'Teste final após migração',
          created_at: new Date().toISOString(),
        };

        const { data: testQuoteItem, error: testQuoteItemError } = await supabase
          .from('quote_items')
          .insert(testQuoteItemData)
          .select()
          .single();

        if (testQuoteItemError) {
          console.error('❌ Erro ao criar quote_item de teste:', testQuoteItemError);
        } else {
          console.log('✅ Quote item de teste criado com sucesso!');
          console.log('🎉 MIGRAÇÃO COMPLETA! O sistema agora pode salvar orçamentos.');
          
          // Limpar dados de teste
          await supabase.from('quote_items').delete().eq('id', testQuoteItem.id);
          await supabase.from('quotes').delete().eq('id', testQuote.id);
          console.log('✅ Dados de teste removidos');
        }
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔄 === FIM DA MIGRAÇÃO ===');
}

populateServicesTable();
