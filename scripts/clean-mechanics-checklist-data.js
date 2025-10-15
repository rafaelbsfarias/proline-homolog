#!/usr/bin/env node

/**
 * Script para limpar dados incorretos na tabela mechanics_checklist
 * Remove registros de parceiros que não são de Mecânica
 */

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.local
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanMechanicsChecklistData() {
  console.log('🧹 Iniciando limpeza da tabela mechanics_checklist...');

  try {
    // Primeiro, buscar todos os registros da mechanics_checklist
    const { data: checklistRecords, error: checklistError } = await supabase
      .from('mechanics_checklist')
      .select('id, partner_id, vehicle_id, category, created_at');

    if (checklistError) {
      console.error('❌ Erro ao buscar registros:', checklistError);
      return;
    }

    console.log(`📊 Encontrados ${checklistRecords.length} registros na mechanics_checklist`);

    // Buscar informações dos parceiros separadamente
    const partnerIds = [...new Set(checklistRecords.map(r => r.partner_id))];
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('profile_id, category')
      .in('profile_id', partnerIds);

    if (partnersError) {
      console.error('❌ Erro ao buscar parceiros:', partnersError);
      return;
    }

    // Criar mapa de parceiros
    const partnerMap = {};
    partners.forEach(partner => {
      partnerMap[partner.profile_id] = partner.category;
    });

    // Combinar dados
    const recordsWithPartners = checklistRecords.map(record => ({
      ...record,
      partner_category: partnerMap[record.partner_id] || 'Categoria não encontrada',
    }));

    // Identificar registros de parceiros não-mecânicos
    const invalidRecords = recordsWithPartners.filter(record => {
      const partnerCategory = record.partner_category;
      return partnerCategory !== 'Mecânica';
    });

    console.log(`❌ Encontrados ${invalidRecords.length} registros inválidos (não-mecânicos):`);

    invalidRecords.forEach(record => {
      console.log(`  - ID: ${record.id}`);
      console.log(`    Parceiro: ${record.partner_id}`);
      console.log(`    Categoria: ${record.partner_category}`);
      console.log(`    Veículo: ${record.vehicle_id}`);
      console.log('');
    });

    if (invalidRecords.length === 0) {
      console.log('✅ Nenhum registro inválido encontrado. Tabela já está limpa.');
      return;
    }

    // ⚠️ CONFIRMAÇÃO MANUAL - O script não executa automaticamente
    console.log('\n🚨 ATENÇÃO CRÍTICA:');
    console.log(`   Este script irá REMOVER ${invalidRecords.length} registros permanentemente!`);
    console.log('   Execute apenas após backup completo do banco de dados.');
    console.log('');
    console.log('💡 Para executar a limpeza, descomente o código de deleção no final do script.');
    console.log('   Ou execute manualmente no SQL Editor do Supabase:');

    const invalidIds = invalidRecords.map(r => r.id);
    console.log('');
    console.log('DELETE FROM mechanics_checklist WHERE id IN (');
    invalidIds.forEach((id, index) => {
      console.log(`  '${id}'${index < invalidIds.length - 1 ? ',' : ''}`);
    });
    console.log(');');

    // Código de deleção comentado para segurança
    /*
    console.log(`\n🗑️  Removendo ${invalidRecords.length} registros inválidos...`);

    const { error: deleteError } = await supabase
      .from('mechanics_checklist')
      .delete()
      .in('id', invalidIds);

    if (deleteError) {
      console.error('❌ Erro ao deletar registros:', deleteError);
      return;
    }

    console.log('✅ Registros inválidos removidos com sucesso!');
    console.log('🎉 Tabela mechanics_checklist agora contém apenas registros válidos.');
    */
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanMechanicsChecklistData();
}

export { cleanMechanicsChecklistData };
