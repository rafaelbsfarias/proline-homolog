#!/usr/bin/env node

/**
 * Script Unificado de População do Banco
 *
 * Este script permite popular o banco de dados com diferentes conjuntos de dados
 * de forma organizada e controlada.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar environment
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const execScript = (scriptPath, cwd = __dirname) => {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      cwd,
      stdio: 'inherit',
    });

    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script failed with code ${code}`));
      }
    });
  });
};

class DatabasePopulator {
  constructor() {
    this.options = this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    return {
      users: args.includes('--users'),
      vehicles: args.includes('--vehicles'),
      testData: args.includes('--test-data'),
      all: args.includes('--all'),
      help: args.includes('--help') || args.includes('-h'),
      clean: args.includes('--clean'),
    };
  }

  showHelp() {
    console.log(`
🚀 Database Population Script
============================

Uso:
  node populate-database.js [opções]

Opções:
  --all         Popula com usuários + veículos (recomendado)
  --users       Apenas usuários (admin, client, partner, specialist)
  --vehicles    Apenas veículos de produção
  --test-data   Apenas dados de teste para collection workflow
  --clean       Limpa dados antes de popular
  --help, -h    Mostra esta ajuda

Exemplos:
  node populate-database.js --all
  node populate-database.js --users --vehicles
  node populate-database.js --test-data
  node populate-database.js --clean --all
`);
  }

  async cleanDatabase() {
    console.log('🧹 LIMPANDO BANCO DE DADOS');
    console.log('=========================');

    try {
      const cleanScript = path.join(__dirname, 'scripts/db_scripts/production/clean-test-data.js');
      await execScript(cleanScript);
      console.log('✅ Banco limpo com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar banco:', error.message);
      return false;
    }
  }

  async populateUsers() {
    console.log('👥 CRIANDO USUÁRIOS');
    console.log('==================');

    try {
      const userScript = path.join(__dirname, 'tests/user-management/create_all_users.js');
      await execScript(userScript);
      console.log('✅ Usuários criados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar usuários:', error.message);
      return false;
    }
  }

  async populateVehicles() {
    console.log('🚗 GERANDO VEÍCULOS');
    console.log('==================');

    try {
      const vehicleScript = path.join(
        __dirname,
        'scripts/db_scripts/production/generate_vehicles.js'
      );
      await execScript(vehicleScript);
      console.log('✅ Veículos gerados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao gerar veículos:', error.message);
      return false;
    }
  }

  async populateTestData() {
    console.log('🧪 CONFIGURANDO DADOS DE TESTE');
    console.log('==============================');

    try {
      const testScript = path.join(
        __dirname,
        'tests/collection-workflow/scripts/setup-test-vehicles.js'
      );
      await execScript(testScript);
      console.log('✅ Dados de teste configurados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao configurar dados de teste:', error.message);
      return false;
    }
  }

  async run() {
    if (this.options.help) {
      this.showHelp();
      return;
    }

    console.log('🗄️ INICIANDO POPULAÇÃO DO BANCO DE DADOS');
    console.log('=========================================');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('');

    let success = true;

    try {
      // Limpeza se solicitada
      if (this.options.clean) {
        success = (await this.cleanDatabase()) && success;
        console.log('');
      }

      // Executar ações baseadas nas opções
      if (this.options.all) {
        success = (await this.populateUsers()) && success;
        console.log('');
        success = (await this.populateVehicles()) && success;
      } else {
        if (this.options.users) {
          success = (await this.populateUsers()) && success;
          console.log('');
        }

        if (this.options.vehicles) {
          success = (await this.populateVehicles()) && success;
          console.log('');
        }

        if (this.options.testData) {
          success = (await this.populateTestData()) && success;
          console.log('');
        }
      }

      // Resumo final
      console.log('📊 RESUMO DA POPULAÇÃO');
      console.log('=====================');

      if (success) {
        console.log('🎉 POPULAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('✅ Banco de dados populado e pronto para uso');
        process.exit(0);
      } else {
        console.log('⚠️ ALGUNS PROBLEMAS ENCONTRADOS');
        console.log('❌ Verifique os logs acima para detalhes');
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO durante população:', error);
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const populator = new DatabasePopulator();
  populator.run().catch(console.error);
}

export default DatabasePopulator;
