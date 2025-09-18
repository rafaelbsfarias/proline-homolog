/**
 * Script para implementar a solução - criar dados necessários
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function implementSolution() {
  console.log('🚀 IMPLEMENTANDO SOLUÇÃO');
  console.log('========================\n');

  const partnerId = '9408a9f6-5f63-44e0-a879-c1c6a5dd072c';

  try {
    // 1. CRIAR PARTNER AUTENTICADO
    console.log('1. Criando partner autenticado...');
    
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('profile_id')
      .eq('profile_id', partnerId)
      .single();

    if (existingPartner) {
      console.log('✅ Partner já existe');
    } else {
      const { data: newPartner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          profile_id: partnerId,
          company_name: 'Mecânica Parceiro Test',
          cnpj: '12.345.678/0001-90',
          is_active: true,
          category: 'mecanica'
        })
        .select()
        .single();

      if (partnerError) {
        console.error('❌ Erro ao criar partner:', partnerError);
        return;
      }
      console.log('✅ Partner criado:', newPartner.company_name);
    }

    // 2. USAR VEÍCULO E SERVICE ORDER EXISTENTES
    console.log('\n2. Usando dados existentes...');
    
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .eq('plate', 'ABC003N2') // Usar o veículo que sabemos que existe
      .single();

    if (!vehicle) {
      console.error('❌ Veículo ABC003N2 não encontrado');
      return;
    }
    console.log(`✅ Usando veículo: ${vehicle.plate} - ${vehicle.brand} ${vehicle.model} (${vehicle.year})`);

    const { data: serviceOrder } = await supabase
      .from('service_orders')
      .select('id, order_code')
      .eq('vehicle_id', vehicle.id)
      .single();

    if (!serviceOrder) {
      console.error('❌ Service Order não encontrado para o veículo');
      return;
    }
    console.log(`✅ Usando service order: ${serviceOrder.order_code}`);

    // 3. CRIAR QUOTE PARA O PARTNER AUTENTICADO
    console.log('\n3. Criando quote para o partner...');
    
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        service_order_id: serviceOrder.id,
        partner_id: partnerId,
        total_value: 1500.00, // Valor real ao invés de 0
        status: 'pending_admin_approval',
        supplier_delivery_date: null
      })
      .select()
      .single();

    if (quoteError) {
      console.error('❌ Erro ao criar quote:', quoteError);
      return;
    }

    console.log('✅ Quote criado com sucesso!');
    console.log(`   ID: ${quote.id}`);
    console.log(`   Valor: R$ ${quote.total_value}`);

    // 4. VERIFICAR CRIAÇÃO
    console.log('\n4. Verificando dados criados...');
    
    const { data: verification, error: verifyError } = await supabase
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
      .eq('id', quote.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError);
      return;
    }

    console.log('🎉 DADOS CRIADOS COM SUCESSO:');
    console.log('============================');
    console.log(`Quote ID: ${verification.id}`);
    console.log(`Partner ID: ${verification.partner_id}`);
    console.log(`Valor: R$ ${verification.total_value}`);
    console.log(`Status: ${verification.status}`);
    
    const vehicleData = verification.service_orders?.vehicles;
    if (vehicleData) {
      console.log(`Veículo: ${vehicleData.plate} - ${vehicleData.brand} ${vehicleData.model} (${vehicleData.year})`);
      console.log(`Cor: ${vehicleData.color}`);
    }

    console.log('\n🎯 PRÓXIMO PASSO:');
    console.log('=================');
    console.log(`Use este ID para testar: ${quote.id}`);
    console.log('Comando de teste:');
    console.log(`curl -H "Authorization: Bearer SEU_TOKEN" "http://localhost:3000/api/partner/budgets/${quote.id}"`);

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

implementSolution();
