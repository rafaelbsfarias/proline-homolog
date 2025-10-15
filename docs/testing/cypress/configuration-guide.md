# 🧪 Configuração Completa do Cypress - ProLine Auto

## 📋 Visão Geral

Este documento descreve a configuração completa do Cypress para testes end-to-end (E2E) no projeto ProLine Auto. A configuração está otimizada para testes de aplicações Next.js com Supabase, incluindo autenticação, gerenciamento de estado e testes de API.

## 🏗️ Arquitetura da Configuração

### Estrutura de Arquivos
```
cypress/
├── config.mjs              # Configuração principal do Cypress
├── tsconfig.json           # Configuração TypeScript para Cypress
├── e2e/                    # Testes end-to-end
│   ├── admin/             # Testes específicos do admin
│   ├── client/            # Testes específicos do cliente
│   ├── partner/           # Testes específicos do parceiro
│   └── specialist/        # Testes específicos do especialista
├── support/               # Arquivos de suporte
│   ├── commands.ts        # Comandos personalizados
│   ├── e2e.ts            # Configuração global E2E
│   └── index.d.ts        # Definições de tipos
├── fixtures/              # Dados de teste mock
│   └── auth/             # Fixtures de autenticação
└── downloads/            # Arquivos baixados durante testes
screenshots/              # Screenshots de falhas
videos/                   # Vídeos dos testes
```

## ⚙️ Configuração Principal (`cypress.config.mjs`)

### Configurações Essenciais

```javascript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Ambiente base
    baseUrl: 'http://localhost:3000',

    // Padrão dos arquivos de teste
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',

    // Viewport padrão
    viewportWidth: 1280,
    viewportHeight: 720,

    // Configurações de segurança
    chromeWebSecurity: false,

    // Captura de mídia
    video: true,
    screenshotOnRunFailure: true,

    // Timeouts otimizados
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // Estratégia de retry
    retries: {
      runMode: 2,    // 2 retries em modo headless
      openMode: 0,   // 0 retries em modo interativo
    },
```

### Variáveis de Ambiente

```javascript
env: {
  // Endpoints da API
  apiUrl: 'http://localhost:3000/api',

  // Usuários de teste (NÃO usar senhas reais)
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
```

### Tasks Personalizadas (Node Events)

```javascript
setupNodeEvents(on, config) {
  on('task', {
    // Seed do banco de dados
    seedDatabase() {
      console.log('Seeding database for tests...');
      return null;
    },

    // Limpeza do banco
    clearDatabase() {
      console.log('Clearing database...');
      return null;
    },

    // Logging personalizado
    log(message) {
      console.log(message);
      return null;
    },

    // Verificação de aceite de contrato
    async checkClientContractAcceptance(clientId) {
      const { createClient } = await import('@supabase/supabase-js');
      const dotenv = await import('dotenv');
      const path = await import('path');

      dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceRoleKey =
        process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Erro: Variáveis de ambiente não configuradas');
        return null;
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      const { data, error } = await supabase
        .from('client_contract_acceptance')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao consultar contrato:', error);
        return null;
      }
      return data;
    },
  });

  return config;
},
```

### Configuração de Component Testing

```javascript
component: {
  devServer: {
    framework: 'next',
    bundler: 'webpack',
  },
  specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  supportFile: 'cypress/support/component.ts',
},
```

## 📁 Scripts no `package.json`

```json
{
  "scripts": {
    "cypress": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "cypress run",
    "test:e2e:dev": "cypress open"
  }
}
```

## 🔧 Arquivos de Suporte

### `cypress/support/e2e.ts`
```typescript
// Importa comandos personalizados
import './commands';
```

### `cypress/support/commands.ts`
```typescript
/// <reference types="cypress" />

// Comando de login personalizado
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Comando de logout personalizado
Cypress.Commands.add('logout', () => {
  cy.get('button, a').contains(/sair/i).click({ force: true });
});
```

