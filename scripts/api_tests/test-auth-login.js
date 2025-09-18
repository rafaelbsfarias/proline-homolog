const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

(async () => {
  console.log('🔑 TESTANDO LOGIN DO PARCEIRO');
  console.log('============================');

  try {
    // Fazer login com as credenciais do parceiro
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'partner-test@proline.com',
      password: '123456',
    });

    if (error) {
      console.log('❌ Erro no login:', error.message);
      return;
    }

    if (data.user && data.session) {
      console.log('✅ Login realizado com sucesso!');
      console.log('   Usuário ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Role:', data.user.user_metadata?.role);
      console.log('   Token:', data.session.access_token.substring(0, 50) + '...');

      console.log('');
      console.log('🧪 TESTANDO API COM TOKEN');
      console.log('========================');

      // Testar a API com o token
      const response = await fetch(
        'http://localhost:3002/api/partner/budgets/57306036-9de7-4676-a6fa-1a1f0fee298d',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
        }
      );

      console.log('📡 Resposta da API:');
      console.log('   Status:', response.status);
      console.log('   Status Text:', response.statusText);

      if (response.ok) {
        const apiData = await response.json();
        console.log('   Dados:', JSON.stringify(apiData, null, 2));
      } else {
        const errorData = await response.text();
        console.log('   Erro:', errorData);
      }
    } else {
      console.log('❌ Login falhou - dados incompletos');
    }
  } catch (err) {
    console.log('❌ Erro:', err.message);
  }
})();
