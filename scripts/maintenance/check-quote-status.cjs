const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkQuoteStatus() {
  console.log('🔍 === VERIFICAÇÃO DOS STATUS VÁLIDOS PARA QUOTES ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Verificar quotes existentes para ver quais status são usados
    console.log('💰 Verificando quotes existentes...');
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, status, partner_id')
      .limit(10);

    if (quotesError) {
      console.error('❌ Erro ao buscar quotes:', quotesError);
    } else {
      console.log('✅ Quotes encontradas:', quotes?.length || 0);
      if (quotes && quotes.length > 0) {
        const statusValues = [...new Set(quotes.map(q => q.status))];
        console.log('📊 Status únicos encontrados:', statusValues);
        
        quotes.forEach((quote, index) => {
          console.log(`  ${index + 1}. Quote ID: ${quote.id} | Status: "${quote.status}" | Partner: ${quote.partner_id}`);
        });
      }
    }

    // Tentar criar uma quote com diferentes status para ver quais são aceitos
    const testStatuses = [
      'pending',
      'approved',
      'rejected',
      'pending_approval',
      'pending_admin_approval',
      'in_progress',
      'completed',
      'cancelled'
    ];

    console.log('\n🧪 Testando diferentes valores de status...');
    
    for (const status of testStatuses) {
      try {
        const testQuoteData = {
          service_order_id: '5145908d-fd10-4d48-ae9b-4b5ff41383c6',
          partner_id: '86e44b50-3ecd-4d24-bb69-35a83ae09f8a',
          total_value: 100.00,
          status: status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: testQuote, error: testError } = await supabase
          .from('quotes')
          .insert(testQuoteData)
          .select('id, status')
          .single();

        if (testError) {
          console.log(`  ❌ Status "${status}": ${testError.message}`);
        } else {
          console.log(`  ✅ Status "${status}": Aceito`);
          // Limpar o teste
          await supabase.from('quotes').delete().eq('id', testQuote.id);
        }
      } catch (e) {
        console.log(`  ❌ Status "${status}": ${e.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkQuoteStatus();
