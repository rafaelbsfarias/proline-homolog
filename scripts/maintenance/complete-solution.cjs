const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function completeSolution() {
  console.log('🔧 COMPLETANDO A SOLUÇÃO');
  console.log('========================\n');

  const userId = '9408a9f6-5f63-44e0-a879-c1c6a5dd072c';

  try {
    // 1. VERIFICAR SE PROFILE EXISTE
    console.log('1. Verificando profile...');
    
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar profile:', profileCheckError.message);
      return;
    }

    if (!existingProfile) {
      console.log('📝 Criando profile...');
      
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: 'Parceiro Mecânica',
          role: 'partner',
          status: 'active',
          must_change_password: false
        })
        .select()
        .single();

      if (profileError) {
        console.log('❌ Erro ao criar profile:', profileError.message);
        return;
      }
      console.log('✅ Profile criado:', newProfile.full_name);
    } else {
      console.log('✅ Profile já existe:', existingProfile.full_name);
    }

    // 2. VERIFICAR SE PARTNER EXISTE
    console.log('\n2. Verificando partner...');
    
    const { data: existingPartner, error: partnerCheckError } = await supabase
      .from('partners')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (partnerCheckError && partnerCheckError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar partner:', partnerCheckError.message);
      return;
    }

    if (!existingPartner) {
      console.log('🏢 Criando partner...');
      
      const { data: newPartner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          profile_id: userId,
          company_name: 'Mecânica Parceiro Teste',
          cnpj: '12.345.678/0001-90',
          is_active: true,
          category: 'mecanica'
        })
        .select()
        .single();

      if (partnerError) {
        console.log('❌ Erro ao criar partner:', partnerError.message);
        return;
      }
      console.log('✅ Partner criado:', newPartner.company_name);
    } else {
      console.log('✅ Partner já existe:', existingPartner.company_name);
    }

    // 3. CRIAR QUOTE PARA O PARTNER AUTENTICADO
    console.log('\n3. Criando quote para o partner autenticado...');
    
    // Verificar se já tem quote
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('id, total_value')
      .eq('partner_id', userId)
      .single();

    if (existingQuote) {
      console.log(`✅ Quote já existe: ${existingQuote.id} (R$ ${existingQuote.total_value})`);
    } else {
      // Usar dados existentes
      const serviceOrderId = '0d7d4e45-83a9-4474-8307-8bd500d6001b';
      
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          service_order_id: serviceOrderId,
          partner_id: userId,
          total_value: 2500.00,
          status: 'pending_admin_approval',
          supplier_delivery_date: null
        })
        .select()
        .single();

      if (quoteError) {
        console.log('❌ Erro ao criar quote:', quoteError.message);
        return;
      }
      console.log('✅ Quote criado:', newQuote.id);
      console.log(`   Valor: R$ ${newQuote.total_value}`);
    }

    // 4. VERIFICAR QUOTE FINAL PARA TESTE
    console.log('\n4. Verificando quote para teste...');
    
    const { data: finalQuote, error: finalError } = await supabase
      .from('quotes')
      .select(`
        id,
        total_value,
        status,
        partner_id,
        service_orders (
          id,
          order_code,
          vehicles (
            plate,
            brand,
            model,
            year,
            color
          )
        )
      `)
      .eq('partner_id', userId)
      .single();

    if (finalError) {
      console.log('❌ Erro ao verificar quote final:', finalError.message);
      return;
    }

    console.log('\n🎉 SOLUÇÃO COMPLETA!');
    console.log('====================');
    console.log(`✅ Profile criado/verificado: ${userId}`);
    console.log(`✅ Partner criado/verificado para o usuário`);
    console.log(`✅ Quote disponível: ${finalQuote.id}`);
    console.log(`✅ Valor: R$ ${finalQuote.total_value}`);
    
    const vehicle = finalQuote.service_orders?.vehicles;
    if (vehicle) {
      console.log(`✅ Veículo: ${vehicle.plate} - ${vehicle.brand} ${vehicle.model} (${vehicle.year})`);
    }

    console.log('\n🧪 COMANDO DE TESTE:');
    console.log('====================');
    console.log(`curl -H "Authorization: Bearer SEU_TOKEN" \\`);
    console.log(`  "http://localhost:3000/api/partner/budgets/${finalQuote.id}" | jq .`);

    console.log('\n📋 RESULTADO ESPERADO:');
    console.log('======================');
    console.log(`- ID: ${finalQuote.id}`);
    console.log(`- Veículo: ${vehicle?.plate} - ${vehicle?.brand} ${vehicle?.model} - ${vehicle?.year}`);
    console.log(`- Valor: R$ ${finalQuote.total_value}`);
    console.log(`- Status: ${finalQuote.status}`);

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

completeSolution();
