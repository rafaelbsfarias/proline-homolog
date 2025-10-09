#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPartnerProfiles() {
  console.log('\n🔍 === VERIFICANDO ESTRUTURA DE PARTNERS E PROFILES ===\n');

  // 1. Verificar estrutura da tabela partners
  const { data: partners, error: partnersError } = await supabase
    .from('partners')
    .select('*')
    .limit(1);

  if (partnersError) {
    console.log('❌ Erro ao buscar partners:', partnersError);
  } else {
    console.log('📋 ESTRUTURA DA TABELA PARTNERS:');
    if (partners?.[0]) {
      console.log('Colunas:', Object.keys(partners[0]).join(', '));
    }
    console.log();
  }

  // 2. Buscar todos os parceiros
  const { data: allPartners, error: allPartnersError } = await supabase
    .from('partners')
    .select('*');

  if (allPartnersError) {
    console.log('❌ Erro ao buscar todos os partners:', allPartnersError);
  } else {
    console.log(`📦 TOTAL DE PARCEIROS: ${allPartners?.length || 0}\n`);
    
    allPartners?.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.name || partner.company_name || 'Sem nome'}`);
      console.log(`   ID: ${partner.id}`);
      console.log(`   Profile ID: ${partner.profile_id}`);
      console.log(`   Ativo: ${partner.is_active ? 'SIM' : 'NÃO'}`);
      console.log();
    });
  }

  // 3. Verificar se existem profiles com esses IDs
  console.log('🔍 VERIFICANDO PROFILES:\n');

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, role, created_at');

  if (profilesError) {
    console.log('❌ Erro ao buscar profiles:', profilesError);
  } else {
    console.log(`📦 TOTAL DE PROFILES: ${profiles?.length || 0}\n`);
    
    console.log('Roles existentes:');
    const roleCount = {};
    profiles?.forEach(profile => {
      roleCount[profile.role] = (roleCount[profile.role] || 0) + 1;
    });
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}`);
    });
    console.log();

    // Verificar quais profile_ids dos partners existem em profiles
    if (allPartners && profiles) {
      const partnerProfileIds = allPartners.map(p => p.profile_id);
      const existingProfileIds = profiles.map(p => p.id);
      
      const missingProfiles = partnerProfileIds.filter(id => !existingProfileIds.includes(id));
      
      console.log(`\n⚠️  PROFILES FALTANDO: ${missingProfiles.length}`);
      if (missingProfiles.length > 0) {
        console.log('IDs dos profiles que deveriam existir mas não existem:');
        missingProfiles.forEach(id => console.log(`  - ${id}`));
      }
    }
  }

  // 4. Verificar estrutura da tabela profiles
  const { data: sampleProfile } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (sampleProfile) {
    console.log('\n📋 ESTRUTURA DA TABELA PROFILES:');
    console.log('Colunas:', Object.keys(sampleProfile).join(', '));
  }

  console.log('\n================================================================================\n');
}

debugPartnerProfiles().catch(console.error);
