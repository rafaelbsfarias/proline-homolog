#!/usr/bin/env node

/**
 * Script para corrigir dados incorretos na tabela mechanics_checklist
 * Remove registros de parceiros que não são de Mecânica
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.local
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMechanicsChecklistData() {
  console.log('🔧 Iniciando correção da tabela mechanics_checklist...');

  try {
    // Buscar todos os registros da mechanics_checklist com informações dos parceiros
    const { data: checklistRecords, error: checklistError } = await supabase.from(
      'mechanics_checklist'
    ).select(`
        id,
        partner_id,
        vehicle_id,
        category,
        created_at,
        partners!inner(category)
      `);

    if (checklistError) {
      console.error('❌ Erro ao buscar registros:', checklistError);
      return;
    }

    console.log(`📊 Encontrados ${checklistRecords.length} registros na mechanics_checklist`);

    // Identificar registros de parceiros não-mecânicos
    const invalidRecords = checklistRecords.filter(record => {
      const partnerCategory = record.partners?.category;
      return partnerCategory !== 'Mecânica';
    });

    console.log(`❌ Encontrados ${invalidRecords.length} registros inválidos (não-mecânicos):`);

    invalidRecords.forEach(record => {
      console.log(`  - ID: ${record.id}`);
      console.log(`    Parceiro: ${record.partner_id}`);
      console.log(`    Categoria: ${record.partners?.category}`);
      console.log(`    Veículo: ${record.vehicle_id}`);
      console.log(`    Criado em: ${record.created_at}`);
      console.log('');
    });

    if (invalidRecords.length === 0) {
      console.log('✅ Nenhum registro inválido encontrado. Tabela já está correta.');
      return;
    }

    // Confirmar antes de deletar
    console.log('⚠️  ATENÇÃO: Os registros acima serão REMOVIDOS permanentemente!');
    console.log('Digite "CONFIRMAR" para continuar ou qualquer outra coisa para cancelar:');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const confirmation = await new Promise(resolve => {
      rl.question('', resolve);
    });

    rl.close();

    if (confirmation !== 'CONFIRMAR') {
      console.log('❌ Operação cancelada pelo usuário.');
      return;
    }

    // Deletar registros inválidos
    const invalidIds = invalidRecords.map(record => record.id);

    console.log(`🗑️  Removendo ${invalidIds.length} registros inválidos...`);

    const { error: deleteError } = await supabase
      .from('mechanics_checklist')
      .delete()
      .in('id', invalidIds);

    if (deleteError) {
      console.error('❌ Erro ao deletar registros:', deleteError);
      return;
    }

    console.log('✅ Registros inválidos removidos com sucesso!');

    // Verificar se também devemos limpar tabelas relacionadas
    console.log('🔍 Verificando tabelas relacionadas...');

    // Buscar itens relacionados
    const { data: relatedItems, error: itemsError } = await supabase
      .from('mechanics_checklist_items')
      .select('id, partner_id, partners!inner(category)')
      .in(
        'partner_id',
        invalidRecords.map(r => r.partner_id)
      );

    if (!itemsError && relatedItems) {
      const invalidItems = relatedItems.filter(item => item.partners?.category !== 'Mecânica');
      if (invalidItems.length > 0) {
        console.log(`🧹 Encontrados ${invalidItems.length} itens relacionados inválidos.`);
        console.log('Limpando itens...');

        const { error: deleteItemsError } = await supabase
          .from('mechanics_checklist_items')
          .delete()
          .in(
            'id',
            invalidItems.map(item => item.id)
          );

        if (deleteItemsError) {
          console.error('❌ Erro ao limpar itens:', deleteItemsError);
        } else {
          console.log('✅ Itens relacionados limpos.');
        }
      }
    }

    // Buscar evidências relacionadas
    const { data: relatedEvidences, error: evidencesError } = await supabase
      .from('mechanics_checklist_evidences')
      .select('id, partner_id, partners!inner(category)')
      .in(
        'partner_id',
        invalidRecords.map(r => r.partner_id)
      );

    if (!evidencesError && relatedEvidences) {
      const invalidEvidences = relatedEvidences.filter(ev => ev.partners?.category !== 'Mecânica');
      if (invalidEvidences.length > 0) {
        console.log(`🧹 Encontrados ${invalidEvidences.length} registros de evidências inválidos.`);
        console.log('Limpando evidências...');

        const { error: deleteEvidencesError } = await supabase
          .from('mechanics_checklist_evidences')
          .delete()
          .in(
            'id',
            invalidEvidences.map(ev => ev.id)
          );

        if (deleteEvidencesError) {
          console.error('❌ Erro ao limpar evidências:', deleteEvidencesError);
        } else {
          console.log('✅ Evidências relacionadas limpas.');
        }
      }
    }

    console.log('🎉 Correção concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMechanicsChecklistData();
}

export { fixMechanicsChecklistData };
