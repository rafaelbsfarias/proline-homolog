const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkServicesTables() {
  console.log('🔍 === VERIFICAÇÃO DAS TABELAS DE SERVIÇOS ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Verificar tabela services
    console.log('🔧 Verificando tabela services...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(5);

    if (servicesError) {
      console.error('❌ Erro ao buscar services:', servicesError);
    } else {
      console.log('✅ Services encontrados:', services?.length || 0);
      if (services && services.length > 0) {
        services.forEach((service, index) => {
          console.log(`  ${index + 1}. Service ID: ${service.id} | Nome: ${service.description || service.name || 'N/A'}`);
        });
      }
    }

    // Verificar tabela partner_services
    console.log('\n👥 Verificando tabela partner_services...');
    const { data: partnerServices, error: partnerServicesError } = await supabase
      .from('partner_services')
      .select('*')
      .limit(5);

    if (partnerServicesError) {
      console.error('❌ Erro ao buscar partner_services:', partnerServicesError);
    } else {
      console.log('✅ Partner Services encontrados:', partnerServices?.length || 0);
      if (partnerServices && partnerServices.length > 0) {
        partnerServices.forEach((service, index) => {
          console.log(`  ${index + 1}. Partner Service ID: ${service.id} | Nome: ${service.name} | Price: ${service.price}`);
        });
      }
    }

    // Verificar se há alguma relação entre as tabelas
    console.log('\n🔗 Verificando possível relação entre as tabelas...');
    
    // Verificar se partner_services tem uma coluna service_id
    if (partnerServices && partnerServices.length > 0) {
      const firstPartnerService = partnerServices[0];
      console.log('📋 Colunas em partner_services:', Object.keys(firstPartnerService));
      
      // Se houver um service_id, verificar se existe na tabela services
      if (firstPartnerService.service_id) {
        console.log('🔍 Verificando service_id na tabela services...');
        const { data: relatedService, error: relatedError } = await supabase
          .from('services')
          .select('*')
          .eq('id', firstPartnerService.service_id)
          .single();

        if (relatedError) {
          console.error('❌ Service relacionado não encontrado:', relatedError);
        } else {
          console.log('✅ Service relacionado encontrado:', relatedService);
        }
      }
    }

    // Verificar uma abordagem alternativa: usar o service_id do partner_service
    console.log('\n🧪 Testando abordagem alternativa...');
    
    if (partnerServices && partnerServices.length > 0) {
      const testPartnerService = partnerServices[0];
      
      // Verificar se existe um service_id válido
      if (testPartnerService.service_id && services && services.length > 0) {
        console.log('✅ Usando service_id do partner_service para quote_item');
        
        // Criar uma quote de teste primeiro
        const testQuoteData = {
          service_order_id: '5145908d-fd10-4d48-ae9b-4b5ff41383c6',
          partner_id: '86e44b50-3ecd-4d24-bb69-35a83ae09f8a',
          total_value: 100.00,
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
          
          // Tentar criar quote_item usando service_id válido
          const testQuoteItemData = {
            quote_id: testQuote.id,
            service_id: services[0].id, // Usar um service_id válido da tabela services
            quantity: 1,
            unit_price: testPartnerService.price,
            total_price: testPartnerService.price,
            notes: 'Teste com service_id válido',
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
            console.log('✅ Quote item de teste criado:', testQuoteItem.id);
            
            // Limpar dados de teste
            await supabase.from('quote_items').delete().eq('id', testQuoteItem.id);
            console.log('✅ Quote item de teste removido');
          }
          
          // Limpar quote de teste
          await supabase.from('quotes').delete().eq('id', testQuote.id);
          console.log('✅ Quote de teste removida');
        }
      } else {
        console.log('ℹ️ Não foi possível testar com service_id válido');
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkServicesTables();
