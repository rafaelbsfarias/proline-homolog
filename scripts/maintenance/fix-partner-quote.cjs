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
        email: 'partner-test@proline.com',
        full_name: 'Partner Test',
        user_role: 'partner',
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
    console.log('   Role atual:', profile[0].user_role);
  }
  
  // Agora atualizar o quote
  console.log('\n🔄 ATUALIZANDO QUOTE PARA O PARTNER CORRETO');
  
  const quoteId = '57306036-9de7-4676-a6fa-1a1f0fee298d';
  
  const { data: updatedQuote, error: updateError } = await supabase
    .from('quotes')
    .update({ partner_id: partnerId })
    .eq('id', quoteId)
    .select();
    
  if (updatedQuote) {
    console.log('✅ Quote atualizado com sucesso!');
    console.log('   Quote ID:', updatedQuote[0].id);
    console.log('   Novo Partner ID:', updatedQuote[0].partner_id);
  } else {
    console.log('❌ Erro ao atualizar quote:', updateError);
  }
})();
