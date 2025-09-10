// scripts/db_scripts/get-auth-tokens.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function getAuthTokens() {
  console.log('🔐 OBTENDO TOKENS DE AUTENTICAÇÃO');
  console.log('='.repeat(50));

  const tokens = {
    client: null,
    admin: null,
  };

  try {
    // Autenticar cliente
    console.log('👤 Autenticando cliente...');
    const { data: clientData, error: clientError } = await supabase.auth.signInWithPassword({
      email: 'cliente@prolineauto.com.br',
      password: '123qwe',
    });

    if (clientError) {
      console.error('❌ Erro ao autenticar cliente:', clientError);
      throw clientError;
    }

    tokens.client = clientData.session?.access_token;
    console.log('✅ Cliente autenticado com sucesso');
    console.log(`   Token: ${tokens.client?.substring(0, 20)}...`);

    // Autenticar admin
    console.log('\n👨‍💼 Autenticando admin...');
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@prolineauto.com.br',
      password: '123qwe',
    });

    if (adminError) {
      console.error('❌ Erro ao autenticar admin:', adminError);
      throw adminError;
    }

    tokens.admin = adminData.session?.access_token;
    console.log('✅ Admin autenticado com sucesso');
    console.log(`   Token: ${tokens.admin?.substring(0, 20)}...`);

    // Exibir tokens completos
    console.log('\n🎯 TOKENS OBTIDOS COM SUCESSO:');
    console.log('='.repeat(50));
    console.log('\n📋 TOKEN DO CLIENTE:');
    console.log(tokens.client);
    console.log('\n📋 TOKEN DO ADMIN:');
    console.log(tokens.admin);

    console.log('\n💡 COPIE ESTES TOKENS PARA ATUALIZAR O SIMULADOR');

    return tokens;
  } catch (error) {
    console.error('\n💥 ERRO AO OBTER TOKENS:', error);
    process.exit(1);
  }
}

// Execução quando chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  getAuthTokens();
}

export { getAuthTokens };
