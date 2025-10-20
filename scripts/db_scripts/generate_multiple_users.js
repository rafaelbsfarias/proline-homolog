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

// Utilitários para gerar CPFs/CNPJs aleatórios formatados, reduzindo colisões
function randDigits(len) {
  let out = '';
  for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function formatCPF(d11) {
  // d11: string com 11 dígitos
  return `${d11.slice(0, 3)}.${d11.slice(3, 6)}.${d11.slice(6, 9)}-${d11.slice(9, 11)}`;
}

function formatCNPJ(d14) {
  // d14: string com 14 dígitos
  return `${d14.slice(0, 2)}.${d14.slice(2, 5)}.${d14.slice(5, 8)}/${d14.slice(8, 12)}-${d14.slice(12, 14)}`;
}

function generateCPF(seed = '') {
  // Gera 11 dígitos pseudoaleatórios; inclui parte do timestamp/seed para reduzir colisão
  const base = (Date.now().toString() + seed + randDigits(11)).slice(-11);
  return formatCPF(base);
}

function generateCNPJ(seed = '') {
  // Gera 14 dígitos pseudoaleatórios; inclui parte do timestamp/seed
  const base = (Date.now().toString() + seed + randDigits(14)).slice(-14);
  return formatCNPJ(base);
}

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
            const documentNumber = generateCPF(`${role}-${i}`);
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
            const cnpj = generateCNPJ(`${role}-${i}`);
            const partnerCompanyName = `Oficina Parceira ${i}`;
            const { error: partnerError } = await supabase.from('partners').upsert(
              {
                profile_id: userId,
                cnpj: cnpj,
                company_name: partnerCompanyName,
                is_active: true,
                category: 'Oficina Mecânica',
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
