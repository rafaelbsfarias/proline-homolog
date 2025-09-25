import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateServicesTables() {
  console.log('🔍 INVESTIGAÇÃO COMPLETA DAS TABELAS DE SERVIÇOS\n');

  try {
    // 1. Verificar tabela services
    console.log('📋 TABELA: services');
    console.log(
      '   Estrutura: id, quote_id, description, value, status, estimated_days, parts_needed'
    );
    console.log('   Relacionamento: Depende de quotes (quote_id)');

    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(10);

    if (servicesError) {
      console.log('   ❌ Erro:', servicesError.message);
    } else {
      console.log(`   📊 Registros: ${servicesData?.length || 0}`);
      if (servicesData && servicesData.length > 0) {
        console.log('   🏆 Amostra:');
        servicesData.forEach((service, index) => {
          console.log(
            `      ${index + 1}. "${service.description}" - R$ ${service.value || 'N/A'} (${service.status})`
          );
        });
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar tabela partner_services
    console.log('📋 TABELA: partner_services');
    console.log(
      '   Estrutura: id, partner_id, name, description, value, category, created_at, updated_at'
    );
    console.log('   Relacionamento: Direto com partners (partner_id)');

    const { data: partnerServicesData, error: partnerServicesError } = await supabase
      .from('partner_services')
      .select('*')
      .limit(10);

    if (partnerServicesError) {
      console.log('   ❌ Erro:', partnerServicesError.message);
    } else {
      console.log(`   📊 Registros: ${partnerServicesData?.length || 0}`);
      if (partnerServicesData && partnerServicesData.length > 0) {
        console.log('   🏆 Amostra:');
        partnerServicesData.forEach((service, index) => {
          console.log(
            `      ${index + 1}. "${service.name || service.description}" - R$ ${service.value || 'N/A'} (${service.category || 'Sem categoria'})`
          );
        });
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar tabela quotes (para entender dependência)
    console.log('📋 TABELA: quotes (dependência da tabela services)');
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('id, partner_id, service_order_id, created_at')
      .limit(5);

    if (quotesError) {
      console.log('   ❌ Erro:', quotesError.message);
    } else {
      console.log(`   📊 Registros: ${quotesData?.length || 0}`);
      if (quotesData && quotesData.length > 0) {
        console.log('   🏆 Amostra:');
        quotesData.forEach((quote, index) => {
          console.log(`      ${index + 1}. Quote ID: ${quote.id} - Partner: ${quote.partner_id}`);
        });
      } else {
        console.log('   ⚠️  Nenhuma quote encontrada - isso explica por que services está vazia!');
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Comparação final
    console.log('🎯 ANÁLISE COMPARATIVA:');
    console.log('   • services: Serviços específicos de cotações (quotes)');
    console.log('   • partner_services: Catálogo de serviços oferecidos pelos partners');
    console.log(
      '   • Diferença: services depende de quotes existentes, partner_services é catálogo independente'
    );

    const servicesCount = servicesData?.length || 0;
    const partnerServicesCount = partnerServicesData?.length || 0;
    const quotesCount = quotesData?.length || 0;

    console.log(`\n📈 CONTAGEM:`);
    console.log(`   • Services: ${servicesCount}`);
    console.log(`   • Partner Services: ${partnerServicesCount}`);
    console.log(`   • Quotes: ${quotesCount}`);

    if (servicesCount === 0 && quotesCount === 0) {
      console.log(
        '\n🔍 DIAGNÓSTICO: A tabela services está vazia porque não há quotes no sistema.'
      );
      console.log('   Isso é NORMAL - services são criados quando há cotações.');
    }

    if (partnerServicesCount > 0 && servicesCount === 0) {
      console.log(
        '\n✅ STATUS: partner_services tem dados, mas services está vazio (comportamento esperado).'
      );
    }
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

investigateServicesTables();
