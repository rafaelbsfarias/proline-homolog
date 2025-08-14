// ========================================================================================
//       // TypeScript support is built-in in Cypress 10+
      // No need for custom preprocessorN - E2E TESTING SETUP
// ========================================================================================
// Configuração completa do Cypress para testes end-to-end
// ========================================================================================

import { defineConfig } from 'cypress';

export default defineConfig({
  // ========================================================================================
  // E2E CONFIGURATION
  // ========================================================================================
  e2e: {
    // Environment
    baseUrl: 'http://localhost:3000',

    // Test files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',

    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Browser
    chromeWebSecurity: false,

    // Videos and Screenshots
    video: true,
    screenshotOnRunFailure: true,

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // Retry
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Environment variables
    env: {
      // API endpoints
      apiUrl: 'http://localhost:3000/api',

      // Test users (não colocar senhas reais aqui)
      testAdmin: {
        email: 'admin@prolineauto.com.br',
        password: '123qwe',
      },
      testClient: {
        email: 'cliente@prolineauto.com.br',
        password: '123qwe',
      },
      testPartner: {
        email: 'partner@prolineauto.com.br',
        password: '123qwe',
      },
      testSpecialist: {
        email: 'specialist@prolineauto.com.br',
        password: '123qwe',
      },
    },

    setupNodeEvents(on, config) {
      // ========================================================================================
      // NODE EVENT LISTENERS
      // ========================================================================================

      // Task for seeding database
      on('task', {
        seedDatabase() {
          // Implementar seed do banco para testes
           
          console.log('Seeding database for tests...');
          return null;
        },

        clearDatabase() {
          // Implementar limpeza do banco
           
          console.log('Clearing database...');
          return null;
        },

        log(message) {
           
          console.log(message);
          return null;
        },

        // New task to check client contract acceptance in DB
        async checkClientContractAcceptance(clientId) {
          const { createClient } = await import('@supabase/supabase-js');
          const dotenv = await import('dotenv');
          const path = await import('path');

          dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceRoleKey =
            process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseServiceRoleKey) {
            console.error('Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas para a tarefa Cypress.');
            return null;
          }

          const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

          const { data, error } = await supabase
            .from('client_contract_acceptance')
            .select('*')
            .eq('client_id', clientId)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Erro ao consultar client_contract_acceptance:', error);
            return null;
          }
          return data;
        },
      });

      // TypeScript support is built-in in Cypress 10+
      // No additional preprocessor needed

      return config;
    },
  },

  // ========================================================================================
  // COMPONENT TESTING (se necessário no futuro)
  // ========================================================================================
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },

  // ========================================================================================
  // GLOBAL CONFIGURATION
  // ========================================================================================

  // Folders
  downloadsFolder: 'cypress/downloads',
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',

  // Reporter (para CI/CD)
  reporter: 'spec',

  // Experimental features
  experimentalStudio: true,
});
