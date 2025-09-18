const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
  console.log('🔍 Verificando estrutura de autenticação...');
  
  // 1. Verificar tabela profiles
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
      
    if (profilesError) {
      console.log('❌ profiles:', profilesError.message);
    } else {
      console.log(`✅ profiles: ${profiles?.length || 0} registros`);
      if (profiles && profiles[0]) {
        console.log('   Campos:', Object.keys(profiles[0]).join(', '));
      }
    }
  } catch (e) {
    console.log('❌ profiles: tabela não existe');
  }

  // 2. Verificar partners existentes
  const { data: existingPartners } = await supabase
    .from('partners')
    .select('profile_id, company_name')
    .limit(3);
    
  console.log('👥 Partners existentes:');
  existingPartners?.forEach(p => {
    console.log(`   ${p.profile_id} - ${p.company_name}`);
  });

  // 3. Tentar criar usando um profile_id existente
  const existingProfileId = existingPartners?.[0]?.profile_id;
  
  console.log(`\n🔧 Solução alternativa: usar profile_id existente`);
  console.log(`   Profile ID disponível: ${existingProfileId}`);
  
  // 4. Criar quote usando partner existente
  if (existingProfileId) {
    console.log('\n📋 Criando quote com partner existente...');
    
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .eq('plate', 'ABC003N2')
      .single();

    if (vehicle) {
      const { data: serviceOrder } = await supabase
        .from('service_orders')
        .select('id, order_code')
        .eq('vehicle_id', vehicle.id)
        .single();

      if (serviceOrder) {
        const { data: newQuote, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            service_order_id: serviceOrder.id,
            partner_id: existingProfileId,
            total_value: 2500.00,
            status: 'pending_admin_approval'
          })
          .select()
          .single();

        if (quoteError) {
          console.log('❌ Erro ao criar quote:', quoteError.message);
        } else {
          console.log('✅ Quote criado com sucesso!');
          console.log(`   ID: ${newQuote.id}`);
          console.log(`   Partner: ${existingProfileId}`);
          console.log(`   Valor: R$ ${newQuote.total_value}`);
          console.log(`   Veículo: ${vehicle.plate} - ${vehicle.brand} ${vehicle.model}`);
          
          console.log('\n🎯 Para testar, use o token de um partner existente ou:');
          console.log(`   curl "http://localhost:3000/api/partner/budgets/${newQuote.id}"`);
        }
      }
    }
  }
}

checkAuth();
