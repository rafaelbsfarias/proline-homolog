// scripts/db_scripts/run-diagnostics.js

import { runDiagnostic, resetAndDiagnose, quickAnalysis } from './diagnostic-orchestrator.js';
import { simulateProblematicFlow } from './flow-simulator.js';
import { DatabaseMonitor } from './diagnostic-monitor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// MENU INTERATIVO DE DIAGNÓSTICO
// =============================================================================

class DiagnosticRunner {
  constructor() {
    this.monitor = new DatabaseMonitor();
  }

  showMenu() {
    console.log('\n🔬 DIAGNÓSTICO DE FLUXO PROBLEMÁTICO - MENU INTERATIVO');
    console.log('='.repeat(70));
    console.log('🎯 Objetivo: Mapear movimentação inesperada no histórico de coletas');
    console.log('📋 Fluxo problemático: Cliente → Admin → Cliente (aceita)');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 OPÇÕES DISPONÍVEIS:');
    console.log('');
    console.log('1️⃣  DIAGNÓSTICO COMPLETO');
    console.log('   - Executa fluxo completo passo a passo');
    console.log('   - Monitora todas as mudanças no banco');
    console.log('   - Gera relatório detalhado');
    console.log('');
    console.log('2️⃣  RESET + DIAGNÓSTICO');
    console.log('   - Limpa dados de teste');
    console.log('   - Executa diagnóstico completo');
    console.log('');
    console.log('3️⃣  SIMULAÇÃO RÁPIDA');
    console.log('   - Apenas executa o fluxo sem monitoramento detalhado');
    console.log('');
    console.log('4️⃣  ANÁLISE DE SNAPSHOTS');
    console.log('   - Captura estado atual do banco');
    console.log('   - Compara com snapshots anteriores');
    console.log('');
    console.log('5️⃣  VER RELATÓRIOS');
    console.log('   - Lista relatórios disponíveis');
    console.log('   - Mostra resumo dos achados');
    console.log('');
    console.log('6️⃣  LIMPAR DADOS');
    console.log('   - Remove dados de teste');
    console.log('   - Mantém apenas usuários principais');
    console.log('');
    console.log('0️⃣  SAIR');
    console.log('');
    console.log('='.repeat(70));
  }

  async run() {
    while (true) {
      this.showMenu();

      const choice = await this.getUserInput('Escolha uma opção (0-6): ');

      try {
        switch (choice) {
          case '1':
            await this.runCompleteDiagnostic();
            break;

          case '2':
            await this.runResetAndDiagnostic();
            break;

          case '3':
            await this.runQuickSimulation();
            break;

          case '4':
            await this.runSnapshotAnalysis();
            break;

          case '5':
            await this.showReports();
            break;

          case '6':
            await this.cleanTestData();
            break;

          case '0':
            console.log('👋 Até logo!');
            return;

          default:
            console.log('❌ Opção inválida. Tente novamente.');
        }
      } catch (error) {
        console.error('❌ Erro na execução:', error.message);
      }

      console.log('\n⏳ Pressione Enter para continuar...');
      await this.getUserInput('');
    }
  }

  async runCompleteDiagnostic() {
    console.log('\n🔬 EXECUTANDO DIAGNÓSTICO COMPLETO...');
    console.log('⏱️  Esta operação pode levar alguns minutos...');

    const startTime = Date.now();
    await runDiagnostic();
    const duration = Date.now() - startTime;

    console.log(`\n✅ Diagnóstico concluído em ${Math.round(duration / 1000)}s`);
  }

  async runResetAndDiagnostic() {
    console.log('\n🔄 EXECUTANDO RESET + DIAGNÓSTICO...');
    console.log('⏱️  Esta operação pode levar alguns minutos...');

    const startTime = Date.now();
    await resetAndDiagnose();
    const duration = Date.now() - startTime;

    console.log(`\n✅ Reset + Diagnóstico concluído em ${Math.round(duration / 1000)}s`);
  }

  async runQuickSimulation() {
    console.log('\n⚡ EXECUTANDO SIMULAÇÃO RÁPIDA...');

    const startTime = Date.now();
    await simulateProblematicFlow();
    const duration = Date.now() - startTime;

    console.log(`\n✅ Simulação concluída em ${Math.round(duration / 1000)}s`);
  }

