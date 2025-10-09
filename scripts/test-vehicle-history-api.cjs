#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVehicleHistoryAPI() {
  console.log('\n🔍 === TESTANDO API VEHICLE-HISTORY ===\n');

  const vehicleId = '263f0599-4407-41a4-bae0-9628bee36eef';

  // Simular o que a API faz
  const { data: history, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });

  console.log('Resultado da API:');
  console.log(`  Success: ${!error}`);
  console.log(`  Count: ${history?.length || 0}`);
  console.log(`  Error: ${error || 'null'}`);
  console.log();

  if (history && history.length > 0) {
    console.log('📋 DADOS RETORNADOS:\n');
    history.forEach((h, i) => {
      console.log(`${i + 1}. ${h.status}`);
      console.log(`   created_at: ${h.created_at}`);
    });
  }

  console.log('\n================================================================================\n');
}

testVehicleHistoryAPI().catch(console.error);
