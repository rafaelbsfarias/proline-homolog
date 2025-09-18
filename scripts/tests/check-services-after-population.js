import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkServicesAfterPopulation() {
  console.log('🔍 VERIFICANDO SERVIÇOS APÓS POPULAÇÃO...\n');

  const { data: services, error } = await supabase
    .from('partner_services')
    .select('*')
    .order('partner_id, category, name');

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log(`📊 Total de serviços no banco: ${services?.length || 0}\n`);

  if (services && services.length > 0) {
    const servicesByPartner = {};

    services.forEach(service => {
      if (!servicesByPartner[service.partner_id]) {
        servicesByPartner[service.partner_id] = [];
      }
      servicesByPartner[service.partner_id].push(service);
    });

    Object.entries(servicesByPartner).forEach(([partnerId, partnerServices]) => {
      console.log(`🏢 Parceiro ID: ${partnerId}`);

      const servicesByCategory = {};
      partnerServices.forEach(service => {
        const category = service.category || 'Sem categoria';
        if (!servicesByCategory[category]) {
          servicesByCategory[category] = [];
        }
        servicesByCategory[category].push(service);
      });

      Object.entries(servicesByCategory).forEach(([category, catServices]) => {
        console.log(`  📂 ${category}: ${catServices.length} serviços`);
        catServices.slice(0, 3).forEach(service => {
          console.log(`    • ${service.name} - R$ ${service.price || 'N/A'}`);
        });
        if (catServices.length > 3) {
          console.log(`    ... e mais ${catServices.length - 3} serviços`);
        }
      });
      console.log('');
    });
  }
}

checkServicesAfterPopulation();