  async runSnapshotAnalysis() {
    console.log('\n📸 EXECUTANDO ANÁLISE DE SNAPSHOTS...');

    // Capturar snapshot atual
    await this.monitor.captureSnapshot('MANUAL_ANALYSIS');

    // Carregar snapshots anteriores
    const logData = this.monitor.loadLog();

    if (logData && logData.snapshots.length > 1) {
      console.log('\n📊 SNAPSHOTS DISPONÍVEIS:');
      logData.snapshots.forEach((snapshot, index) => {
        console.log(`${index + 1}. ${snapshot.label} - ${snapshot.timestamp}`);
      });

      const choice1 = await this.getUserInput(
        '\nEscolha o primeiro snapshot para comparar (número): '
      );
      const choice2 = await this.getUserInput(
        'Escolha o segundo snapshot para comparar (número): '
      );

      const idx1 = parseInt(choice1) - 1;
      const idx2 = parseInt(choice2) - 1;

      if (
        idx1 >= 0 &&
        idx1 < logData.snapshots.length &&
        idx2 >= 0 &&
        idx2 < logData.snapshots.length
      ) {
        this.monitor.compareSnapshots(
          logData.snapshots[idx1],
          logData.snapshots[idx2],
          `COMPARAÇÃO MANUAL: ${logData.snapshots[idx1].label} vs ${logData.snapshots[idx2].label}`
        );
      } else {
        console.log('❌ Índices inválidos');
      }
    } else {
      console.log('⚠️  Não há snapshots suficientes para comparação');
    }

    this.monitor.saveLog();
  }

  async showReports() {
    console.log('\n📋 RELATÓRIOS DISPONÍVEIS:');

    const reportsDir = __dirname;
    const reportFiles = fs
      .readdirSync(reportsDir)
      .filter(file => file.includes('diagnostic') && file.endsWith('.json'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(reportsDir, a));
        const statB = fs.statSync(path.join(reportsDir, b));
        return statB.mtime - statA.mtime; // Mais recente primeiro
      });

    if (reportFiles.length === 0) {
      console.log('❌ Nenhum relatório encontrado');
      return;
    }

    reportFiles.forEach((file, index) => {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`${index + 1}. ${file}`);
      console.log(`   📅 ${stats.mtime.toLocaleString()}`);
      console.log(`   📏 ${(stats.size / 1024).toFixed(1)} KB`);
    });

    const choice = await this.getUserInput(
      '\nEscolha um relatório para visualizar (número ou 0 para voltar): '
    );

    if (choice !== '0' && choice !== '') {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < reportFiles.length) {
        const filePath = path.join(reportsDir, reportFiles[index]);
        await this.showReportSummary(filePath);
      }
    }
  }

  async showReportSummary(filePath) {
    try {
      const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      console.log('\n📊 RESUMO DO RELATÓRIO:');
      console.log('='.repeat(50));
      console.log(`Sessão: ${report.session}`);
      console.log(`Passos executados: ${report.steps?.length || 0}`);
      console.log(`Problemas encontrados: ${report.findings?.length || 0}`);
      console.log(`Recomendações: ${report.recommendations?.length || 0}`);

      if (report.rootCause) {
        console.log('\n🎯 CAUSA RAIZ IDENTIFICADA:');
        console.log(`   ${report.rootCause.description}`);
        console.log(`   Trigger: ${report.rootCause.trigger}`);
        console.log(`   Impacto: ${report.rootCause.impact}`);
      }

      if (report.recommendations && report.recommendations.length > 0) {
        console.log('\n💡 RECOMENDAÇÕES PRINCIPAIS:');
        report.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.action}`);
          console.log(`   ${rec.description}`);
        });
      }

      const showDetails = await this.getUserInput('\nMostrar detalhes completos? (s/n): ');
      if (showDetails.toLowerCase() === 's') {
        console.log('\n📋 DETALHES COMPLETOS:');
        console.log(JSON.stringify(report, null, 2));
      }
    } catch (error) {
      console.error('❌ Erro ao ler relatório:', error);
    }
  }

  async cleanTestData() {
    console.log('\n🧹 LIMPANDO DADOS DE TESTE...');

    const confirm = await this.getUserInput(
      '⚠️  Isso removerá todos os dados de teste. Confirmar? (s/n): '
    );

    if (confirm.toLowerCase() === 's') {
      const { FlowSimulator } = await import('./flow-simulator.js');
      const simulator = new FlowSimulator();

      await simulator.resetTestData();
      console.log('✅ Dados de teste limpos com sucesso');
    } else {
      console.log('❌ Operação cancelada');
    }
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  async getUserInput(prompt) {
    return new Promise(resolve => {
      process.stdout.write(prompt);
      process.stdin.once('data', data => {
        resolve(data.toString().trim());
      });
    });
  }
}

// =============================================================================
// EXECUÇÃO PRINCIPAL
// =============================================================================

async function main() {
  const runner = new DiagnosticRunner();

  console.log('🚀 DIAGNÓSTICO INTERATIVO INICIADO');
  console.log('💡 Use as opções do menu para executar diferentes tipos de diagnóstico');
  console.log('🔍 O objetivo é mapear a causa da movimentação inesperada no histórico');

  try {
    await runner.run();
  } catch (error) {
    console.error('💥 Erro crítico:', error);
  } finally {
    process.exit(0);
  }
}

// Execução quando chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DiagnosticRunner };
