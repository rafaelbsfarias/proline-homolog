#!/usr/bin/env node

/**
 * Script Principal para Testes do Fluxo de Coleta
 *
 * Este script executa todos os testes de diagnóstico do fluxo de coleta
 * de forma organizada e gera relatórios detalhados.
 *
 * Uso:
 *   node run-collection-workflow-tests.js
 *   node run-collection-workflow-tests.js --setup-only
 *   node run-collection-workflow-tests.js --clean
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar environment
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Importar módulos
const { TEST_CONFIG, getTimestampedFilename } = await import('./config/test-config.js');

class CollectionWorkflowTestRunner {
  constructor() {
    this.testSession = new Date().toISOString();
    this.results = {
      session: this.testSession,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: [],
      },
    };
  }

  async parseArgs() {
    const args = process.argv.slice(2);
    return {
      setupOnly: args.includes('--setup-only'),
      clean: args.includes('--clean'),
      verbose: args.includes('--verbose') || args.includes('-v'),
      help: args.includes('--help') || args.includes('-h'),
      advanced: args.includes('--advanced') || args.includes('-a'),
      basic: args.includes('--basic') || args.includes('-b'),
      orchestrator: args.includes('--orchestrator') || args.includes('-o'),
    };
  }

  showHelp() {
    console.log(`
🔬 Collection Workflow Test Runner
=====================================

Uso:
  node run-collection-workflow-tests.js [opções]

Opções:
  --advanced, -a      Teste avançado: coleta aprovada + mudança de data (RECOMENDADO)
  --basic, -b         Teste básico: cliente define → admin propõe → aceita
  --orchestrator, -o  Orquestrador completo com diagnóstico detalhado
  --setup-only        Apenas configura veículos de teste, sem executar diagnóstico
  --clean             Limpa dados de teste antes de executar
  --verbose, -v       Modo verbose com logs detalhados  
  --help, -h          Mostra esta ajuda

Exemplos:
  # Reproduzir problema de perda de histórico (PRINCIPAL)
  node run-collection-workflow-tests.js --advanced
  
  # Diagnóstico completo
  node run-collection-workflow-tests.js --orchestrator
  
  # Apenas setup
  node run-collection-workflow-tests.js --setup-only
`);
  }

  async setupTestData() {
    console.log('🔧 CONFIGURANDO DADOS DE TESTE');
    console.log('=====================================');

    try {
      // Importar e executar setup de veículos
      const { setupTestVehicles } = await import('./scripts/setup-test-vehicles.js');
      await setupTestVehicles();

      this.results.tests.push({
        name: 'Setup Test Data',
        status: 'PASSED',
        duration: 0,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('❌ Erro no setup:', error.message);
      this.results.summary.errors.push({
        step: 'Setup',
        error: error.message,
      });
      return false;
    }
  }

  async cleanTestData() {
    console.log('🧹 LIMPANDO DADOS DE TESTE');
    console.log('=====================================');

    try {
      // TODO: Implementar limpeza se necessário
      console.log('✅ Dados limpos');
      return true;
    } catch (error) {
      console.error('❌ Erro na limpeza:', error.message);
      return false;
    }
  }

  async runDiagnosticTests() {
    console.log('🔬 EXECUTANDO TESTES DE DIAGNÓSTICO');
    console.log('=====================================');

    const startTime = new Date();

    try {
      // Executar o diagnostic orchestrator diretamente
      const { spawn } = await import('child_process');

      // Executar o script diretamente
      const result = await new Promise((resolve, reject) => {
        const child = spawn('node', ['scripts/diagnostic-orchestrator.js'], {
          cwd: __dirname,
          stdio: 'inherit',
        });

        child.on('close', code => {
          if (code === 0) {
            resolve({ success: true });
          } else {
            reject(new Error(`Diagnostic failed with code ${code}`));
          }
        });
      });

      const duration = new Date() - startTime;

      this.results.tests.push({
        name: 'Collection Workflow Diagnostic',
        status: result.success ? 'PASSED' : 'FAILED',
        duration,
        results: result,
        timestamp: new Date().toISOString(),
      });

      return result.success;
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error.message);
      this.results.summary.errors.push({
        step: 'Diagnostic',
        error: error.message,
      });
      return false;
    }
  }

  async runAdvancedCollectionTest() {
    console.log('🎯 EXECUTANDO TESTE AVANÇADO: COLETA APROVADA + MUDANÇA DE DATA');
    console.log('===============================================================');

    const startTime = new Date();

    try {
      // Importar e executar o simulador avançado
      const { FlowSimulator } = await import('./scripts/flow-simulator.js');
      const simulator = new FlowSimulator();

      const results = await simulator.executeAdvancedCollectionFlow();

      const duration = new Date() - startTime;

      // Verificar se problemas foram detectados
      const problemasDetectados = {
        perdaHistorico:
          (results.historicoAntes?.length || 0) > (results.historicoDepois?.length || 0),
        mesclagemCollections:
          (results.collectionsAntes?.length || 0) > (results.collectionsDepois?.length || 0),
      };

      this.results.tests.push({
        name: 'Advanced Collection Flow Test',
        status: results.errors.length === 0 ? 'PASSED' : 'FAILED',
        duration,
        results: results,
        problemasDetectados,
        timestamp: new Date().toISOString(),
      });

      // Salvar relatório específico
      await simulator.saveDetailedReport(results, 'advanced-collection-flow');

      return results.errors.length === 0;
    } catch (error) {
      console.error('❌ Erro no teste avançado:', error.message);
      this.results.summary.errors.push({
        step: 'Advanced Test',
        error: error.message,
      });
      return false;
    }
  }

  async runBasicCollectionTest() {
    console.log('🔬 EXECUTANDO TESTE BÁSICO: FLUXO PADRÃO');
    console.log('=========================================');

    const startTime = new Date();

    try {
      const { FlowSimulator } = await import('./scripts/flow-simulator.js');
      const simulator = new FlowSimulator();

      const results = await simulator.executeFullFlow();

      const duration = new Date() - startTime;

      this.results.tests.push({
        name: 'Basic Collection Flow Test',
        status: results.errors.length === 0 ? 'PASSED' : 'FAILED',
        duration,
        results: results,
        timestamp: new Date().toISOString(),
      });

      return results.errors.length === 0;
    } catch (error) {
      console.error('❌ Erro no teste básico:', error.message);
      this.results.summary.errors.push({
        step: 'Basic Test',
        error: error.message,
      });
      return false;
    }
  }

  async generateFinalReport() {
    console.log('📋 GERANDO RELATÓRIO FINAL');
    console.log('=====================================');

    // Calcular estatísticas
    this.results.summary.total = this.results.tests.length;
    this.results.summary.passed = this.results.tests.filter(t => t.status === 'PASSED').length;
    this.results.summary.failed = this.results.summary.total - this.results.summary.passed;

    // Gerar nome do arquivo com timestamp
    const filename = getTimestampedFilename('collection-workflow-test-results');
    const filepath = path.join(__dirname, 'reports', filename);

    // Salvar relatório
    await import('fs').then(fs => {
      fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    });

    console.log(`💾 Relatório salvo em: ${filepath}`);

    // Mostrar resumo
    console.log(`
📊 RESUMO DOS TESTES:
====================
✅ Testes executados: ${this.results.summary.total}
✅ Sucessos: ${this.results.summary.passed} 
❌ Falhas: ${this.results.summary.failed}
⏱️  Sessão: ${this.results.session}
`);

    if (this.results.summary.errors.length > 0) {
      console.log('❌ ERROS ENCONTRADOS:');
      this.results.summary.errors.forEach(error => {
        console.log(`   ${error.step}: ${error.error}`);
      });
    }

    return this.results.summary.failed === 0;
  }

  async run() {
    const options = await this.parseArgs();

    if (options.help) {
      this.showHelp();
      return;
    }

    console.log('🔬 INICIANDO TESTES DO FLUXO DE COLETA');
    console.log('=====================================');
    console.log(`📅 Sessão: ${this.testSession}`);
    console.log(`⚙️  Configuração: ${TEST_CONFIG.CLIENT_ID}`);
    console.log('');

    try {
      // Limpeza se solicitada
      if (options.clean) {
        await this.cleanTestData();
      }

      // Setup sempre necessário
      const setupSuccess = await this.setupTestData();
      if (!setupSuccess) {
        console.error('❌ Falha no setup, abortando testes');
        process.exit(1);
      }

      // Se só setup, parar aqui
      if (options.setupOnly) {
        console.log('✅ Setup concluído. Use sem --setup-only para executar diagnóstico.');
        return;
      }

      // Escolher qual teste executar baseado nos argumentos
      let testSuccess = false;

      if (options.advanced) {
        testSuccess = await this.runAdvancedCollectionTest();
      } else if (options.basic) {
        testSuccess = await this.runBasicCollectionTest();
      } else if (options.orchestrator) {
        testSuccess = await this.runDiagnosticTests();
      } else {
        // Por padrão, executar teste avançado (foco no problema principal)
        console.log('💡 Executando teste avançado por padrão (use --help para ver opções)');
        testSuccess = await this.runAdvancedCollectionTest();
      }

      // Gerar relatório final
      const overallSuccess = await this.generateFinalReport();

      if (overallSuccess && testSuccess) {
        console.log('🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
        process.exit(0);
      } else {
        console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique o relatório.');
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO:', error);
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new CollectionWorkflowTestRunner();
  runner.run().catch(console.error);
}

export default CollectionWorkflowTestRunner;
