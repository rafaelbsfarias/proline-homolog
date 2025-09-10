// scripts/db_scripts/diagnostic-orchestrator.js

import { DatabaseMonitor } from './diagnostic-monitor.js';
import { FlowSimulator } from './flow-simulator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// ORQUESTRADOR DE DIAGNÓSTICO COMPLETO
// =============================================================================

class DiagnosticOrchestrator {
  constructor() {
    this.monitor = new DatabaseMonitor();
    this.simulator = new FlowSimulator();
    this.reportFile = path.resolve(__dirname, 'diagnostic-report.json');
    this.results = {
      session: new Date().toISOString(),
      steps: [],
      findings: [],
      recommendations: [],
    };
  }

  // =============================================================================
  // DIAGNÓSTICO PASSO A PASSO
  // =============================================================================

  async runCompleteDiagnostic() {
    console.log('🔬 INICIANDO DIAGNÓSTICO COMPLETO DO FLUXO PROBLEMÁTICO');
    console.log('='.repeat(80));
    console.log('🎯 Objetivo: Mapear movimentação inesperada de dados no histórico de coletas');
    console.log('📋 Fluxo: Cliente define coleta → Admin propõe data → Cliente aceita');
    console.log('='.repeat(80));

    try {
      // PASSO 0: Estado Inicial
      console.log('\n📊 PASSO 0: CAPTURANDO ESTADO INICIAL');
      await this.monitor.captureSnapshot('BEFORE_ANY_ACTION');

      // PASSO 1: Cliente define coleta
      console.log('\n🚛 PASSO 1: CLIENTE DEFINE COLETA');
      const step1Result = await this.executeStep('ClienteDefineColeta', () =>
        this.simulator.step1_ClientDefinesCollection()
      );

      // PASSO 2: Admin propõe nova data
      console.log('\n👨‍💼 PASSO 2: ADMIN PROPÕE NOVA DATA');
      const step2Result = await this.executeStep('AdminPropoeData', () =>
        this.simulator.step2_AdminProposesDate()
      );

      // PASSO 3: Cliente aceita proposta
      console.log('\n✅ PASSO 3: CLIENTE ACEITA PROPOSTA');
      const step3Result = await this.executeStep('ClienteAceitaProposta', () =>
        this.simulator.step3_ClientAcceptsProposal()
      );

      // ANÁLISE FINAL
      console.log('\n🔍 ANÁLISE FINAL: COMPARANDO ESTADOS');
      await this.analyzeResults();

      // GERAR RELATÓRIO
      this.generateReport();
    } catch (error) {
      console.error('\n💥 ERRO CRÍTICO NO DIAGNÓSTICO:', error);
      this.results.findings.push({
        type: 'CRITICAL_ERROR',
        description: `Erro crítico durante diagnóstico: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      this.saveReport();
    }
  }

  async executeStep(stepName, stepFunction) {
    const stepStart = new Date();
    console.log(`\n▶️  EXECUTANDO: ${stepName}`);

    try {
      // Capturar estado antes do passo
      const beforeSnapshot = await this.monitor.captureSnapshot(`BEFORE_${stepName}`);

      // Executar o passo
      const result = await stepFunction();

      // Capturar estado depois do passo
      const afterSnapshot = await this.monitor.captureSnapshot(`AFTER_${stepName}`);

      // Comparar estados
      const changes = this.monitor.compareSnapshots(
        beforeSnapshot,
        afterSnapshot,
        `MUDANÇAS APÓS ${stepName}`
      );

      const stepResult = {
        name: stepName,
        startTime: stepStart.toISOString(),
        endTime: new Date().toISOString(),
        success: true,
        result: result,
        changes: changes,
        duration: new Date().getTime() - stepStart.getTime(),
      };

      this.results.steps.push(stepResult);

      console.log(`✅ ${stepName} concluído em ${stepResult.duration}ms`);
      return stepResult;
    } catch (error) {
      console.error(`❌ Erro em ${stepName}:`, error);

      const stepResult = {
        name: stepName,
        startTime: stepStart.toISOString(),
        endTime: new Date().toISOString(),
        success: false,
        error: error.message,
        duration: new Date().getTime() - stepStart.getTime(),
      };

      this.results.steps.push(stepResult);
      return stepResult;
    }
  }

  // =============================================================================
  // ANÁLISE DE RESULTADOS
  // =============================================================================

  async analyzeResults() {
    console.log('\n🔬 ANALISANDO RESULTADOS PARA IDENTIFICAR CAUSA RAIZ');

    const steps = this.results.steps;

    // 1. Verificar movimentação de veículos
    this.analyzeVehicleMovement(steps);

    // 2. Verificar mudanças no histórico
    this.analyzeHistoryMovement(steps);

    // 3. Verificar consistência de coletas
    this.analyzeCollectionConsistency(steps);

    // 4. Identificar padrões problemáticos
    this.identifyProblematicPatterns(steps);

    console.log('\n📊 ANÁLISE CONCLUÍDA');
  }

  analyzeVehicleMovement(steps) {
    console.log('\n🚗 ANALISANDO MOVIMENTAÇÃO DE VEÍCULOS');

    steps.forEach(step => {
      if (step.changes?.vehicles?.modified?.length > 0) {
        console.log(
          `📋 ${step.name}: ${step.changes.vehicles.modified.length} veículos modificados`
        );

        step.changes.vehicles.modified.forEach(mod => {
          console.log(`   Veículo ${mod.id}:`);
          mod.changes.forEach(change => {
            console.log(`     ${change.field}: ${change.before} → ${change.after}`);

            // Flag para mudanças suspeitas
            if (change.field === 'status' && change.after === 'FINALIZADO') {
              this.results.findings.push({
                type: 'VEHICLE_STATUS_CHANGE',
                step: step.name,
                vehicleId: mod.id,
                description: `Veículo movido para status FINALIZADO inesperadamente`,
                from: change.before,
                to: change.after,
                timestamp: step.endTime,
              });
            }
          });
        });
      }
    });
  }

  analyzeHistoryMovement(steps) {
    console.log('\n📚 ANALISANDO MOVIMENTAÇÃO DO HISTÓRICO');

    steps.forEach(step => {
      const historyChanges = step.changes?.history;

      if (historyChanges) {
        if (historyChanges.added.length > 0) {
          console.log(
            `➕ ${step.name}: ${historyChanges.added.length} registros adicionados ao histórico`
          );

          historyChanges.added.forEach(record => {
            console.log(`   Novo registro: ${record.id} - ${record.collection_date}`);

            this.results.findings.push({
              type: 'HISTORY_RECORD_ADDED',
              step: step.name,
              recordId: record.id,
              description: `Registro adicionado ao histórico durante ${step.name}`,
              data: record,
              timestamp: step.endTime,
            });
          });
        }

        if (historyChanges.removed.length > 0) {
          console.log(
            `➖ ${step.name}: ${historyChanges.removed.length} registros removidos do histórico`
          );

          historyChanges.removed.forEach(record => {
            console.log(`   Registro removido: ${record.id}`);

            this.results.findings.push({
              type: 'HISTORY_RECORD_REMOVED',
              step: step.name,
              recordId: record.id,
              description: `Registro removido do histórico durante ${step.name}`,
              data: record,
              timestamp: step.endTime,
            });
          });
        }
      }
    });
  }

  analyzeCollectionConsistency(steps) {
    console.log('\n📦 ANALISANDO CONSISTÊNCIA DAS COLETAS');

    // Verificar se há coletas duplicadas ou inconsistentes
    const allCollections = [];
    const allHistory = [];

    steps.forEach(step => {
      if (step.changes?.collections) {
        allCollections.push(...step.changes.collections.added);
        allCollections.push(...step.changes.collections.modified.map(m => m.after));
      }
      if (step.changes?.history) {
        allHistory.push(...step.changes.history.added);
        allHistory.push(...step.changes.history.modified.map(m => m.after));
      }
    });

    // Verificar duplicatas
    const collectionIds = allCollections.map(c => c.id).filter(Boolean);
    const uniqueCollectionIds = new Set(collectionIds);

    if (collectionIds.length !== uniqueCollectionIds.size) {
      console.log('⚠️  POSSÍVEIS COLETAS DUPLICADAS DETECTADAS');

      this.results.findings.push({
        type: 'DUPLICATE_COLLECTIONS',
        description: 'Foram detectadas coletas com IDs duplicados',
        total: collectionIds.length,
        unique: uniqueCollectionIds.size,
        timestamp: new Date().toISOString(),
      });
    }
  }

  identifyProblematicPatterns(steps) {
    console.log('\n🔍 IDENTIFICANDO PADRÕES PROBLEMÁTICOS');

    // Padrão 1: Veículos movidos para histórico prematuramente
    const prematureHistoryMoves = this.results.findings.filter(
      f => f.type === 'HISTORY_RECORD_ADDED' && f.step === 'ClienteAceitaProposta'
    );

    if (prematureHistoryMoves.length > 0) {
      console.log(
        '🚨 PADRÃO PROBLEMÁTICO: Veículos movidos para histórico imediatamente após aceite'
      );

      this.results.findings.push({
        type: 'PREMATURE_HISTORY_MOVE',
        description:
          'Veículos estão sendo movidos para o histórico imediatamente após o cliente aceitar a proposta, antes da coleta ser realmente finalizada',
        occurrences: prematureHistoryMoves.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Padrão 2: Status inconsistentes
    const statusChanges = this.results.findings.filter(f => f.type === 'VEHICLE_STATUS_CHANGE');

    if (statusChanges.length > 0) {
      console.log('🚨 PADRÃO PROBLEMÁTICO: Mudanças inesperadas de status');

      statusChanges.forEach(change => {
        console.log(`   ${change.vehicleId}: ${change.from} → ${change.after}`);
      });
    }
  }

  // =============================================================================
  // GERAÇÃO DE RELATÓRIO
  // =============================================================================

  generateReport() {
    console.log('\n📋 GERANDO RELATÓRIO DE DIAGNÓSTICO');

    // Análise de causa raiz
    this.identifyRootCause();

    // Recomendações
    this.generateRecommendations();

    console.log('\n✅ RELATÓRIO GERADO COM SUCESSO');
  }

  identifyRootCause() {
    console.log('\n🎯 IDENTIFICANDO CAUSA RAIZ');

    const findings = this.results.findings;

    // Análise baseada nos padrões encontrados
    if (findings.some(f => f.type === 'PREMATURE_HISTORY_MOVE')) {
      console.log('🔍 CAUSA RAIZ IDENTIFICADA: Movimentação prematura para histórico');
      console.log('   O sistema está movendo veículos para o histórico imediatamente');
      console.log('   após o aceite da proposta, em vez de aguardar a finalização real.');

      this.results.rootCause = {
        description: 'Movimentação prematura de veículos para o histórico',
        trigger: 'Aceite de proposta pelo cliente',
        expected: 'Veículos deveriam permanecer ativos até coleta finalizada',
        actual: 'Veículos movidos imediatamente para histórico',
        impact: 'Perda de controle sobre coletas ativas',
      };
    }

    if (findings.some(f => f.type === 'DUPLICATE_COLLECTIONS')) {
      console.log('🔍 CAUSA RAIZ ADICIONAL: Registros duplicados');
      console.log('   Sistema está criando múltiplas entradas para a mesma coleta.');

      this.results.duplicateIssue = {
        description: 'Criação de registros duplicados',
        impact: 'Dados inconsistentes e confusão no sistema',
      };
    }
  }

  generateRecommendations() {
    console.log('\n💡 GERANDO RECOMENDAÇÕES');

    this.results.recommendations = [];

    if (this.results.rootCause) {
      this.results.recommendations.push({
        priority: 'HIGH',
        action: 'Revisar lógica de movimentação para histórico',
        description:
          'Modificar o código para só mover veículos para histórico após coleta efetivamente finalizada',
        affectedFiles: ['collection-accept-proposal/route.ts', 'collection-approve/route.ts'],
        estimatedEffort: '2-3 dias',
      });

      this.results.recommendations.push({
        priority: 'MEDIUM',
        action: 'Implementar validações de estado',
        description:
          'Adicionar validações para garantir que veículos só sejam finalizados quando apropriado',
        affectedFiles: ['vehicle collection hooks', 'status management'],
        estimatedEffort: '1-2 dias',
      });
    }

    if (this.results.duplicateIssue) {
      this.results.recommendations.push({
        priority: 'MEDIUM',
        action: 'Implementar verificação de duplicatas',
        description: 'Adicionar lógica para prevenir criação de registros duplicados',
        affectedFiles: ['collection creation endpoints'],
        estimatedEffort: '1 dia',
      });
    }

    this.results.recommendations.push({
      priority: 'LOW',
      action: 'Adicionar testes de regressão',
      description: 'Criar testes automatizados para validar o fluxo completo',
      affectedFiles: ['cypress tests'],
      estimatedEffort: '2-3 dias',
    });

    console.log('✅ RECOMENDAÇÕES GERADAS');
  }

  saveReport() {
    try {
      fs.writeFileSync(this.reportFile, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Relatório salvo em: ${this.reportFile}`);

      // Resumo executivo
      console.log('\n📊 RESUMO EXECUTIVO:');
      console.log('='.repeat(50));
      console.log(`Sessão: ${this.results.session}`);
      console.log(`Passos executados: ${this.results.steps.length}`);
      console.log(`Problemas encontrados: ${this.results.findings.length}`);
      console.log(`Recomendações: ${this.results.recommendations.length}`);

      if (this.results.rootCause) {
        console.log('\n🎯 CAUSA RAIZ:');
        console.log(`   ${this.results.rootCause.description}`);
      }

      console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!');
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error);
    }
  }
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

async function runDiagnostic() {
  const orchestrator = new DiagnosticOrchestrator();
  await orchestrator.runCompleteDiagnostic();
}

async function resetAndDiagnose() {
  console.log('🔄 RESETANDO DADOS E EXECUTANDO DIAGNÓSTICO');

  const simulator = new FlowSimulator();
  await simulator.resetTestData();

  await runDiagnostic();
}

async function quickAnalysis() {
  console.log('⚡ ANÁLISE RÁPIDA - APENAS CAPTURA DE SNAPSHOTS');

  const monitor = new DatabaseMonitor();
  await monitor.captureSnapshot('QUICK_ANALYSIS');
  monitor.saveLog();

  console.log('✅ Análise rápida concluída');
}

// =============================================================================
// EXECUÇÃO PRINCIPAL
// =============================================================================

const command = process.argv[2];

switch (command) {
  case 'reset':
    console.log('🧹 Executando reset + diagnóstico completo');
    resetAndDiagnose();
    break;

  case 'quick':
    console.log('⚡ Executando análise rápida');
    quickAnalysis();
    break;

  case 'full':
  default:
    console.log('🔬 Executando diagnóstico completo');
    runDiagnostic();
    break;
}

// Execução padrão quando chamado diretamente
if (import.meta.url === `file://${process.argv[1]}` && !process.argv[2]) {
  runDiagnostic();
}

export { DiagnosticOrchestrator, runDiagnostic, resetAndDiagnose, quickAnalysis };
