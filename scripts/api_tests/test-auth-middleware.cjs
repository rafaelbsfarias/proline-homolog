const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiI1NzEzZmEwMS0zNDc1LTRjNTItYWQ2NC01MjMwMjg1YWRlZjEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU4MTU1NjU3LCJpYXQiOjE3NTgxNTIwNTcsImVtYWlsIjoicGFydG5lci10ZXN0QHByb2xpbmUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IlBhcnRuZXIgVGVzdCIsInJvbGUiOiJwYXJ0bmVyIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTgxNTIwNTd9XSwic2Vzc2lvbl9pZCI6IjlmOTE5ZWU4LWUzNTYtNDFiZS1hMjliLTUyMzI2NDM0ZWUzMyIsImlzX2Fub255bW91cyI6ZmFsc2V9.f2dvIe9_GxaT1j2yHRgbEIiC_vuHxKh61XjnBlO9QlY';

async function testAuth() {
  console.log('🔐 === TESTE DE AUTENTICAÇÃO ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('🔍 Testando token do usuário...');
    
    const { data: { user }, error } = await supabase.auth.getUser(userToken);
    
    if (error) {
      console.error('❌ Erro ao validar token:', error);
      return;
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Token válido! Dados do usuário:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Metadata:', JSON.stringify(user.user_metadata, null, 2));
    console.log('  App Metadata:', JSON.stringify(user.app_metadata, null, 2));
    
    // Testar se o role está correto
    const userRole = user.user_metadata?.role;
    console.log('  Role extraído:', userRole);
    
    if (userRole === 'partner') {
      console.log('✅ Role de partner confirmado!');
    } else {
      console.log('❌ Role incorreto. Esperado: partner, Encontrado:', userRole);
    }
    
    // Testar busca na tabela profiles
    console.log('\n🔍 Verificando profile na tabela profiles...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
    } else {
      console.log('✅ Profile encontrado:');
      console.log('  ID:', profile.id);
      console.log('  Full Name:', profile.full_name);
      console.log('  User Role:', profile.user_role);
      console.log('  Role:', profile.role);
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔐 === FIM DO TESTE ===');
}

testAuth();
