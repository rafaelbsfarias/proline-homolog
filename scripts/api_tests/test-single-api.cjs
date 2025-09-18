const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testSingleAPICall() {
  console.log('🧪 === TESTE ÚNICO DA API ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Simular login do usuário
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mecanica@parceiro.com',
      password: '123qwe'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    const accessToken = authData.session.access_token;
    console.log('✅ Login realizado com sucesso');

    // Fazer uma única chamada para a API
    const apiUrl = 'http://localhost:3000/api/partner/budgets/57306036-9de7-4676-a6fa-1a1f0fee298d';
    console.log('📡 Fazendo chamada única para:', apiUrl);

    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const responseTime = Date.now() - startTime;

    console.log('📡 Resposta recebida:', {
      status: response.status,
      ok: response.ok,
      responseTime: `${responseTime}ms`
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados recebidos com sucesso:');
      console.log('  - ID:', data.id);
      console.log('  - Status:', data.status);
      console.log('  - Vehicle:', `${data.vehiclePlate} ${data.vehicleBrand} ${data.vehicleModel}`);
      console.log('  - Items:', data.items?.length || 0);
    } else {
      console.error('❌ Erro na resposta:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }

  console.log('🧪 === FIM DO TESTE ===');
}

testSingleAPICall();
