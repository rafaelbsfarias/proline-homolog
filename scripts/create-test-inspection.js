import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestInspection() {
  try {
    console.log('🔄 Criando nova inspeção para teste...');

    // Buscar um veículo existente
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, client_id')
      .limit(1)
      .single();

    if (!vehicle) {
      console.log('❌ Nenhum veículo encontrado');
      return;
    }

    // Buscar um especialista
    const { data: specialist } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'specialist')
      .limit(1)
      .single();

    if (!specialist) {
      console.log('❌ Nenhum especialista encontrado');
      return;
    }

    // Criar nova inspeção
    const { data: inspection, error: inspError } = await supabase
      .from('inspections')
      .insert({
        vehicle_id: vehicle.id,
        specialist_id: specialist.id,
        inspection_date: new Date().toISOString().split('T')[0], // Apenas a data
        odometer: 100000, // Valor padrão
        fuel_level: 'half', // Valor padrão
        finalized: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (inspError || !inspection) {
      console.log('❌ Erro ao criar inspeção:', inspError);
      return;
    }

    console.log('✅ Inspeção criada:', inspection.id);

    // Adicionar serviço obrigatório
    const { error: serviceError } = await supabase.from('inspection_services').insert({
      inspection_id: inspection.id,
      category: 'mechanics',
      required: true,
    });

    if (serviceError) {
      console.log('❌ Erro ao adicionar serviço:', serviceError);
    } else {
      console.log('✅ Serviço obrigatório adicionado');
    }

    console.log('🎯 Agora você pode testar a finalização da inspeção');
    console.log('   Vehicle ID:', vehicle.id);
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

createTestInspection();
