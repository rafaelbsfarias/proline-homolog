const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function verifyUserCredentials() {
  console.log('🔍 === VERIFICAÇÃO DAS CREDENCIAIS DO USUÁRIO ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = 'mecanica@parceiro.com';
  const password = '123qwe';

  try {
    console.log('🔐 Fazendo login com as credenciais...');
    
    // Tentar fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    if (!authData.user) {
      console.error('❌ Usuário não encontrado após login');
      return;
    }

    const userId = authData.user.id;
    console.log('✅ Login bem-sucedido!');
    console.log('  User ID:', userId);
    console.log('  Email:', authData.user.email);
    console.log('  User Metadata:', JSON.stringify(authData.user.user_metadata, null, 2));

    // Verificar profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
    } else {
      console.log('✅ Profile encontrado:');
      console.log('  Full Name:', profile.full_name);
      console.log('  Role:', profile.role);
      console.log('  User Role:', profile.user_role);
    }

    // Verificar se existe na tabela partners
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('profile_id', userId);

    if (partnerError) {
      console.error('❌ Erro ao buscar partner:', partnerError);
    } else if (partner && partner.length > 0) {
      console.log('✅ Partner encontrado:');
      console.log('  Company:', partner[0].company_name);
      console.log('  CNPJ:', partner[0].cnpj);
      console.log('  Active:', partner[0].is_active);
    } else {
      console.log('❌ Partner NÃO encontrado na tabela partners');
    }

    // Verificar quotes para este usuário
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .eq('partner_id', userId);

    if (quotesError) {
      console.error('❌ Erro ao buscar quotes:', quotesError);
    } else {
      console.log('✅ Quotes encontrados para este usuário:', quotes?.length || 0);
      if (quotes && quotes.length > 0) {
        quotes.forEach((quote, index) => {
          console.log(`  ${index + 1}. ID: ${quote.id} | Status: ${quote.status}`);
        });
      }
    }

    // Testar a função dashboard para este usuário
    console.log('\n📊 Testando função dashboard...');
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_partner_dashboard_data', { p_partner_id: userId });

    if (dashboardError) {
      console.error('❌ Erro na função dashboard:', dashboardError);
    } else {
      console.log('✅ Dados do dashboard:');
      console.log(JSON.stringify(dashboardData, null, 2));
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

verifyUserCredentials();