### `cypress/support/index.d.ts`
```typescript
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Login personalizado
     */
    login(email: string, password: string): Chainable<void>;

    /**
     * Logout personalizado
     */
    logout(): Chainable<void>;
  }
}
```

## 📝 Estrutura dos Testes E2E

### Padrão de Organização
```
cypress/e2e/
├── admin/                 # Testes específicos do admin
│   ├── admin-login.cy.ts
│   └── admin-full-flow.cy.ts
├── client/                # Testes específicos do cliente
│   ├── client-login.cy.ts
│   └── client-dashboard.cy.ts
├── partner/               # Testes específicos do parceiro
│   ├── partner-login.cy.ts
│   └── partner-service-management.cy.ts
├── specialist/            # Testes específicos do especialista
│   └── specialist-login.cy.ts
├── signup.cy.ts          # Testes de cadastro
├── forgot-password.cy.ts # Testes de recuperação de senha
└── all-tests.cy.ts       # Suite completa de testes
```

### Exemplo de Teste (`admin-login.cy.ts`)

```typescript
describe('Admin Dashboard Tests', () => {
  let createdUserId: string;
  let authToken: string;

  beforeEach(() => {
    // Login automático antes de cada teste
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

    // Captura do token de autenticação
    cy.window().then(win => {
      const supabaseSessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );

      if (supabaseSessionKey) {
        const sessionValue = win.localStorage.getItem(supabaseSessionKey);
        if (sessionValue) {
          const sessionData = JSON.parse(sessionValue);
          authToken = sessionData.access_token;
        }
      }
    });
  });

  it('should display all admin dashboard components', () => {
    // Verificações dos componentes do dashboard
    cy.contains('Painel de Gestão ProLine').should('be.visible');
    cy.contains('Cadastros pendentes').should('be.visible');
    cy.contains('Usuários').should('be.visible');
    cy.contains('Veículos').should('be.visible');
  });

  it('should create and delete test user via API', () => {
    const testEmail = `testuser-${Date.now()}@example.com`;

    // Criação de usuário via API
    cy.request({
      method: 'POST',
      url: '/api/admin/create-user',
      body: {
        name: 'Test User',
        email: testEmail,
        role: 'client',
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      createdUserId = response.body.userId;
    });

    // Exclusão de usuário via API
    cy.request({
      method: 'POST',
      url: '/api/admin/remove-user',
      body: { userId: createdUserId },
      headers: { Authorization: `Bearer ${authToken}` },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });
  });
});
```

## 🔧 Configuração TypeScript (`cypress/tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"],
    "types": ["cypress", "node"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*"],
  "exclude": ["../node_modules"]
}
```

## 📦 Dependências Necessárias

### `package.json` - DevDependencies
```json
{
  "devDependencies": {
    "cypress": "^14.5.4",
    "@types/cypress": "^0.1.6",
    "eslint-plugin-cypress": "^5.1.0"
  }
}
```

## 🚀 Como Executar os Testes

### Modo Interativo (Desenvolvimento)
```bash
npm run cypress
# ou
npm run test:e2e:dev
```

### Modo Headless (CI/CD)
```bash
npm run cypress:run
# ou
npm run test:e2e
```

### Executar Teste Específico
```bash
npx cypress run --spec "cypress/e2e/admin/admin-login.cy.ts"
```

### Com Relatórios
```bash
npx cypress run --reporter spec --reporter-options output=results.txt
```

## 🔐 Configuração de Autenticação

### Variáveis de Ambiente Necessárias
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Estratégias de Autenticação nos Testes

1. **Login via UI** (Recomendado para fluxos completos)
```typescript
cy.login('admin@prolineauto.com.br', '123qwe');
```

2. **Login via API** (Para testes rápidos)
```typescript
cy.request('POST', '/api/auth/login', {
  email: 'admin@prolineauto.com.br',
  password: '123qwe'
}).then(response => {
  // Salvar token para requests subsequentes
  authToken = response.body.token;
});
```

3. **Sessão Persistente** (Para múltiplos testes)
```typescript
beforeEach(() => {
  cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);
  cy.saveLocalStorage(); // Salva sessão
});

