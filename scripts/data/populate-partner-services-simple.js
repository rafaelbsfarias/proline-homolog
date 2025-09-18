/**
 * Script para Popular Serviços de Parceiro - Versão Simplificada
 * Resolve a inconsistência adicionando serviços básicos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function populatePartnerServicesSimple() {
  console.log('🏆 POPULANDO SERVIÇOS DO PARCEIRO (VERSÃO SIMPLIFICADA)');
  console.log('='.repeat(60));

  try {
    // 1. Verificar usuário parceiro
    console.log('\n👤 BUSCANDO USUÁRIO PARCEIRO...');
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError);
      return;
    }

    const partnerUser = user.users.find(u => u.email === 'mecanica@parceiro.com');
    if (!partnerUser) {
      console.error('❌ Usuário parceiro não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${partnerUser.email}`);
    console.log(`   ID: ${partnerUser.id}`);

    // 2. Verificar se já existem serviços
    console.log('\n📋 VERIFICANDO SERVIÇOS EXISTENTES...');
    const { data: existingServices, error: checkError } = await supabase
      .from('partner_services')
      .select('*')
      .eq('partner_id', partnerUser.id);

    if (checkError) {
      console.error('❌ Erro ao verificar serviços existentes:', checkError);
      return;
    }

    if (existingServices && existingServices.length > 0) {
      console.log(`ℹ️  Já existem ${existingServices.length} serviços cadastrados:`);
      existingServices.forEach(service => {
        console.log(`   • ${service.name} - R$ ${service.price}`);
      });
      return;
    }

    // 3. Serviços básicos (apenas campos obrigatórios)
    const basicServices = [
      {
        partner_id: partnerUser.id,
        name: 'Troca de Óleo e Filtros',
        description: 'Troca completa de óleo do motor, filtro de óleo e filtro de ar',
        price: 150.0,
      },
      {
        partner_id: partnerUser.id,
        name: 'Alinhamento e Balanceamento',
        description: 'Alinhamento das rodas e balanceamento dos pneus',
        price: 120.0,
      },
      {
        partner_id: partnerUser.id,
        name: 'Revisão Completa',
        description: 'Revisão geral do veículo com checklist completo',
        price: 200.0,
      },
    ];

    // 4. Inserir serviços um por vez para identificar problemas
    console.log('\n💾 INSERINDO SERVIÇOS...');

    for (const service of basicServices) {
      try {
        console.log(`\n   Inserindo: ${service.name}`);
        const { data: insertedService, error: insertError } = await supabase
          .from('partner_services')
          .insert(service)
          .select()
          .single();

        if (insertError) {
          console.log(`   ❌ Erro: ${insertError.message}`);
          console.log(`   Código: ${insertError.code}`);
        } else {
          console.log(`   ✅ Sucesso: ${insertedService.name} (ID: ${insertedService.id})`);
        }
      } catch (error) {
        console.log(`   ❌ Erro geral: ${error.message}`);
      }
    }

    // 5. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('partner_services')
      .select('*')
      .eq('partner_id', partnerUser.id);

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
    } else {
      console.log(`✅ Verificação final: ${finalCheck?.length || 0} serviços encontrados`);
      if (finalCheck && finalCheck.length > 0) {
        console.log('\n🏆 SERVIÇOS CADASTRADOS:');
        finalCheck.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name} - R$ ${service.price}`);
        });
      }
    }

    console.log('\n🎉 PROCESSO CONCLUÍDO!');
  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

// Executar população
populatePartnerServicesSimple().catch(console.error);
