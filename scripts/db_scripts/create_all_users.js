// db_scripts/create_all_users.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do .env.local na raiz do projeto
const envPath = path.resolve(__dirname, '../../.env.remoto');
dotenv.config({ path: envPath, debug: true });

console.log(`
--- Debug de Variáveis de Ambiente ---`);
console.log(`Caminho do .env.local sendo carregado: ${envPath}`);
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`NEXT_SUPABASE_SERVICE_ROLE_KEY: ${process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`--- Fim do Debug ---`);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// --- Funções de criação de usuário (adaptadas dos scripts existentes) ---

async function createUser(email, password, fullName, role, additionalData = {}) {
  try {
    console.log(`
--- Criando usuário ${role}: ${email} ---`);

    // 1. Criar usuário no Supabase Auth
    const authUserResult = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        full_name: fullName,
        role: role,
        email_verified: true, // Adiciona email_verified
      },
    });

    let authUser = authUserResult.data;
    const authError = authUserResult.error;

    if (authError) {
      if (authError.message.includes('User already exists')) {
        console.warn(`Usuário ${email} já existe no Auth. Pulando criação no Auth.`);
        // Tenta buscar o usuário existente para continuar com profile/admin
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === email);
        if (existingUser) {
          authUser = { user: existingUser };
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

    // 3. Criar entrada na tabela específica da role
    let specificTableError = null;
    switch (role) {
      case 'admin':
        const { error: adminError } = await supabase
          .from('admins')
          .upsert({ profile_id: userId }, { onConflict: 'profile_id' });
        specificTableError = adminError;
        break;
      case 'client':
        const { error: clientError } = await supabase
          .from('clients')
          .upsert({ profile_id: userId, ...additionalData }, { onConflict: 'profile_id' });
        specificTableError = clientError;
        break;
      case 'partner':
        const { error: partnerError } = await supabase
          .from('partners')
          .upsert({ profile_id: userId, ...additionalData }, { onConflict: 'profile_id' });
        specificTableError = partnerError;
        break;
      case 'specialist':
        const { error: specialistError } = await supabase
          .from('specialists')
          .upsert({ profile_id: userId }, { onConflict: 'profile_id' });
        specificTableError = specialistError;
        break;
      default:
        console.warn(`Role desconhecida: ${role}. Nenhuma tabela específica para esta role.`);
    }

    if (specificTableError) {
      throw specificTableError;
    }
    console.log(`Entrada em public.${role}s criada/atualizada para ID: ${userId}`);

    console.log(`
--- Usuário ${role} ${email} criado/atualizado com sucesso! ---`);
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
  } catch (error) {
    console.error(`
--- Erro ao criar usuário ${email}: ---`);
    console.error(error);
    process.exit(1);
  }
}

// --- Execução principal ---
async function main() {
  // Admin User
  await createUser('admin@prolineauto.com.br', '123qwe', 'Administrador Principal', 'admin');

  // Client User
  const randomClientId = Math.floor(Math.random() * 100000);
  await createUser(
    `cliente@prolineauto.com.br`,
    '123qwe',
    `Cliente Teste ${randomClientId}`,
    'client',
    {
      document_type: 'CPF',
      document_number: `111.111.111-${String(randomClientId).padStart(2, '0')}`,
      company_name: `Empresa Cliente ${randomClientId}`,
    }
  );

  // Partner User
  const randomPartnerId = Math.floor(Math.random() * 100000);
  await createUser(
    `parceiro@prolineauto.com.br`,
    '123qwe',
    `Parceiro Teste ${randomPartnerId}`,
    'partner',
    {
      cnpj: `00.000.000/0001-${String(randomPartnerId).padStart(2, '0')}`,
      company_name: `Oficina Parceira ${randomPartnerId}`,
      is_active: true,
      category: 'Oficina Mecânica',
    }
  );

  // Specialist User
  const randomSpecialistId = Math.floor(Math.random() * 100000);
  await createUser(
    `especialista@prolineauto.com.br`,
    '123qwe',
    `Especialista Teste ${randomSpecialistId}`,
    'specialist'
  );

  console.log(`
--- Todos os usuários de teste foram processados. ---`);
}

main();
