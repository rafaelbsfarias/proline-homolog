// scripts/db_scripts/orchestrator.js

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

// --- Funções utilitárias compartilhadas ---

// Utilitários para gerar CPFs/CNPJs aleatórios formatados, reduzindo colisões
function randDigits(len) {
  let out = '';
  for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function formatCPF(d11) {
  return `${d11.slice(0, 3)}.${d11.slice(3, 6)}.${d11.slice(6, 9)}-${d11.slice(9, 11)}`;
}

function formatCNPJ(d14) {
  return `${d14.slice(0, 2)}.${d14.slice(2, 5)}.${d14.slice(5, 8)}/${d14.slice(8, 12)}-${d14.slice(12, 14)}`;
}

function generateCPF(seed = '') {
  const base = (Date.now().toString() + seed + randDigits(11)).slice(-11);
  return formatCPF(base);
}

function generateCNPJ(seed = '') {
  const base = (Date.now().toString() + seed + randDigits(14)).slice(-14);
  return formatCNPJ(base);
}

// --- Função de criação de usuário (adaptada de create_all_users.js) ---

async function createUser(email, password, fullName, role, additionalData = {}) {
  try {
    console.log(`\n--- Criando usuário ${role}: ${email} ---`);

    // 1. Criar usuário no Supabase Auth
    const authUserResult = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        email_verified: true,
      },
    });

    let authUser = authUserResult.data;
    const authError = authUserResult.error;

    if (authError) {
      if (authError.message.includes('User already exists')) {
        console.warn(`Usuário ${email} já existe no Auth. Pulando criação no Auth.`);
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

    console.log(`--- Usuário ${role} ${email} criado/atualizado com sucesso! ---`);
    return userId;
  } catch (error) {
    console.error(`--- Erro ao criar usuário ${email}: ---`);
    console.error(error);
    throw error;
  }
}

// --- Função para gerar veículos (adaptada de generate_vehicles.js) ---

async function generateVehicles(numVehicles = 100) {
  try {
    console.log(`\n--- Gerando ${numVehicles} veículos ---`);

    // 1. Obter IDs de clientes existentes
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('profile_id');

    if (clientsError) {
      throw clientsError;
    }

    if (!clients || clients.length === 0) {
      console.warn('Nenhum cliente encontrado. Por favor, crie clientes primeiro.');
      return;
    }

    const clientIds = clients.map(client => client.profile_id);
    console.log(`Encontrados ${clientIds.length} clientes para associar veículos.`);

    const vehiclesToInsert = [];
    const brands = ['Toyota', 'Volkswagen', 'Ford', 'Chevrolet', 'Fiat', 'Honda'];
    const models = ['Corolla', 'Golf', 'Ka', 'Onix', 'Palio', 'Civic'];
    const colors = ['Branco', 'Preto', 'Prata', 'Vermelho', 'Azul'];

    for (let i = 0; i < numVehicles; i++) {
      const randomClientIndex = i % clientIds.length;
      const clientId = clientIds[randomClientIndex];

      const randomBrand = brands[Math.floor(Math.random() * brands.length)];
      const randomModel = models[Math.floor(Math.random() * models.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomYear = 2000 + Math.floor(Math.random() * 25);
      const plate = `ABC${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 10)).padStart(1, '0')}`;

      // Gerar valores para preparacao e comercializacao
      // Garantir que nunca ambos sejam false
      let preparacao, comercializacao;
      const randomCase = Math.floor(Math.random() * 3);

      switch (randomCase) {
        case 0: // true, true
          preparacao = true;
          comercializacao = true;
          break;
        case 1: // true, false
          preparacao = true;
          comercializacao = false;
          break;
        case 2: // false, true
          preparacao = false;
          comercializacao = true;
          break;
      }

      vehiclesToInsert.push({
        client_id: clientId,
        plate: plate,
        brand: randomBrand,
        model: randomModel,
        color: randomColor,
        year: randomYear,
        status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
        preparacao: preparacao,
        comercializacao: comercializacao,
      });
    }

    // 2. Inserir veículos em lote
    console.log(`Inserindo ${vehiclesToInsert.length} veículos...`);
    const { error: insertError } = await supabase.from('vehicles').insert(vehiclesToInsert);

    if (insertError) {
      throw insertError;
    }

    console.log(`--- ${numVehicles} veículos gerados e associados com sucesso! ---`);
  } catch (error) {
    console.error(`--- Erro ao gerar veículos: ---`);
    console.error(error);
    throw error;
  }
}

// --- Função para gerar múltiplos usuários (adaptada de generate_multiple_users.js) ---

async function generateMultipleUsers() {
  const ROLES_TO_GENERATE = ['admin', 'client', 'partner', 'specialist'];
  const NUM_USERS_PER_ROLE = 10;
  const BASE_PASSWORD = '123qwe';

  for (const role of ROLES_TO_GENERATE) {
    console.log(`\n--- Gerando ${NUM_USERS_PER_ROLE} usuários para a role: ${role} ---`);
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
                percentual_fipe: 50,
                taxa_operacao: 10,
                parqueamento: 25,
                quilometragem: 100,
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
  console.log(`\n--- Geração de usuários múltiplos concluída! ---`);
}

// --- Execução principal do orquestrador ---

async function main() {
  console.log(`
========================================
🚀 INICIANDO ORQUESTRADOR DE SETUP
========================================
Ordem de execução:
1. create_all_users.js
2. generate_vehicles.js
3. generate_multiple_users.js
========================================
`);

  try {
    // 1. Executar create_all_users.js
    console.log(`\n📋 PASSO 1: Executando create_all_users.js`);
    console.log(`Criando usuários principais de teste...`);

    // Admin User
    const randomClientId = Math.floor(Math.random() * 100000);
    await createUser('admin@prolineauto.com.br', '123qwe', 'Administrador Principal', 'admin');

    // Client User
    await createUser(
      `cliente@prolineauto.com.br`,
      '123qwe',
      `Cliente Teste ${randomClientId}`,
      'client',
      {
        document_type: 'CPF',
        document_number: `111.111.111-${String(randomClientId).padStart(2, '0')}`,
        company_name: `Empresa Cliente ${randomClientId}`,
        percentual_fipe: 50,
        taxa_operacao: 10,
        parqueamento: 25,
        quilometragem: 100,
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

    console.log(`✅ PASSO 1 concluído com sucesso!`);

    // 2. Executar generate_vehicles.js
    console.log(`\n📋 PASSO 2: Executando generate_vehicles.js`);
    await generateVehicles(100);
    console.log(`✅ PASSO 2 concluído com sucesso!`);

    // 3. Executar generate_multiple_users.js
    console.log(`\n📋 PASSO 3: Executando generate_multiple_users.js`);
    await generateMultipleUsers();
    console.log(`✅ PASSO 3 concluído com sucesso!`);

    console.log(`
========================================
🎉 ORQUESTRADOR CONCLUÍDO COM SUCESSO!
========================================
Todos os scripts foram executados na ordem correta.
Base de dados populada com:
- Usuários principais de teste
- 100 veículos de teste
- 40 usuários adicionais (10 por role)
========================================
`);
  } catch (error) {
    console.error(`
========================================
❌ ERRO NO ORQUESTRADOR
========================================
`);
    console.error(error);
    process.exit(1);
  }
}

main();
