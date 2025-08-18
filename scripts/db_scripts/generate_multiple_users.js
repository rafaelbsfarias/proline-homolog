// db_scripts/generate_multiple_users.js

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

const ROLES_TO_GENERATE = ['admin', 'client', 'partner', 'specialist'];
const NUM_USERS_PER_ROLE = 10;
const BASE_PASSWORD = '123qwe';

async function generateUsers() {
  for (const role of ROLES_TO_GENERATE) {
    console.log(`
--- Gerando ${NUM_USERS_PER_ROLE} usuários para a role: ${role} ---`);
    for (let i = 1; i <= NUM_USERS_PER_ROLE; i++) {
      const randomId = Math.floor(Math.random() * 1000000);
      const email = `${role}_${i}_${randomId}@prolineauto.com.br`;
      const fullName = `${role.charAt(0).toUpperCase() + role.slice(1)} Teste ${i}`;

      try {
        console.log(`Criando ${role} ${i}/${NUM_USERS_PER_ROLE}: ${email}`);

        // 1. Criar usuário no Supabase Auth
        let userId;
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: BASE_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: role,
            email_verified: true,
          },
        });

        if (authError) {
          if (authError.message.includes('User already exists')) {
            console.warn(`Usuário ${email} já existe no Auth. Tentando recuperar ID.`);
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers?.users.find(u => u.email === email);
            if (existingUser) {
              userId = existingUser.id;
            } else {
              throw new Error(`Usuário ${email} já existe, mas não foi possível recuperá-lo.`);
            }
          } else {
            throw authError;
          }
        } else {
          userId = authUser?.user?.id;
        }

        if (!userId) {
          throw new Error(`ID do usuário ${email} não obtido após criação/recuperação.`);
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

        // 3. Criar entrada na tabela específica da role
        let specificTableError = null;
        switch (role) {
          case 'client':
            const documentNumber = `111.111.111-${String(i).padStart(2, '0')}`;
            const companyName = `Empresa Cliente ${i}`;
            const { error: clientError } = await supabase.from('clients').upsert(
              {
                profile_id: userId,
                document_type: 'CPF',
                document_number: documentNumber,
                company_name: companyName,
              },
              { onConflict: 'profile_id' }
            );
            specificTableError = clientError;
            break;
          case 'partner':
            const cnpj = `00.000.000/0001-${String(i).padStart(2, '0')}`;
            const partnerCompanyName = `Oficina Parceira ${i}`;
            const { error: partnerError } = await supabase.from('partners').upsert(
              {
                profile_id: userId,
                cnpj: cnpj,
                company_name: partnerCompanyName,
                is_active: true,
              },
              { onConflict: 'profile_id' }
            );
            specificTableError = partnerError;
            break;
          case 'specialist':
            const { error: specialistError } = await supabase.from('specialists').upsert(
              {
                profile_id: userId,
              },
              { onConflict: 'profile_id' }
            );
            specificTableError = specialistError;
            break;
          case 'admin':
            const { error: adminError } = await supabase.from('admins').upsert(
              {
                profile_id: userId,
              },
              { onConflict: 'profile_id' }
            );
            specificTableError = adminError;
            break;
        }

        if (specificTableError) {
          throw specificTableError;
        }

        console.log(`  -> Sucesso para ${email}`);
      } catch (error) {
        console.error(`  -> Erro ao criar ${role} ${email}:`, error);
      }
    }
  }
  console.log(`
--- Geração de usuários concluída! ---`);
}

generateUsers();
