const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkPartnerServices() {
  console.log('🔍 === VERIFICAÇÃO DOS SERVIÇOS DE PARCEIRO ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Verificar serviços de parceiro disponíveis
    console.log('📋 Buscando serviços de parceiro...');
    const { data: services, error: servicesError } = await supabase
      .from('partner_services')
      .select('*')
      .limit(5);

    if (servicesError) {
      console.error('❌ Erro ao buscar serviços:', servicesError);
    } else {
      console.log('✅ Serviços encontrados:', services?.length || 0);
      if (services && services.length > 0) {
        services.forEach((service, index) => {
          console.log(`  ${index + 1}. ID: ${service.id}`);
          console.log(`      Nome: ${service.name}`);
          console.log(`      Partner ID: ${service.partner_id}`);
          console.log(`      Preço: ${service.price}`);
        });
      }
    }

    // Verificar estrutura da tabela quote_items
    console.log('\n🔍 Testando insert na tabela quote_items...');
    const testData = {
      quote_id: '00000000-0000-0000-0000-000000000000', // UUID fake só para testar estrutura
      service_id: '00000000-0000-0000-0000-000000000000',
      quantity: 1,
      unit_price: 100.00,
      total_price: 100.00,
      notes: 'Teste',
      created_at: new Date().toISOString(),
    };

    // Não vamos inserir de verdade, só verificar a estrutura
    console.log('📋 Estrutura esperada para quote_items:', testData);

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkPartnerServices();
