#!/usr/bin/env node

/**
 * Script para analisar dados incorretos na tabela mechanics_checklist
 * Identifica registros de parceiros que não são de Mecânica
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

async function analyzeMechanicsChecklistData() {
  console.log('🔧 Analisando tabela mechanics_checklist...');

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
      console.log(`    Criado em: ${record.created_at}`);
      console.log('');
    });

    if (invalidRecords.length === 0) {
      console.log('✅ Nenhum registro inválido encontrado.');
      return;
    }

    // Mostrar resumo por categoria
    const categories = {};
    invalidRecords.forEach(record => {
      const cat = record.partner_category;
      categories[cat] = (categories[cat] || 0) + 1;
    });

    console.log('\n📈 Resumo por categoria inválida:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} registros`);
    });

    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Estes registros devem ser REMOVIDOS da tabela mechanics_checklist');
    console.log('   - As anomalias destes parceiros permanecem em vehicle_anomalies (correto)');
    console.log('   - Execute a limpeza apenas após backup completo do banco');
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeMechanicsChecklistData();
}

export { analyzeMechanicsChecklistData };
