const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

(async () => {
  console.log('👤 CRIANDO PARTNER NA TABELA PROFILES');
  console.log('====================================');
  
  const partnerId = '5713fa01-3475-4c52-ad64-5230285adef1';
  
  // Verificar se o usuário está na tabela profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId);
    
  if (!profile || profile.length === 0) {
    console.log('   Criando profile...');
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: partnerId,
        full_name: 'Partner Test',
        role: 'partner',
        status: 'active',
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (newProfile) {
      console.log('✅ Profile criado com sucesso!');
    } else {
      console.log('❌ Erro ao criar profile:', createProfileError);
    }
  } else {
    console.log('✅ Profile já existe');
    console.log('   Role atual:', profile[0].role);
  }
  
  // Verificar se existe tabela partners
  console.log('\n🔍 VERIFICANDO TABELA PARTNERS');
  const { data: partners, error: partnersError } = await supabase
    .from('partners')
    .select('*')
    .limit(1);
    
  if (partnersError && partnersError.code === 'PGRST106') {
    console.log('❌ Tabela partners não existe');
    console.log('   O sistema deve usar a tabela profiles como referência');
    
    // Tentar atualizar constraint ou usar alternativa
    console.log('\n🔄 TENTANDO CRIAR PARTNER DIRETO NO QUOTE');
    
    // Verificar se podemos remover a constraint temporariamente
    // Ou usar o partner_id de um partner existente
    const { data: existingQuotes, error: quotesError } = await supabase
      .from('quotes')
      .select('partner_id')
      .not('partner_id', 'is', null)
      .limit(1);
      
    if (existingQuotes && existingQuotes.length > 0) {
      console.log('   Partner ID existente encontrado:', existingQuotes[0].partner_id);
      console.log('   Vamos usar um quote separado para nosso teste');
    }
  } else if (partners) {
    console.log('✅ Tabela partners existe');
    if (partners.length > 0) {
      console.log('   Colunas:', Object.keys(partners[0]));
    }
  }
})();
