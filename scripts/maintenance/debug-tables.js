/**
 * Script para verificar tabelas do banco
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Verificando tabelas do banco...');

  try {
    // Tentar algumas tabelas que podem existir
    const tablesToCheck = [
      'quotes',
      'budgets',
      'quotes',
      'partner_quotes',
      'service_requests',
      'service_orders',
      'vehicles',
      'partners',
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: existe (${data?.length || 0} registros testados)`);
          if (data && data.length > 0) {
            console.log(`   Campos: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (e) {
        console.log(`💥 ${tableName}: erro ao testar`);
      }
    }

    // Verificar especificamente o orçamento que estamos procurando
    console.log('\n🎯 Tentando encontrar o orçamento f5bb300a-a2c2-4c1c-bcba-b47e4b7d7b77...');

    const possibleTables = ['quotes', 'partner_quotes', 'service_requests'];
    for (const table of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', 'f5bb300a-a2c2-4c1c-bcba-b47e4b7d7b77');

        if (!error && data && data.length > 0) {
          console.log(`🎉 Encontrado em ${table}:`, data[0]);
        }
      } catch (e) {
        // Continuar tentando
      }
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkTables();
