import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Config check:');
console.log('  URL:', supabaseUrl ? '✓' : '✗');
console.log('  Key:', supabaseServiceKey ? '✓' : '✗');
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinancialSummaryRPC() {
  console.log('🔍 Testando RPC get_partner_financial_summary...\n');

  const partnerId = '23dc9b3d-11a0-4cf2-8862-54c6b7fc567e';
  const startDate = '2025-08-01';
  const endDate = '2025-10-31';

  console.log('📋 Parâmetros:');
  console.log('  Partner ID:', partnerId);
  console.log('  Start Date:', startDate);
  console.log('  End Date:', endDate);
  console.log('');

  const { data, error } = await supabase.rpc('get_partner_financial_summary', {
    p_partner_id: partnerId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('❌ Erro na RPC:', error);
    return;
  }

  console.log('✅ Resposta da RPC:');
  console.log('');
  console.log('📊 Tipo de dado retornado:', typeof data);
  console.log('');
  console.log('📄 Estrutura completa (JSON):');
  console.log(JSON.stringify(data, null, 2));
  console.log('');

  // Tentar acessar propriedades
  console.log('🔍 Tentando acessar propriedades:');
  console.log('  data.period:', data.period);
  console.log('  data.metrics:', data.metrics);
  console.log('  data.metrics?.total_revenue:', data.metrics?.total_revenue);
  console.log('');

  // Verificar se é string que precisa de parse
  if (typeof data === 'string') {
    console.log('⚠️  Data é string, fazendo parse...');
    const parsed = JSON.parse(data);
    console.log('Parsed data:', JSON.stringify(parsed, null, 2));
  }
}

testFinancialSummaryRPC().catch(console.error);
