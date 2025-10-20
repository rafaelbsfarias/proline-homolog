#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do .env.local na raiz do projeto
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestClient() {
  console.log('🧪 Criando usuário cliente de teste para verificar must_change_password...\n');

  try {
    const email = 'cliente_test_must_change@prolineauto.com.br';
    const password = 'TempPass123!';
    const fullName = 'Cliente Teste Must Change';

    // 1. Criar usuário no Supabase Auth
    console.log('📧 Criando usuário no Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'client',
        created_by_admin: true,
      },
    });

    if (authError || !authUser.user) {
      console.error('❌ Erro ao criar usuário no Auth:', authError?.message);
      return;
    }

    const userId = authUser.user.id;
    console.log('✅ Usuário Auth criado com ID:', userId);

    // 2. Criar perfil
    console.log('👤 Criando perfil...');
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
      role: 'client',
      status: 'ativo',
      must_change_password: true, // Esta é a mudança que queremos testar
    });

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      return;
    }

    console.log('✅ Perfil criado com must_change_password: true');

    // 3. Criar registro na tabela clients
    console.log('🏢 Criando registro de cliente...');
    const { error: clientError } = await supabase.from('clients').insert({
      profile_id: userId,
      document_type: 'CPF',
      document_number: '12345678901',
    });

    if (clientError) {
      console.error('❌ Erro ao criar cliente:', clientError.message);
      return;
    }

    console.log('✅ Cliente criado');

    // 4. Verificar se tudo foi criado corretamente
    console.log('\n🔍 Verificando dados criados...');

    const { data: profile, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name, role, must_change_password, created_at')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('❌ Erro ao verificar perfil:', checkError.message);
    } else {
      console.log('📋 Dados do perfil criado:');
      console.log('   ID:', profile.id);
      console.log('   Nome:', profile.full_name);
      console.log('   Role:', profile.role);
      console.log('   Must Change Password:', profile.must_change_password);
      console.log('   Criado em:', new Date(profile.created_at).toLocaleString('pt-BR'));

      if (profile.must_change_password) {
        console.log('\n🎉 SUCESSO: must_change_password está definido como true!');
        console.log('📧 Email para teste:', email);
        console.log('🔑 Senha temporária:', password);
        console.log('\n💡 Agora você pode testar o login e verificar se o modal de mudança de senha aparece.');
      } else {
        console.log('\n❌ FALHA: must_change_password não está definido como true!');
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

createTestClient();