// db_scripts/create_specialist_user.js

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createSpecialistUser() {
  const randomId = Math.floor(Math.random() * 100000);
  const email = `especialista@prolineauto.com.br`;
  const password = '123qwe';
  const fullName = `Especialista Teste ${randomId}`;
  const role = 'specialist';

  try {
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

    // 3. Criar entrada na tabela public.specialists
    const { error: specialistError } = await supabase.from('specialists').upsert(
      {
        profile_id: userId,
      },
      { onConflict: 'profile_id' }
    );

    if (specialistError) {
      throw specialistError;
    }
  } catch (error) {
    process.exit(1);
  }
}

createSpecialistUser();
