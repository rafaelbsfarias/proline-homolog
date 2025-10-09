require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkVehicleHistory() {
  console.log('🔍 Verificando vehicle_history\n');
  
  // Pegar o primeiro vehicle_id da imagem
  const vehicleId = '18a37a2e-e344-4d8f-96ea-836c7ed4f133';
  
  console.log(`📋 Buscando histórico para veículo: ${vehicleId}\n`);
  
  const { data: history, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ Encontrados ${history?.length || 0} registros:\n`);
  
  history?.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.status}`);
    console.log(`     ID: ${h.id}`);
    console.log(`     Data: ${h.created_at}`);
    console.log(`     Previsão: ${h.prevision_date || 'N/A'}`);
    console.log(`     Fim: ${h.end_date || 'N/A'}`);
    console.log('');
  });
}

checkVehicleHistory();
