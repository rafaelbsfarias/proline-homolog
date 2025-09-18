const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkPartnerData() {
  console.log('🔍 === VERIFICAÇÃO DE DADOS DE PARTNERS ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Buscar todos os partners
    console.log('👥 Buscando todos os partners...');
    const { data: allPartners, error: partnersError } = await supabase
      .from('partners')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        )
      `);

    if (partnersError) {
      console.error('❌ Erro ao buscar partners:', partnersError);
    } else {
      console.log('✅ Partners encontrados:', allPartners?.length || 0);
      if (allPartners && allPartners.length > 0) {
        allPartners.forEach((partner, index) => {
          console.log(`\n  ${index + 1}. Partner:`);
          console.log(`      ID: ${partner.id}`);
          console.log(`      Profile ID: ${partner.profile_id}`);
          console.log(`      Company: ${partner.company_name}`);
          console.log(`      CNPJ: ${partner.cnpj}`);
          console.log(`      Active: ${partner.is_active}`);
          if (partner.profiles) {
            console.log(`      Profile Email: ${partner.profiles.email}`);
            console.log(`      Profile Name: ${partner.profiles.full_name}`);
          }
        });
      }
    }

    // Verificar especificamente os dois IDs
    const currentUserId = '86e44b50-3ecd-4d24-bb69-35a83ae09f8a';
    const quotePartnerId = '5713fa01-3475-4c52-ad64-5230285adef1';

    console.log(`\n🔍 Verificando ID do usuário atual: ${currentUserId}`);
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single();

    if (currentUserError) {
      console.error('❌ Erro ao buscar usuário atual:', currentUserError);
    } else {
      console.log('✅ Usuário atual:', currentUser);
    }

    console.log(`\n🔍 Verificando ID do partner da quote: ${quotePartnerId}`);
    const { data: quotePartner, error: quotePartnerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', quotePartnerId)
      .single();

    if (quotePartnerError) {
      console.error('❌ Erro ao buscar partner da quote:', quotePartnerError);
    } else {
      console.log('✅ Partner da quote:', quotePartner);
    }

    // Verificar se o partner da quote existe na tabela partners
    const { data: partnerRecord, error: partnerRecordError } = await supabase
      .from('partners')
      .select('*')
      .eq('profile_id', quotePartnerId);

    if (partnerRecordError) {
      console.error('❌ Erro ao buscar registro do partner:', partnerRecordError);
    } else {
      console.log('✅ Registro do partner da quote:', partnerRecord);
    }

    // Vamos corrigir a quote para apontar para o partner correto
    console.log('\n🔧 Atualizando quote para o partner correto...');
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({ partner_id: currentUserId })
      .eq('id', '57306036-9de7-4676-a6fa-1a1f0fee298d')
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar quote:', updateError);
    } else {
      console.log('✅ Quote atualizada:', updatedQuote);
    }

    // Testar novamente a função dashboard
    console.log('\n📊 Testando função dashboard após correção...');
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_partner_dashboard_data', { p_partner_id: currentUserId });

    if (dashboardError) {
      console.error('❌ Erro na função dashboard:', dashboardError);
    } else {
      console.log('✅ Dados do dashboard após correção:');
      console.log(JSON.stringify(dashboardData, null, 2));
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkPartnerData();
