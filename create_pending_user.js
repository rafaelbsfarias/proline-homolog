require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Criando perfil para usuário pendente...');

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  const pendingUser = users?.users?.find(u => u.email === 'pendente@teste.com');

  if (!pendingUser) {
    console.error('Usuário pendente não encontrado');
    return;
  }

  console.log('User ID:', pendingUser.id);

  const { error: profileError } = await supabase.from('profiles').insert({
    id: pendingUser.id,
    full_name: 'Usuário Pendente Teste',
    role: 'client',
    status: 'ativo',
  });

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError);
  } else {
    console.log('Perfil criado com sucesso');

    const { error: clientError } = await supabase.from('clients').insert({
      profile_id: pendingUser.id,
      company_name: 'Empresa Teste Pendente',
      document_number: '12.345.678/0001-99',
    });

    if (clientError) {
      console.error('Erro ao criar client:', clientError);
    } else {
      console.log('Cliente criado com sucesso');
    }
  }
})();
