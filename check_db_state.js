import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseState() {
  console.log('🔍 VERIFICANDO ESTADO ATUAL DO BANCO DE DADOS\n');

  try {
    // 1. Verificar usuários no auth.users
    console.log('1. Usuários no Auth:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Erro ao buscar usuários auth:', authError);
    } else {
      console.log(`   Total: ${authUsers?.users?.length || 0} usuários`);
      authUsers?.users?.forEach(user => {
        console.log(
          `   - ${user.email}: confirmado=${!!user.email_confirmed_at}, role=${user.user_metadata?.role || 'N/A'}`
        );
      });
    }

    // 2. Verificar perfis
    console.log('\n2. Perfis na tabela profiles:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, status');
    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
    } else {
      console.log(`   Total: ${profiles?.length || 0} perfis`);
      profiles?.forEach(profile => {
        console.log(`   - ${profile.full_name} (${profile.role}): ${profile.status}`);
      });
    }

    // 3. Verificar clientes
    console.log('\n3. Clientes na tabela clients:');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('profile_id, company_name, document_number');
    if (clientsError) {
      console.error('Erro ao buscar clientes:', clientsError);
    } else {
      console.log(`   Total: ${clients?.length || 0} clientes`);
      clients?.forEach(client => {
        console.log(`   - ${client.company_name} (CNPJ: ${client.document_number})`);
      });
    }

    // 4. Testar função get_pending_users diretamente
    console.log('\n4. Testando função get_pending_users:');
    const { data: pendingUsers, error: pendingError } = await supabase.rpc('get_pending_users');
    if (pendingError) {
      console.error('Erro na função get_pending_users:', pendingError);
    } else {
      console.log(`   Usuários pendentes encontrados: ${pendingUsers?.length || 0}`);
      if (pendingUsers && pendingUsers.length > 0) {
        pendingUsers.forEach(user => {
          console.log(
            `   - ${user.full_name} (${user.email}) - Empresa: ${user.company_name || 'N/A'}, CNPJ: ${user.cnpj || 'N/A'}, Telefone: ${user.phone || 'N/A'}`
          );
        });
      }
    }
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkDatabaseState();
