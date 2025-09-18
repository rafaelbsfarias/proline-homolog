const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function analyzeServicesTable() {
  console.log('🔍 === ANÁLISE COMPLETA DA TABELA SERVICES ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // A mensagem de erro revelou que a tabela services tem quote_id obrigatório
    // Isso sugere que services não é uma tabela de "catálogo" mas sim de "serviços de quote"
    // Vamos verificar se quote_items já pode usar partner_services diretamente

    console.log('🔍 Analisando estrutura do quote_items...');
    
    // Primeiro, criar uma quote de teste
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
      console.error('❌ Erro ao criar quote de teste:', testQuoteError);
      return;
    }

    console.log('✅ Quote de teste criada:', testQuote.id);

    // Agora vamos tentar inserir na tabela services usando a quote_id
    console.log('\n🧪 Testando inserção em services com quote_id...');
    
    const { data: partnerService, error: psError } = await supabase
      .from('partner_services')
      .select('*')
      .limit(1)
      .single();

    if (psError) {
      console.error('❌ Erro ao buscar partner_service:', psError);
      return;
    }

    const serviceData = {
      id: crypto.randomUUID(), // Novo ID para service
      quote_id: testQuote.id,   // Quote obrigatória
      description: partnerService.name,
      value: partnerService.price,
      status: 'active',
      estimated_days: 1,
      parts_needed: false
    };

    console.log('📋 Tentando inserir service:', serviceData);

    const { data: createdService, error: serviceError } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    if (serviceError) {
      console.error('❌ Erro ao criar service:', serviceError);
    } else {
      console.log('✅ Service criado:', createdService);
      
      // Agora tentar criar quote_item usando este service_id
      console.log('\n🧪 Testando quote_item com service criado...');
      
      const quoteItemData = {
        quote_id: testQuote.id,
        service_id: createdService.id,
        quantity: 1,
        unit_price: partnerService.price,
        total_price: partnerService.price,
        notes: 'Teste com service válido',
        created_at: new Date().toISOString(),
      };

      const { data: quoteItem, error: quoteItemError } = await supabase
        .from('quote_items')
        .insert(quoteItemData)
        .select()
        .single();

      if (quoteItemError) {
        console.error('❌ Erro ao criar quote_item:', quoteItemError);
      } else {
        console.log('✅ Quote item criado com sucesso!');
        console.log('🎉 SOLUÇÃO ENCONTRADA: A tabela services é específica por quote!');
        console.log('💡 O fluxo correto é:');
        console.log('   1. Criar quote');
        console.log('   2. Para cada partner_service selecionado, criar um service na tabela services');
        console.log('   3. Criar quote_item referenciando o service criado');
        
        // Limpar dados de teste
        await supabase.from('quote_items').delete().eq('id', quoteItem.id);
        await supabase.from('services').delete().eq('id', createdService.id);
        console.log('✅ Dados de teste removidos');
      }
    }

    // Limpar quote de teste
    await supabase.from('quotes').delete().eq('id', testQuote.id);
    console.log('✅ Quote de teste removida');

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA ANÁLISE ===');
}

analyzeServicesTable();
