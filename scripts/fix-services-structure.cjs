const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function fixServicesTableStructure() {
  console.log('🔧 === CORRIGINDO ESTRUTURA DA TABELA SERVICES ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Buscar alguns partner_services para teste
    const { data: partnerServices, error: partnerServicesError } = await supabase
      .from('partner_services')
      .select('*')
      .limit(3);

    if (partnerServicesError) {
      console.error('❌ Erro ao buscar partner_services:', partnerServicesError);
      return;
    }

    console.log('✅ Partner services para teste:', partnerServices?.length || 0);

    if (!partnerServices || partnerServices.length === 0) {
      console.log('ℹ️ Nenhum partner service para teste');
      return;
    }

    // Tentar descobrir a estrutura correta da tabela services
    console.log('\n🔍 Testando estrutura mínima da tabela services...');
    
    const testService = partnerServices[0];
    
    // Testar com estrutura mínima
    const minimalServiceData = {
      id: testService.id,
      description: testService.name,
      value: testService.price
    };

    console.log('📋 Testando com dados mínimos:', minimalServiceData);

    const { data: createdService, error: createError } = await supabase
      .from('services')
      .insert(minimalServiceData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro com estrutura mínima:', createError);
      
      // Tentar outras variações
      const variations = [
        { id: testService.id, name: testService.name, price: testService.price },
        { id: testService.id, service_name: testService.name, service_price: testService.price },
        { id: testService.id, title: testService.name, cost: testService.price },
        { service_id: testService.id, description: testService.name, value: testService.price }
      ];

      for (const variation of variations) {
        console.log(`🧪 Testando variação:`, Object.keys(variation));
        
        const { data: varResult, error: varError } = await supabase
          .from('services')
          .insert(variation)
          .select()
          .single();

        if (varError) {
          console.log(`  ❌ ${varError.message}`);
        } else {
          console.log(`  ✅ Funcionou!`, varResult);
          // Limpar teste
          await supabase.from('services').delete().eq('id', varResult.id);
          break;
        }
      }
    } else {
      console.log('✅ Estrutura mínima funcionou:', createdService);
      
      // Agora popular todos os services
      console.log('\n🔄 Populando todos os services...');
      
      for (const partnerService of partnerServices) {
        const serviceData = {
          id: partnerService.id,
          description: partnerService.name,
          value: partnerService.price
        };

        const { data: newService, error: newError } = await supabase
          .from('services')
          .insert(serviceData)
          .select()
          .single();

        if (newError) {
          if (newError.code === '23505') {
            console.log(`  ⚪ Service já existe: ${serviceData.description}`);
          } else {
            console.error(`  ❌ Erro: ${serviceData.description}:`, newError.message);
          }
        } else {
          console.log(`  ✅ Criado: ${newService.description}`);
        }
      }

      // Buscar todos os partner_services restantes e popular
      console.log('\n🔄 Populando todos os partner_services restantes...');
      
      const { data: allPartnerServices, error: allError } = await supabase
        .from('partner_services')
        .select('*');

      if (allError) {
        console.error('❌ Erro ao buscar todos os partner_services:', allError);
      } else {
        console.log('📋 Total de partner_services:', allPartnerServices?.length || 0);
        
        for (const ps of allPartnerServices) {
          const serviceData = {
            id: ps.id,
            description: ps.name,
            value: ps.price
          };

          const { error: insertError } = await supabase
            .from('services')
            .insert(serviceData);

          if (insertError && insertError.code !== '23505') {
            console.log(`  ❌ ${ps.name}: ${insertError.message}`);
          } else if (!insertError) {
            console.log(`  ✅ ${ps.name}`);
          }
        }
      }

      // Verificar resultado final
      console.log('\n✅ Verificando resultado final...');
      const { data: finalServices, error: finalError } = await supabase
        .from('services')
        .select('id, description, value')
        .limit(10);

      if (finalError) {
        console.error('❌ Erro ao verificar resultado:', finalError);
      } else {
        console.log('🎉 Services criados:', finalServices?.length || 0);
        if (finalServices && finalServices.length > 0) {
          finalServices.forEach((service, index) => {
            console.log(`  ${index + 1}. ${service.description} - R$ ${service.value}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔧 === FIM DA CORREÇÃO ===');
}

fixServicesTableStructure();
