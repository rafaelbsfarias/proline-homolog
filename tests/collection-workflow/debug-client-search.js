// Debug: teste simples para verificar busca de clientes
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar environment
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DEBUG: Testando busca de clientes');
console.log('📋 URL:', supabaseUrl);
console.log('🔑 Service Role Key:', supabaseServiceRoleKey ? 'Definida' : 'Não definida');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testClientSearch() {
  try {
    console.log('\n1️⃣ Testando busca por profiles...');

    // Teste 1: Buscar todos os profiles (sem email)
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(5);

    if (allError) {
      console.error('❌ Erro ao buscar todos profiles:', allError);
    } else {
      console.log(`✅ Total de profiles encontrados: ${allProfiles?.length || 0}`);
      allProfiles?.forEach(profile => {
        console.log(`   - ${profile.full_name} - Role: ${profile.role} - ID: ${profile.id}`);
      });
    }

    console.log('\n2️⃣ Testando busca por clientes...');

    // Teste 2: Buscar apenas clientes
    const { data: clients, error: clientError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'CLIENT')
      .limit(5);

    if (clientError) {
      console.error('❌ Erro ao buscar clientes:', clientError);
    } else {
      console.log(`✅ Clientes encontrados: ${clients?.length || 0}`);
      clients?.forEach(client => {
        console.log(`   - ${client.full_name} - ID: ${client.id}`);
      });
    }

    console.log('\n3️⃣ Testando busca com ID específico...');

    // Teste 3: Verificar ID específico
    const targetId = 'db4ef69b-8ef3-4c65-8897-c41428dd7102';
    const { data: specificClient, error: specificError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', targetId)
      .single();

    if (specificError) {
      console.error('❌ Erro ao buscar cliente específico:', specificError);
    } else {
      console.log(`✅ Cliente específico encontrado:`, specificClient);
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testClientSearch();
