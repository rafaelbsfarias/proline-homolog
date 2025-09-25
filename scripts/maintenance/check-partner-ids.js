/**
 * Script para verificar o partner_id do token e do quote
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPartnerIds() {
  console.log('🔍 Verificando partner_ids...');

  try {
    // Partner ID do token JWT (sub field)
    const tokenPartnerId = '9408a9f6-5f63-44e0-a879-c1c6a5dd072c';
    console.log('👤 Partner ID do token:', tokenPartnerId);

    // Verificar o quote específico
    const quoteId = '40f61fb3-0676-458c-9131-3a5b0af9887d';

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('id, partner_id, status')
      .eq('id', quoteId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar quote:', error);
      return;
    }

    console.log('📋 Quote info:');
    console.log(`  ID: ${quote.id}`);
    console.log(`  Partner ID: ${quote.partner_id}`);
    console.log(`  Status: ${quote.status}`);

    const match = quote.partner_id === tokenPartnerId;
    console.log(`🔍 Partner IDs coincidem: ${match ? '✅ SIM' : '❌ NÃO'}`);

    if (!match) {
      console.log('\n🔍 Procurando quotes do partner correto...');

      const { data: correctQuotes, error: correctError } = await supabase
        .from('quotes')
        .select('id, status, service_orders(order_code)')
        .eq('partner_id', tokenPartnerId)
        .limit(3);

      if (correctError) {
        console.error('❌ Erro ao buscar quotes corretos:', correctError);
      } else {
        console.log(`✅ Encontrados ${correctQuotes.length} quotes para este partner:`);
        correctQuotes.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.id} - ${q.status}`);
        });
      }
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkPartnerIds();
