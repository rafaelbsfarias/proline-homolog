import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyServices() {
  console.log('📊 Verificação final dos serviços criados...\n');

  // Buscar serviços com informações dos parceiros
  const { data: services, error } = await supabase
    .from('partner_services')
    .select('name, description, price, category, partners!inner(company_name)')
    .order('partners(company_name), category, name');

  if (error) {
    console.error('Erro ao buscar serviços:', error);
    return;
  }

  if (services && services.length > 0) {
    console.log('🏆 RESUMO COMPLETO DOS SERVIÇOS POR PARCEIRO:\n');

    const servicesByPartner = {};
    services.forEach(service => {
      const partnerName = service.partners.company_name;
      if (!servicesByPartner[partnerName]) {
        servicesByPartner[partnerName] = {};
      }
      if (!servicesByPartner[partnerName][service.category]) {
        servicesByPartner[partnerName][service.category] = [];
      }
      servicesByPartner[partnerName][service.category].push(service);
    });

    Object.entries(servicesByPartner).forEach(([partnerName, categories]) => {
      console.log(`🏢 ${partnerName}:`);

      Object.entries(categories).forEach(([categoryName, categoryServices]) => {
        console.log(`  📂 ${categoryName}:`);
        categoryServices.forEach(service => {
          console.log(`    • ${service.name} - R$ ${service.price}`);
        });
      });
      console.log('');
    });

    // Estatísticas finais
    const totalPartners = Object.keys(servicesByPartner).length;
    const totalServices = services.length;
    const categoriesCount = Object.values(servicesByPartner).reduce(
      (acc, cat) => acc + Object.keys(cat).length,
      0
    );

    console.log('📈 ESTATÍSTICAS FINAIS:');
    console.log(`   • Parceiros com serviços: ${totalPartners}`);
    console.log(`   • Total de serviços: ${totalServices}`);
    console.log(`   • Categorias distintas: ${categoriesCount}`);
    console.log(
      `   • Média de serviços por parceiro: ${Math.round(totalServices / totalPartners)}`
    );
  } else {
    console.log('Nenhum serviço encontrado.');
  }
}

verifyServices().catch(console.error);
