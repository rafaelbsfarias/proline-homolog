// db_scripts/create_client_user.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do .env.local na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createClientUser() {
  const randomId = Math.floor(Math.random() * 100000);
  const email = `cliente@prolineauto.com.br`;
  const password = '123qwe';
  const fullName = `Cliente Teste ${randomId}`;
  const role = 'client';
  const documentType = 'CPF';
  const documentNumber = `111.111.111-${String(randomId).padStart(2, '0')}`;
  const companyName = `Empresa Cliente ${randomId}`;

  try {
    console.log(`
--- Criando usuário ${role}: ${email} ---`);

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        email_verified: true,
      },
    });

    if (authError) {
      if (authError.message.includes('User already exists')) {
        console.warn(`Usuário ${email} já existe no Auth. Pulando criação no Auth.`);
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === email);
        if (existingUser) {
          authUser.user = existingUser;
        } else {
          throw new Error('Usuário já existe, mas não foi possível recuperá-lo.');
        }
      } else {
        throw authError;
      }
    }

    const userId = authUser?.user?.id;

    if (!userId) {
      throw new Error('ID do usuário não obtido após criação/recuperação.');
    }

    console.log(`Usuário Auth criado/recuperado com ID: ${userId}`);

    // 2. Criar/Atualizar perfil na tabela public.profiles
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        role: role,
        status: 'ativo',
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      throw profileError;
    }
    console.log(`Perfil em public.profiles criado/atualizado para ID: ${userId}`);

    // 3. Criar entrada na tabela public.clients
    const { error: clientError } = await supabase.from('clients').upsert(
      {
        profile_id: userId,
        document_type: documentType,
        document_number: documentNumber,
        company_name: companyName,
      },
      { onConflict: 'profile_id' }
    );

    if (clientError) {
      throw clientError;
    }
    console.log(`Entrada em public.clients criada/atualizada para ID: ${userId}`);

    console.log(`
--- Usuário cliente ${email} criado/atualizado com sucesso! ---`);
    console.log(`Email: ${email}`);
  } catch (error) {
    process.exit(1);
  }
}

createClientUser();
