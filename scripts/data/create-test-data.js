/**
 * Script para criar dados de teste para o partner autenticado
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🚀 Criando dados de teste...');

  try {
    const partnerId = '9408a9f6-5f63-44e0-a879-c1c6a5dd072c'; // Partner do token

    // 1. Primeiro, criar um veículo de teste
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        plate: 'ABC111A3',
        brand: 'Honda',
        model: 'Golf',
        year: 2012,
        color: 'Branco',
        client_id: '00000000-0000-0000-0000-000000000001', // ID fictício
      })
      .select()
      .single();

    if (vehicleError) {
      console.error('❌ Erro ao criar veículo:', vehicleError);
      return;
    }

    console.log('✅ Veículo criado:', vehicle.id);

    // 2. Criar um service order
    const { data: serviceOrder, error: soError } = await supabase
      .from('service_orders')
      .insert({
        vehicle_id: vehicle.id,
        status: 'pending',
        classification: 'maintenance',
        order_code: 'SO-TEST-001',
        client_id: '00000000-0000-0000-0000-000000000001',
      })
      .select()
      .single();

    if (soError) {
      console.error('❌ Erro ao criar service order:', soError);
      return;
    }

    console.log('✅ Service Order criado:', serviceOrder.id);

    // 3. Criar um quote para o partner
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        service_order_id: serviceOrder.id,
        partner_id: partnerId,
        total_value: 1500.0,
        status: 'pending_admin_approval',
      })
      .select()
      .single();

    if (quoteError) {
      console.error('❌ Erro ao criar quote:', quoteError);
      return;
    }

    console.log('✅ Quote criado:', quote.id);
    console.log('🎯 Novo ID para teste:', quote.id);

    // Verificar se foi criado corretamente
    const { data: verification, error: verifyError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        partner_id,
        total_value,
        status,
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
      `
      )
      .eq('id', quote.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError);
    } else {
      console.log('✅ Verificação bem-sucedida:');
      console.log(JSON.stringify(verification, null, 2));
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

createTestData();
