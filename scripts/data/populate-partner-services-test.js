/**
 * Script para Popular Serviços de Parceiro
 * Resolve a inconsistência adicionando serviços de teste
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

async function populatePartnerServices() {
  console.log('🏆 POPULANDO SERVIÇOS DO PARCEIRO');
  console.log('='.repeat(50));

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

    // 3. Serviços de exemplo para parceiro de mecânica
    const sampleServices = [
      {
        partner_id: partnerUser.id,
        name: 'Troca de Óleo e Filtros',
        description: 'Troca completa de óleo do motor, filtro de óleo e filtro de ar',
        price: 150.0,
        estimated_days: 1,
      },
      {
        partner_id: partnerUser.id,
        name: 'Alinhamento e Balanceamento',
        description: 'Alinhamento das rodas e balanceamento dos pneus',
        price: 120.0,
        estimated_days: 1,
      },
      {
        partner_id: partnerUser.id,
        name: 'Revisão Completa',
        description: 'Revisão geral do veículo com checklist completo',
        price: 200.0,
        estimated_days: 2,
      },
      {
        partner_id: partnerUser.id,
        name: 'Troca de Pastilhas de Freio',
        description: 'Substituição das pastilhas de freio dianteiras e traseiras',
        price: 180.0,
        estimated_days: 1,
      },
      {
        partner_id: partnerUser.id,
        name: 'Troca de Velas',
        description: 'Substituição das velas de ignição',
        price: 80.0,
        estimated_days: 1,
      },
      {
        partner_id: partnerUser.id,
        name: 'Troca de Correia de Acessórios',
        description: 'Substituição da correia de acessórios e tensionadores',
        price: 250.0,
        estimated_days: 2,
      },
    ];

    // 4. Inserir serviços
    console.log('\n💾 INSERINDO SERVIÇOS...');
    const { data: insertedServices, error: insertError } = await supabase
      .from('partner_services')
      .insert(sampleServices)
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir serviços:', insertError);
      console.error('Detalhes:', insertError.details);
      console.error('Mensagem:', insertError.message);
      return;
    }

    // 5. Verificar inserção
    console.log('\n✅ SERVIÇOS INSERIDOS COM SUCESSO!');
    console.log(`📊 Total de serviços adicionados: ${insertedServices?.length || 0}`);

    if (insertedServices && insertedServices.length > 0) {
      console.log('\n🏆 SERVIÇOS CADASTRADOS:');
      insertedServices.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name}`);
        console.log(`      Preço: R$ ${service.price}`);
        console.log(`      Dias estimados: ${service.estimated_days}`);
        console.log(`      ID: ${service.id}`);
        console.log('');
      });
    }

    // 6. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('partner_services')
      .select('*')
      .eq('partner_id', partnerUser.id);

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
    } else {
      console.log(`✅ Verificação final: ${finalCheck?.length || 0} serviços encontrados`);
    }

    console.log('\n🎉 PROCESSO CONCLUÍDO!');
    console.log('💡 Agora os serviços devem aparecer na página de orçamento');
  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

// Executar população
populatePartnerServices().catch(console.error);
