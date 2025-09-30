#!/usr/bin/env node

/**
 * Script para corrigir o alinhamento entre orçamentos e parceiros
 *
 * Problema: Orçamentos estão associados a IDs de parceiros antigos,
 * mas a API está retornando parceiros com IDs diferentes.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remoto' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixPartnerQuoteAlignment() {
  console.log('🔧 INICIANDO CORREÇÃO DE ALINHAMENTO PARCEIROS x ORÇAMENTOS\n');

  try {
    // 1. Buscar orçamentos com status pending_admin_approval
    console.log('1️⃣ Buscando orçamentos pending_admin_approval...');
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, partner_id, status, total_value, created_at')
      .eq('status', 'pending_admin_approval');

    if (quotesError) {
      console.error('❌ Erro ao buscar orçamentos:', quotesError);
      return;
    }

    console.log(`   Encontrados: ${quotes?.length || 0} orçamentos\n`);

    if (!quotes?.length) {
      console.log('✅ Nenhum orçamento pending_admin_approval encontrado.');
      return;
    }

    // 2. Para cada orçamento, verificar o parceiro atual
    for (const quote of quotes) {
      console.log(`📋 Orçamento ID: ${quote.id}`);
      console.log(`   Partner ID atual: ${quote.partner_id}`);

      // Verificar se o parceiro existe e está ativo
      const { data: currentPartner, error: partnerError } = await supabase
        .from('partners')
        .select('profile_id, company_name, is_active')
        .eq('profile_id', quote.partner_id)
        .single();

      if (partnerError) {
        console.log('   ❌ Parceiro não encontrado');

        // Tentar encontrar um parceiro com nome similar
        if (quote.partner_id === 'a3b5aa7c-8639-44f4-840e-63fc0bb05cef') {
          console.log('   🔍 Buscando "Oficina Mecânica ProLine" ativo...');
          const { data: newPartner } = await supabase
            .from('partners')
            .select('profile_id, company_name')
            .eq('company_name', 'Oficina Mecânica ProLine')
            .eq('is_active', true)
            .single();

          if (newPartner && newPartner.profile_id !== quote.partner_id) {
            console.log(`   ✅ Encontrado novo ID: ${newPartner.profile_id}`);
            await updateQuotePartner(quote.id, newPartner.profile_id, newPartner.company_name);
          }
        }

        if (quote.partner_id === '96cec73f-122e-4d44-886b-34d93debc913') {
          console.log('   🔍 Buscando "Funilaria e Pintura ProLine" ativo...');
          const { data: newPartner } = await supabase
            .from('partners')
            .select('profile_id, company_name')
            .eq('company_name', 'Funilaria e Pintura ProLine')
            .eq('is_active', true)
            .single();

          if (newPartner && newPartner.profile_id !== quote.partner_id) {
            console.log(`   ✅ Encontrado novo ID: ${newPartner.profile_id}`);
            await updateQuotePartner(quote.id, newPartner.profile_id, newPartner.company_name);
          }
        }
      } else {
        console.log(
          `   ✅ Parceiro válido: ${currentPartner.company_name} (Ativo: ${currentPartner.is_active})`
        );
      }

      console.log('');
    }

    console.log('\n🎉 Correção concluída!');

    // 3. Verificar resultado final
    await verifyFinalResult();
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

async function updateQuotePartner(quoteId, newPartnerId, companyName) {
  console.log(`   🔄 Atualizando orçamento ${quoteId} para parceiro ${newPartnerId}...`);

  const { error } = await supabase
    .from('quotes')
    .update({ partner_id: newPartnerId })
    .eq('id', quoteId);

  if (error) {
    console.log(`   ❌ Erro ao atualizar: ${error.message}`);
  } else {
    console.log(`   ✅ Atualizado para: ${companyName}`);
  }
}

async function verifyFinalResult() {
  console.log('📊 VERIFICAÇÃO FINAL...\n');

  // Verificar orçamentos pending_admin_approval
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, partner_id, status')
    .eq('status', 'pending_admin_approval');

  console.log(`Orçamentos pending_admin_approval: ${quotes?.length || 0}`);

  if (quotes?.length) {
    for (const quote of quotes) {
      const { data: partner } = await supabase
        .from('partners')
        .select('company_name, is_active')
        .eq('profile_id', quote.partner_id)
        .single();

      console.log(
        `  - ${quote.id} → ${partner?.company_name || 'PARCEIRO NÃO ENCONTRADO'} (${partner?.is_active ? 'ATIVO' : 'INATIVO'})`
      );
    }
  }

  console.log('\n');
}

// Executar o script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPartnerQuoteAlignment();
}
