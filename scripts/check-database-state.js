/**
 * Script de Verificação Completa do Estado do Banco de Dados
 * Testa collections, vehicles, history, triggers e gera relatório detalhado
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcmlwbnfnxdlglcinkho.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

console.log(`🔗 Conectando ao banco: ${SUPABASE_URL}`);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class DatabaseTester {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {},
      issues: [],
      recommendations: [],
    };
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES COMPLETOS DO BANCO DE DADOS');
    console.log('='.repeat(80));

    try {
      await this.testTableStructures();
      await this.testCollectionsState();
      await this.testVehiclesState();
      await this.testHistoryState();
      await this.testTriggersAndFunctions();
      await this.testAuditLogs();
      await this.testDataConsistency();
      await this.generateReport();

      console.log('\n✅ TODOS OS TESTES CONCLUÍDOS!');
      console.log('📄 Relatório salvo em: reports/database-test-report.json');
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NOS TESTES:', error);
      this.report.issues.push(`Erro crítico: ${error.message}`);
    }
  }

  async testTableStructures() {
    console.log('\n🔍 TESTANDO ESTRUTURAS DAS TABELAS');
    console.log('-'.repeat(50));

    const tables = [
      'vehicle_collections',
      'collection_history',
      'vehicles',
      'audit_logs',
      'profiles',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
          console.log(`❌ Tabela ${table}: ERRO - ${error.message}`);
          this.report.issues.push(`Tabela ${table} inacessível: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ERRO - ${err.message}`);
        this.report.issues.push(`Erro ao acessar tabela ${table}: ${err.message}`);
      }
    }
  }

  async testCollectionsState() {
    console.log('\n📦 ANALISANDO ESTADO DAS COLLECTIONS');
    console.log('-'.repeat(50));
    try {
      const { data: collections, error } = await supabase
        .from('vehicle_collections')
        .select(
          `
          id,
          status,
          collection_date,
          estimated_arrival_date,
          created_at,
          updated_at,
          client_id,
          vehicles!inner(id, plate, status)
        `
        )
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const total = collections?.length || 0;
      // initialize variables used later to avoid reference errors when total === 0
      let statusStats = {};
      let orphanedCollections = [];
      console.log(`📊 Total de collections: ${total}`);

      if (total > 0) {
        // Estatísticas por status
        statusStats = collections.reduce((acc, coll) => {
          acc[coll.status] = (acc[coll.status] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📈 Estatísticas por status:');
        Object.entries(statusStats).forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });

        // Verificar collections órfãs (sem veículos associados)
        orphanedCollections = collections.filter(
          coll => !coll.vehicles || coll.vehicles.length === 0
        );
        if (orphanedCollections.length > 0) {
          console.log(`\n⚠️  Collections órfãs encontradas: ${orphanedCollections.length}`);
          this.report.issues.push(
            `${orphanedCollections.length} collections sem veículos associados`
          );
          orphanedCollections.forEach(coll => {
            console.log(
              `   ID: ${coll.id.slice(0, 8)}... | Status: ${coll.status} | Data: ${coll.collection_date}`
            );
          });
        }

        // Últimas 5 collections atualizadas
        console.log('\n🕐 Últimas 5 collections atualizadas:');
        collections.slice(0, 5).forEach((coll, index) => {
          const vehicleCount = coll.vehicles?.length || 0;
          console.log(
            `   ${index + 1}. ${coll.collection_date} | ${coll.status} | ${vehicleCount} veículo(s) | ID: ${coll.id.slice(0, 8)}...`
          );
        });
      }

      this.report.details.collections = {
        total,
        statusStats,
        orphanedCount: orphanedCollections?.length || 0,
        recent: collections?.slice(0, 5) || [],
      };
    } catch (error) {
      console.log(`❌ Erro ao analisar collections: ${error.message}`);
      this.report.issues.push(`Erro na análise de collections: ${error.message}`);
    }
  }

  async testVehiclesState() {
    console.log('\n🚗 ANALISANDO ESTADO DOS VEÍCULOS');
    console.log('-'.repeat(50));
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(
          `
          id,
          plate,
          status,
          estimated_arrival_date,
          collection_id,
          created_at,
          vehicle_collections(id, status, collection_date)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = vehicles?.length || 0;
      // initialize variables used later to avoid reference errors when total === 0
      let statusStats = {};
      let vehiclesWithCollections = [];
      let vehiclesWithoutCollections = [];
      let dateChangeRequests = [];
      console.log(`📊 Total de veículos: ${total}`);

      if (total > 0) {
        // Estatísticas por status
        statusStats = vehicles.reduce((acc, veh) => {
          acc[veh.status] = (acc[veh.status] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📈 Estatísticas por status:');
        Object.entries(statusStats).forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });

        // Verificar veículos com collections
        vehiclesWithCollections = vehicles.filter(v => v.collection_id);
        vehiclesWithoutCollections = vehicles.filter(v => !v.collection_id);

        console.log(`\n🔗 Veículos com collections: ${vehiclesWithCollections.length}`);
        console.log(`🚫 Veículos sem collections: ${vehiclesWithoutCollections.length}`);

        // Verificar inconsistências de status
        const inconsistentVehicles = vehicles.filter(
          v =>
            v.collection_id &&
            v.vehicle_collections &&
            v.status !== 'AGUARDANDO APROVAÇÃO DA COLETA' &&
            v.vehicle_collections.status === 'requested'
        );

        if (inconsistentVehicles.length > 0) {
          console.log(`\n⚠️  Veículos com status inconsistente: ${inconsistentVehicles.length}`);
          this.report.issues.push(
            `${inconsistentVehicles.length} veículos com status inconsistente entre vehicle e collection`
          );
        }

        // Veículos com solicitação de mudança de data
        dateChangeRequests = vehicles.filter(v => v.status === 'SOLICITAÇÃO DE MUDANÇA DE DATA');
        if (dateChangeRequests.length > 0) {
          console.log(`\n📅 Solicitações de mudança de data: ${dateChangeRequests.length}`);
          dateChangeRequests.forEach(veh => {
            console.log(`   ${veh.plate}: ${veh.estimated_arrival_date}`);
          });
        }
      }

      this.report.details.vehicles = {
        total,
        statusStats,
        withCollections: vehiclesWithCollections?.length || 0,
        withoutCollections: vehiclesWithoutCollections?.length || 0,
        dateChangeRequests: dateChangeRequests?.length || 0,
      };
    } catch (error) {
      console.log(`❌ Erro ao analisar veículos: ${error.message}`);
      this.report.issues.push(`Erro na análise de veículos: ${error.message}`);
    }
  }

  async testHistoryState() {
    console.log('\n📚 ANALISANDO HISTÓRICO DE COLLECTIONS');
    console.log('-'.repeat(50));

    try {
      const { data: history, error } = await supabase
        .from('collection_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = history?.length || 0;
      console.log(`📊 Total de registros históricos: ${total}`);

      if (total > 0) {
        // Estatísticas gerais
        const totalRevenue = history.reduce((sum, h) => sum + (h.total_amount || 0), 0);
        const totalVehicles = history.reduce((sum, h) => sum + (h.vehicle_count || 0), 0);

        console.log(
          `💰 Receita total histórica: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        );
        console.log(`🚗 Total de veículos coletados: ${totalVehicles}`);

        const avgRevenue = total > 0 ? (totalRevenue / total).toFixed(2) : 0;
        const avgVehicles = total > 0 ? (totalVehicles / total).toFixed(1) : 0;

        console.log(`📈 Receita média por coleta: R$ ${avgRevenue}`);
        console.log(`📈 Média de veículos por coleta: ${avgVehicles}`);

        // Últimas 5 coletas finalizadas
        console.log('\n🕐 Últimas 5 coletas finalizadas:');
        history.slice(0, 5).forEach((hist, index) => {
          console.log(
            `   ${index + 1}. ${hist.collection_date} | ${hist.vehicle_count} veículos | R$ ${(hist.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          );
        });
      }

      this.report.details.history = {
        total,
        totalRevenue: totalRevenue || 0,
        totalVehicles: totalVehicles || 0,
        avgRevenue: avgRevenue || 0,
        avgVehicles: avgVehicles || 0,
        recent: history?.slice(0, 5) || [],
      };
    } catch (error) {
      console.log(`❌ Erro ao analisar histórico: ${error.message}`);
      this.report.issues.push(`Erro na análise do histórico: ${error.message}`);
    }
  }

  async testTriggersAndFunctions() {
    console.log('\n⚙️  VERIFICANDO TRIGGERS E FUNCTIONS');
    console.log('-'.repeat(50));

    // Nota: Esta parte seria mais completa com acesso direto ao PostgreSQL
    // Por enquanto, verificamos apenas se as funções existem via Supabase
    console.log(
      'ℹ️  Verificação limitada via Supabase - para análise completa use PostgreSQL direto'
    );

    this.report.details.triggers = {
      note: 'Verificação limitada via Supabase. Para análise completa, use PostgreSQL direto.',
      expectedTriggers: ['trigger_create_collection_history', 'trg_vehicle_collections_set_ts'],
    };
  }

  async testAuditLogs() {
    console.log('\n📋 VERIFICANDO AUDIT LOGS');
    console.log('-'.repeat(50));

    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.log(`❌ Erro ao acessar audit logs: ${error.message}`);
        this.report.issues.push(`Audit logs inacessíveis: ${error.message}`);
        return;
      }

      const total = logs?.length || 0;
      console.log(`📊 Total de logs recentes: ${total}`);

      if (total > 0) {
        console.log('\n🕐 Últimos 10 logs:');
        logs.forEach((log, index) => {
          console.log(
            `   ${index + 1}. [${log.timestamp}] ${log.action} ${log.resource_type}: ${log.details?.slice(0, 50)}...`
          );
        });
      } else {
        console.log('ℹ️  Nenhum log de auditoria encontrado');
        this.report.issues.push('Sistema de audit logs não está registrando atividades');
      }

      this.report.details.auditLogs = {
        total,
        recent: logs || [],
      };
    } catch (error) {
      console.log(`❌ Erro ao verificar audit logs: ${error.message}`);
      this.report.issues.push(`Erro nos audit logs: ${error.message}`);
    }
  }

  async testDataConsistency() {
    console.log('\n🔍 VERIFICANDO CONSISTÊNCIA DOS DADOS');
    console.log('-'.repeat(50));

    try {
      // Verificar se todos os veículos com collection_id têm uma collection válida
      const { data: vehiclesWithCollections, error: vehError } = await supabase
        .from('vehicles')
        .select('id, plate, collection_id')
        .not('collection_id', 'is', null);

      if (!vehError && vehiclesWithCollections) {
        const collectionIds = vehiclesWithCollections.map(v => v.collection_id);
        const { data: existingCollections, error: collError } = await supabase
          .from('vehicle_collections')
          .select('id')
          .in('id', collectionIds);

        if (!collError && existingCollections) {
          const existingIds = new Set(existingCollections.map(c => c.id));
          const orphanedVehicles = vehiclesWithCollections.filter(
            v => !existingIds.has(v.collection_id)
          );

          if (orphanedVehicles.length > 0) {
            console.log(`⚠️  Veículos órfãos (collection_id inválido): ${orphanedVehicles.length}`);
            this.report.issues.push(
              `${orphanedVehicles.length} veículos com collection_id inválido`
            );
            orphanedVehicles.forEach(v => {
              console.log(`   ${v.plate}: collection_id ${v.collection_id} não existe`);
            });
          } else {
            console.log('✅ Todos os veículos têm collections válidas');
          }
        }
      }

      // Verificar collections sem veículos
      const { data: allCollections, error: allCollError } = await supabase
        .from('vehicle_collections')
        .select('id, status, collection_date');

      if (!allCollError && allCollections) {
        const { data: allVehicles, error: allVehError } = await supabase
          .from('vehicles')
          .select('collection_id')
          .not('collection_id', 'is', null);

        if (!allVehError && allVehicles) {
          const usedCollectionIds = new Set(allVehicles.map(v => v.collection_id));
          const unusedCollections = allCollections.filter(c => !usedCollectionIds.has(c.id));

          if (unusedCollections.length > 0) {
            console.log(`ℹ️  Collections não utilizadas: ${unusedCollections.length}`);
            console.log('   (Isso pode ser normal para collections recém-criadas)');
          }
        }
      }
    } catch (error) {
      console.log(`❌ Erro na verificação de consistência: ${error.message}`);
      this.report.issues.push(`Erro na verificação de consistência: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📄 GERANDO RELATÓRIO FINAL');
    console.log('-'.repeat(50));

    // Calcular estatísticas gerais
    const summary = {
      totalCollections: this.report.details.collections?.total || 0,
      totalVehicles: this.report.details.vehicles?.total || 0,
      totalHistory: this.report.details.history?.total || 0,
      totalRevenue: this.report.details.history?.totalRevenue || 0,
      issuesCount: this.report.issues.length,
      orphanedCollections: this.report.details.collections?.orphanedCount || 0,
      dateChangeRequests: this.report.details.vehicles?.dateChangeRequests || 0,
    };

    this.report.summary = summary;

    // Gerar recomendações baseadas nos problemas encontrados
    if (summary.orphanedCollections > 0) {
      this.report.recommendations.push(
        'Limpar collections órfãs que não estão associadas a veículos'
      );
    }

    if (summary.issuesCount > 0) {
      this.report.recommendations.push('Revisar e corrigir os problemas identificados');
    }

    if (summary.dateChangeRequests > 0) {
      this.report.recommendations.push('Processar solicitações pendentes de mudança de data');
    }

    // Salvar relatório
    const reportPath = join(process.cwd(), 'reports', 'database-test-report.json');
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    // Exibir resumo no console
    console.log('\n📊 RESUMO EXECUTIVO:');
    console.log('='.repeat(50));
    console.log(`📦 Collections ativas: ${summary.totalCollections}`);
    console.log(`🚗 Total de veículos: ${summary.totalVehicles}`);
    console.log(`📚 Registros históricos: ${summary.totalHistory}`);
    console.log(
      `💰 Receita total: R$ ${summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    );
    console.log(`⚠️  Problemas identificados: ${summary.issuesCount}`);
    console.log(`🔗 Collections órfãs: ${summary.orphanedCollections}`);
    console.log(`📅 Solicitações de mudança: ${summary.dateChangeRequests}`);

    if (this.report.issues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
      this.report.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (this.report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      this.report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  }
}

// Executar testes
const tester = new DatabaseTester();
tester
  .runAllTests()
  .then(() => {
    console.log('\n🎉 TESTES FINALIZADOS COM SUCESSO!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 ERRO FATAL:', error);
    process.exit(1);
  });
