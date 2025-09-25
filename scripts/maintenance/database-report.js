/**
 * Relatório completo do banco de dados
 * Identifica estrutura das tabelas e dados mockados vs reais
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateDatabaseReport() {
  console.log('📊 RELATÓRIO DO BANCO DE DADOS');
  console.log('=====================================\n');

  try {
    // Lista de tabelas para verificar
    const tablesToCheck = [
      'users',
      'clients',
      'partners',
      'vehicles',
      'service_orders',
      'quotes',
      'partner_quotes',
      'budgets',
      'quotes',
      'quote_items',
      'services',
      'categories',
      'collections',
      'inspections',
      'addresses',
    ];

    const existingTables = [];
    const nonExistingTables = [];

    // 1. VERIFICAR QUAIS TABELAS EXISTEM
    console.log('1. VERIFICAÇÃO DE TABELAS EXISTENTES');
    console.log('=====================================');

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);

        if (error) {
          nonExistingTables.push(tableName);
          console.log(`❌ ${tableName}: NÃO EXISTE`);
        } else {
          existingTables.push(tableName);
          console.log(`✅ ${tableName}: EXISTE`);
        }
      } catch (e) {
        nonExistingTables.push(tableName);
        console.log(`❌ ${tableName}: ERRO`);
      }
    }

    console.log(
      `\n📈 Resumo: ${existingTables.length} tabelas existem, ${nonExistingTables.length} não existem\n`
    );

    // 2. ANÁLISE DETALHADA DAS TABELAS EXISTENTES
    console.log('2. ANÁLISE DETALHADA DAS TABELAS');
    console.log('==================================');

    for (const tableName of existingTables) {
      console.log(`\n🔍 TABELA: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(40));

      try {
        // Contar registros
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.log(`   ❌ Erro ao contar: ${countError.message}`);
          continue;
        }

        console.log(`   📊 Total de registros: ${count || 0}`);

        if (count && count > 0) {
          // Buscar alguns registros para análise
          const { data: samples, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(3);

          if (sampleError) {
            console.log(`   ❌ Erro ao buscar amostras: ${sampleError.message}`);
            continue;
          }

          if (samples && samples.length > 0) {
            console.log(`   📋 Campos: ${Object.keys(samples[0]).join(', ')}`);

            // Analisar dados mockados
            const mockAnalysis = analyzeMockData(tableName, samples);
            if (mockAnalysis.length > 0) {
              console.log(`   🎭 Dados Mockados:`);
              mockAnalysis.forEach(mock => {
                console.log(`      - ${mock}`);
              });
            }

            // Mostrar primeiros registros
            console.log(`   📝 Primeiros registros:`);
            samples.forEach((record, index) => {
              const summary = createRecordSummary(tableName, record);
              console.log(`      ${index + 1}. ${summary}`);
            });
          }
        }
      } catch (error) {
        console.log(`   💥 Erro na análise: ${error.message}`);
      }
    }

    // 3. IDENTIFICAR PROBLEMAS E INCONSISTÊNCIAS
    console.log('\n3. PROBLEMAS E INCONSISTÊNCIAS IDENTIFICADOS');
    console.log('=============================================');

    await identifyInconsistencies(existingTables);

    // 4. RECOMENDAÇÕES
    console.log('\n4. RECOMENDAÇÕES');
    console.log('================');

    if (nonExistingTables.includes('quotes')) {
      console.log('⚠️  CRÍTICO: Tabela quotes não existe - sistema tentando usá-la');
      console.log('   🔧 Solução: Usar tabela quotes diretamente ou criar quotes');
    }

    if (nonExistingTables.includes('clients')) {
      console.log('⚠️  PROBLEMA: Tabela clients não existe - referências órfãs');
      console.log('   🔧 Solução: Criar tabela clients ou ajustar foreign keys');
    }

    console.log('\n📋 RESUMO EXECUTIVO');
    console.log('===================');
    console.log(`✅ Tabelas funcionais: ${existingTables.length}`);
    console.log(`❌ Tabelas faltando: ${nonExistingTables.length}`);
    console.log(`🎭 Sistema usando dados mockados para orçamentos`);
    console.log(`🔧 Necessário: Ajustar API para usar estrutura real do banco`);
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

function analyzeMockData(tableName, samples) {
  const mockIndicators = [];

  samples.forEach(record => {
    if (tableName === 'vehicles') {
      if (record.plate && record.plate.startsWith('ABC')) {
        mockIndicators.push(`Placa mockada: ${record.plate}`);
      }
    }

    if (tableName === 'quotes') {
      if (record.total_value === 0) {
        mockIndicators.push(`Valor zero: R$ ${record.total_value}`);
      }
    }

    if (record.id && record.id.includes('00000000-0000-0000')) {
      mockIndicators.push(`ID mockado: ${record.id}`);
    }

    // Verificar nomes/emails de teste
    Object.keys(record).forEach(key => {
      const value = record[key];
      if (typeof value === 'string') {
        if (value.includes('test') || value.includes('mock') || value.includes('fake')) {
          mockIndicators.push(`${key}: ${value}`);
        }
      }
    });
  });

  return [...new Set(mockIndicators)]; // Remove duplicatas
}

function createRecordSummary(tableName, record) {
  switch (tableName) {
    case 'vehicles':
      return `${record.plate} - ${record.brand} ${record.model} (${record.year})`;
    case 'quotes':
      return `${record.id.slice(0, 8)} - Status: ${record.status} - Valor: R$ ${record.total_value}`;
    case 'service_orders':
      return `${record.order_code || record.id.slice(0, 8)} - Status: ${record.status}`;
    case 'partners':
      return `${record.company_name || 'N/A'} - CNPJ: ${record.cnpj || 'N/A'}`;
    default:
      return `ID: ${record.id ? record.id.slice(0, 8) : 'N/A'}`;
  }
}

async function identifyInconsistencies(existingTables) {
  // Verificar relacionamentos órfãos
  if (existingTables.includes('quotes') && existingTables.includes('service_orders')) {
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, service_order_id, partner_id')
      .limit(5);

    if (quotes) {
      for (const quote of quotes) {
        // Verificar se service_order existe
        const { data: so } = await supabase
          .from('service_orders')
          .select('id')
          .eq('id', quote.service_order_id)
          .single();

        if (!so) {
          console.log(`⚠️  Quote ${quote.id.slice(0, 8)} referencia service_order inexistente`);
        }

        // Verificar se partner existe
        if (existingTables.includes('partners')) {
          const { data: partner } = await supabase
            .from('partners')
            .select('profile_id')
            .eq('profile_id', quote.partner_id)
            .single();

          if (!partner) {
            console.log(`⚠️  Quote ${quote.id.slice(0, 8)} referencia partner inexistente`);
          }
        }
      }
    }
  }

  // Verificar duplicação de conceitos
  const budgetTables = existingTables.filter(t => t.includes('budget'));
  if (budgetTables.length > 1) {
    console.log(`⚠️  Possível duplicação: ${budgetTables.join(', ')}`);
  }

  const quoteTables = existingTables.filter(t => t.includes('quote'));
  if (quoteTables.length > 1) {
    console.log(`⚠️  Possível duplicação: ${quoteTables.join(', ')}`);
  }
}

generateDatabaseReport();
