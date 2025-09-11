/**
 * Script de Verificação Completa do Estado do Banco de Dados
 * Testa collections, vehicles, history, triggers e gera relatório detalhado
 * Versão PostgreSQL Direto (Corrigida)
 */

import pkg from 'pg';
const { Client } = pkg;
import { writeFileSync } from 'fs';
import { join } from 'path';

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
};

class DatabaseTester {
  constructor() {
    this.client = new Client(DB_CONFIG);
    this.report = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {},
      issues: [],
      recommendations: [],
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Conectado ao PostgreSQL');
    } catch (error) {
      console.error('❌ Erro ao conectar:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Conexão fechada');
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES COMPLETOS DO BANCO DE DADOS');
    console.log('='.repeat(80));

    try {
      await this.connect();

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
    } finally {
      await this.disconnect();
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
        const result = await this.client.query(`SELECT COUNT(*) as count FROM ${table} LIMIT 1`);
        console.log(`✅ Tabela ${table}: OK (${result.rows[0].count} registros)`);
      } catch (error) {
        console.log(`❌ Tabela ${table}: ERRO - ${error.message}`);
        this.report.issues.push(`Tabela ${table} inacessível: ${error.message}`);
      }
    }
  }

  async testCollectionsState() {
    console.log('\n📦 ANALISANDO ESTADO DAS COLLECTIONS');
    console.log('-'.repeat(50));

    let collections = [];
    let statusStats = {};
    let orphanedCollections = [];

    try {
      const result = await this.client.query(`
        SELECT
          vc.id,
          vc.status,
          vc.collection_date,
          vc.created_at,
          vc.updated_at,
          COUNT(v.id) as vehicle_count
        FROM vehicle_collections vc
        LEFT JOIN vehicles v ON vc.id = v.collection_id
        GROUP BY vc.id, vc.status, vc.collection_date, vc.created_at, vc.updated_at
        ORDER BY vc.updated_at DESC
      `);

      collections = result.rows;
      const total = collections.length;
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
        orphanedCollections = collections.filter(coll => parseInt(coll.vehicle_count) === 0);
        if (orphanedCollections.length > 0) {
          console.log(`\n⚠️  Collections órfãs encontradas: ${orphanedCollections.length}`);
          this.report.issues.push(
            `${orphanedCollections.length} collections sem veículos associados`
          );
          orphanedCollections.slice(0, 3).forEach(coll => {
            console.log(
              `   ID: ${coll.id.slice(0, 8)}... | Status: ${coll.status} | Data: ${coll.collection_date}`
            );
          });
        }

        // Últimas 5 collections atualizadas
        console.log('\n🕐 Últimas 5 collections atualizadas:');
        collections.slice(0, 5).forEach((coll, index) => {
          console.log(
            `   ${index + 1}. ${coll.collection_date} | ${coll.status} | ${coll.vehicle_count} veículo(s) | ID: ${coll.id.slice(0, 8)}...`
          );
        });
      }
    } catch (error) {
      console.log(`❌ Erro ao analisar collections: ${error.message}`);
      this.report.issues.push(`Erro na análise de collections: ${error.message}`);
    }

    this.report.details.collections = {
      total: collections.length,
      statusStats,
      orphanedCount: orphanedCollections.length,
      recent: collections.slice(0, 5),
    };
  }

  async testVehiclesState() {
    console.log('\n🚗 ANALISANDO ESTADO DOS VEÍCULOS');
    console.log('-'.repeat(50));

    let vehicles = [];
    let statusStats = {};
    let vehiclesWithCollections = [];
    let vehiclesWithoutCollections = [];
    let dateChangeRequests = [];

    try {
      const result = await this.client.query(`
        SELECT
          v.id,
          v.plate,
          v.status,
          v.estimated_arrival_date,
          v.collection_id,
          v.created_at,
          vc.status as collection_status,
          vc.collection_date
        FROM vehicles v
        LEFT JOIN vehicle_collections vc ON v.collection_id = vc.id
        ORDER BY v.created_at DESC
      `);

      vehicles = result.rows;
      const total = vehicles.length;
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
            v.collection_status === 'requested' &&
            v.status !== 'AGUARDANDO APROVAÇÃO DA COLETA' &&
            v.status !== 'SOLICITAÇÃO DE MUDANÇA DE DATA'
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
    } catch (error) {
      console.log(`❌ Erro ao analisar veículos: ${error.message}`);
      this.report.issues.push(`Erro na análise de veículos: ${error.message}`);
    }

    this.report.details.vehicles = {
      total: vehicles.length,
      statusStats,
      withCollections: vehiclesWithCollections.length,
      withoutCollections: vehiclesWithoutCollections.length,
      dateChangeRequests: dateChangeRequests.length,
    };
  }

  async testHistoryState() {
    console.log('\n📚 ANALISANDO HISTÓRICO DE COLLECTIONS');
    console.log('-'.repeat(50));

    let history = [];
    let totalRevenue = 0;
    let totalVehicles = 0;
    let avgRevenue = 0;
    let avgVehicles = 0;

    try {
      const result = await this.client.query(`
        SELECT * FROM collection_history
        ORDER BY created_at DESC
      `);

      history = result.rows;
      const total = history.length;
      console.log(`📊 Total de registros históricos: ${total}`);

      if (total > 0) {
        // Estatísticas gerais
        totalRevenue = history.reduce((sum, h) => sum + (parseFloat(h.total_amount) || 0), 0);
        totalVehicles = history.reduce((sum, h) => sum + (parseInt(h.vehicle_count) || 0), 0);

        console.log(
          `💰 Receita total histórica: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        );
        console.log(`🚗 Total de veículos coletados: ${totalVehicles}`);

        avgRevenue = total > 0 ? (totalRevenue / total).toFixed(2) : 0;
        avgVehicles = total > 0 ? (totalVehicles / total).toFixed(1) : 0;

        console.log(`📈 Receita média por coleta: R$ ${avgRevenue}`);
        console.log(`📈 Média de veículos por coleta: ${avgVehicles}`);

        // Últimas 5 coletas finalizadas
        console.log('\n🕐 Últimas 5 coletas finalizadas:');
        history.slice(0, 5).forEach((hist, index) => {
          console.log(
            `   ${index + 1}. ${hist.collection_date} | ${hist.vehicle_count} veículos | R$ ${(parseFloat(hist.total_amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          );
        });
      }
    } catch (error) {
      console.log(`❌ Erro ao analisar histórico: ${error.message}`);
      this.report.issues.push(`Erro na análise do histórico: ${error.message}`);
    }

    this.report.details.history = {
      total: history.length,
      totalRevenue,
      totalVehicles,
      avgRevenue,
      avgVehicles,
      recent: history.slice(0, 5),
    };
  }

  async testTriggersAndFunctions() {
    console.log('\n⚙️  VERIFICANDO TRIGGERS E FUNCTIONS');
    console.log('-'.repeat(50));

    try {
      // Verificar triggers
      const triggersResult = await this.client.query(`
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers
        ORDER BY event_object_table
      `);

      const triggers = triggersResult.rows;
      console.log(`📊 Total de triggers encontrados: ${triggers.length}`);

      if (triggers.length > 0) {
        console.log('\n🔧 Triggers ativos:');
        triggers.forEach(trigger => {
          console.log(
            `   ${trigger.trigger_name}: ${trigger.event_manipulation} on ${trigger.event_object_table}`
          );
        });
      }

      // Verificar functions
      const functionsResult = await this.client.query(`
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
        ORDER BY routine_name
      `);

      const functions = functionsResult.rows;
      console.log(`\n🔧 Total de functions encontradas: ${functions.length}`);

      if (functions.length > 0) {
        console.log('\nFunctions disponíveis:');
        functions.slice(0, 5).forEach(func => {
          console.log(`   ${func.routine_name}`);
        });
        if (functions.length > 5) {
          console.log(`   ... e mais ${functions.length - 5} functions`);
        }
      }

      this.report.details.triggers = {
        total: triggers.length,
        list: triggers,
        functions: functions.length,
      };
    } catch (error) {
      console.log(`❌ Erro ao verificar triggers: ${error.message}`);
      this.report.issues.push(`Erro na verificação de triggers: ${error.message}`);
    }
  }

  async testAuditLogs() {
    console.log('\n📋 VERIFICANDO AUDIT LOGS');
    console.log('-'.repeat(50));

    try {
      const result = await this.client.query(`
        SELECT timestamp, action, resource_type, details
        FROM audit_logs
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      const logs = result.rows;
      const total = logs.length;
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
        recent: logs,
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
      const orphanedResult = await this.client.query(`
        SELECT v.plate, v.collection_id
        FROM vehicles v
        LEFT JOIN vehicle_collections vc ON v.collection_id = vc.id
        WHERE v.collection_id IS NOT NULL AND vc.id IS NULL
      `);

      const orphanedVehicles = orphanedResult.rows;

      if (orphanedVehicles.length > 0) {
        console.log(`⚠️  Veículos órfãos (collection_id inválido): ${orphanedVehicles.length}`);
        this.report.issues.push(`${orphanedVehicles.length} veículos com collection_id inválido`);
        orphanedVehicles.forEach(v => {
          console.log(`   ${v.plate}: collection_id ${v.collection_id} não existe`);
        });
      } else {
        console.log('✅ Todos os veículos têm collections válidas');
      }

      // Verificar collections sem veículos
      const unusedResult = await this.client.query(`
        SELECT vc.id, vc.status, vc.collection_date
        FROM vehicle_collections vc
        LEFT JOIN vehicles v ON vc.id = v.collection_id
        WHERE v.collection_id IS NULL
      `);

      const unusedCollections = unusedResult.rows;

      if (unusedCollections.length > 0) {
        console.log(`ℹ️  Collections não utilizadas: ${unusedCollections.length}`);
        console.log('   (Isso pode ser normal para collections recém-criadas)');
      }

      // Verificar dados específicos da mudança de data
      const dateChangeResult = await this.client.query(`
        SELECT plate, status, estimated_arrival_date, collection_id
        FROM vehicles
        WHERE status = 'SOLICITAÇÃO DE MUDANÇA DE DATA'
      `);

      const dateChangeVehicles = dateChangeResult.rows;

      if (dateChangeVehicles.length > 0) {
        console.log(
          `\n📅 Veículos com solicitação de mudança de data: ${dateChangeVehicles.length}`
        );
        dateChangeVehicles.forEach(v => {
          console.log(
            `   ${v.plate}: ${v.estimated_arrival_date} (Collection: ${v.collection_id?.slice(0, 8)}...)`
          );
        });
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
