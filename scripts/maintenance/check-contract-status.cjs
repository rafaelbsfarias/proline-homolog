const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkContractStatus() {
  console.log('📋 === VERIFICAÇÃO DO STATUS DO CONTRATO ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const partnerId = '5713fa01-3475-4c52-ad64-5230285adef1';

  try {
    console.log('🔍 Verificando se o contrato foi aceito...');
    
    const { data: contractAcceptance, error: contractError } = await supabase
      .from('contract_partners')
      .select('*')
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (contractError) {
      console.error('❌ Erro ao verificar contrato:', contractError);
      return;
    }

    if (contractAcceptance) {
      console.log('✅ Contrato aceito! Dados:');
      console.log('  Partner ID:', contractAcceptance.partner_id);
      console.log('  Signed:', contractAcceptance.signed);
      console.log('  Created At:', contractAcceptance.created_at);
      console.log('  Content Length:', contractAcceptance.content?.length || 'N/A');
    } else {
      console.log('❌ Contrato NÃO foi aceito ainda');
      console.log('🔧 Criando aceitação de contrato para o parceiro...');
      
      // Aceitar o contrato automaticamente para teste
      const { data: acceptanceResult, error: acceptError } = await supabase
        .rpc('accept_partner_contract', {
          p_partner_id: partnerId,
          p_content: 'Contrato do Parceiro - Versão de Teste',
          p_signed: true
        });

      if (acceptError) {
        console.error('❌ Erro ao aceitar contrato:', acceptError);
      } else {
        console.log('✅ Contrato aceito automaticamente!');
        console.log('Resultado:', acceptanceResult);
      }
    }

    // Verificar novamente após a aceitação
    const { data: finalCheck, error: finalError } = await supabase
      .from('contract_partners')
      .select('*')
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
    } else if (finalCheck) {
      console.log('✅ Status final do contrato:', finalCheck.signed ? 'ACEITO' : 'PENDENTE');
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('📋 === FIM DA VERIFICAÇÃO ===');
}

checkContractStatus();