afterEach(() => {
  cy.restoreLocalStorage(); // Restaura sessão
});
```

## 📊 Configuração de Relatórios

### Vídeos e Screenshots
- **Vídeos**: Salvos automaticamente em `cypress/videos/`
- **Screenshots**: Capturados em falhas em `cypress/screenshots/`
- **Configuração**: Controlada pelas flags `video` e `screenshotOnRunFailure`

### Relatórios Personalizados
```javascript
// cypress.config.mjs
export default defineConfig({
  reporter: 'spec', // ou 'junit', 'mocha', etc.
  reporterOptions: {
    output: 'cypress/results/results.xml'
  }
});
```

## 🔄 Estratégias de Teste

### Padrões Recomendados

1. **Page Object Pattern**
```typescript
class LoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  fillEmail(email: string) {
    cy.get('[data-cy=email]').type(email);
    return this;
  }

  fillPassword(password: string) {
    cy.get('[data-cy=password]').type(password);
    return this;
  }

  submit() {
    cy.get('[data-cy=submit]').click();
    return this;
  }

  login(email: string, password: string) {
    return this.visit()
      .fillEmail(email)
      .fillPassword(password)
      .submit();
  }
}
```

2. **Custom Commands**
```typescript
Cypress.Commands.add('createTestUser', (userData) => {
  return cy.request('POST', '/api/admin/create-user', userData);
});
```

3. **Fixtures para Dados de Teste**
```typescript
// cypress/fixtures/users.json
{
  "admin": {
    "email": "admin@test.com",
    "password": "password123",
    "role": "admin"
  },
  "client": {
    "email": "client@test.com",
    "password": "password123",
    "role": "client"
  }
}
```

## 🐛 Debugging e Troubleshooting

### Comandos Úteis para Debug
```typescript
// Pausar execução
cy.pause();

// Tirar screenshot
cy.screenshot('debug-point');

// Log personalizado
cy.log('Debug message');

// Verificar estado da aplicação
cy.window().then(win => {
  console.log('Window state:', win);
});
```

### Problemas Comuns

1. **Timeouts Excessivos**
   - Aumentar `defaultCommandTimeout`
   - Verificar se elementos estão sendo aguardados corretamente

2. **Flaky Tests**
   - Usar `cy.wait()` ou `cy.should()` para sincronização
   - Implementar retries com `retries: { runMode: 2 }`

3. **Problemas de CORS**
   - Configurar `chromeWebSecurity: false`
   - Verificar configurações do Supabase

## 📈 Melhores Práticas

### Organização de Testes
- ✅ Um teste por funcionalidade específica
- ✅ Nomes descritivos para testes e suites
- ✅ Uso de `data-cy` attributes para seletores
- ✅ Limpeza de dados após testes

### Performance
- ✅ Usar comandos customizados para reduzir duplicação
- ✅ Minimizar uso de `cy.wait()` fixo
- ✅ Paralelizar testes quando possível

### Manutenibilidade
- ✅ Page Objects para componentes complexos
- ✅ Fixtures para dados de teste
- ✅ Configurações centralizadas

## 🔗 Integração com CI/CD

### GitHub Actions Exemplo
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cypress-io/github-action@v5
        with:
          build: npm run build
          start: npm start
          wait-on: 'http://localhost:3000'
          record: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## 📚 Recursos Adicionais

- [Documentação Oficial Cypress](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Next.js with Cypress](https://nextjs.org/docs/testing#e2e-testing)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

---

**Nota**: Esta configuração está otimizada para aplicações Next.js com Supabase. Para outros frameworks, ajustes podem ser necessários na configuração do `devServer` e padrões de arquivo.</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/CYPRESS_CONFIGURATION_GUIDE.md
