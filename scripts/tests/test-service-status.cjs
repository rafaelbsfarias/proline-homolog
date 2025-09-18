const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testServiceStatus() {
  console.log('🔍 === TESTE DOS STATUS DE SERVICE ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Criar quote de teste
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
      console.error('❌ Erro ao criar quote:', testQuoteError);
      return;
    }

    console.log('✅ Quote criada:', testQuote.id);

    const { data: partnerService } = await supabase
      .from('partner_services')
      .select('*')
      .limit(1)
      .single();

    // Testar diferentes valores de status
    const statusOptions = [
      'pending',
      'approved', 
      'completed',
      'cancelled',
      'in_progress',
      'requested',
      'available'
    ];

    for (const status of statusOptions) {
      const serviceData = {
        id: crypto.randomUUID(),
        quote_id: testQuote.id,
        description: partnerService.name,
        value: partnerService.price,
        status: status,
        estimated_days: 1,
        parts_needed: false
      };

      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (serviceError) {
        console.log(`❌ Status "${status}": ${serviceError.message}`);
      } else {
        console.log(`✅ Status "${status}": Funcionou!`);
        
        // Testar quote_item
        const quoteItemData = {
          quote_id: testQuote.id,
          service_id: service.id,
          quantity: 1,
          unit_price: partnerService.price,
          total_price: partnerService.price,
          notes: 'Teste final',
          created_at: new Date().toISOString(),
        };

        const { data: quoteItem, error: quoteItemError } = await supabase
          .from('quote_items')
          .insert(quoteItemData)
          .select()
          .single();

        if (quoteItemError) {
          console.log(`  ❌ Quote item com status "${status}": ${quoteItemError.message}`);
        } else {
          console.log(`  ✅ Quote item criado com status "${status}"!`);
          console.log('🎉 FLUXO COMPLETO FUNCIONANDO!');
          
          // Limpar
          await supabase.from('quote_items').delete().eq('id', quoteItem.id);
          await supabase.from('services').delete().eq('id', service.id);
          
          console.log('\n🔧 SOLUÇÃO FINAL PARA A PÁGINA:');
          console.log('1. Para cada serviço selecionado pelo partner:');
          console.log('   a) Criar um registro em "services" com quote_id');
          console.log(`   b) Usar status "${status}"`);
          console.log('   c) Criar quote_item referenciando o service criado');
          
          break;
        }
        
        // Limpar service se quote_item falhou
        await supabase.from('services').delete().eq('id', service.id);
      }
    }

    // Limpar quote
    await supabase.from('quotes').delete().eq('id', testQuote.id);

  } catch (error) {
    console.error('💥 Erro:', error);
  }

  console.log('🔍 === FIM DO TESTE ===');
}

testServiceStatus();
