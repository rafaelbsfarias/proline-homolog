# 🧪 Cypress E2E Testing - ProLine Auto

Este diretório contém toda a configuração e testes end-to-end (E2E) do projeto ProLine Auto usando
Cypress.

## 📁 Estrutura do Diretório

```
cypress/
├── config.mjs              # ⚙️  Configuração principal do Cypress
├── tsconfig.json           # 🔧 Configuração TypeScript
├── e2e/                    # 🧪 Testes end-to-end
│   ├── admin/             # 👨‍💼 Testes específicos do admin
│   │   ├── admin-login.cy.ts
│   │   └── admin-full-flow.cy.ts
│   ├── client/            # 👤 Testes específicos do cliente
│   │   ├── client-login.cy.ts
│   │   └── client-dashboard.cy.ts
│   ├── partner/           # 🤝 Testes específicos do parceiro
│   │   ├── partner-login.cy.ts
│   │   └── partner-service-management.cy.ts
│   ├── specialist/        # 🔧 Testes específicos do especialista
│   │   └── specialist-login.cy.ts
│   ├── signup.cy.ts       # 📝 Testes de cadastro
│   ├── forgot-password.cy.ts # 🔑 Testes de recuperação de senha
│   └── all-tests.cy.ts    # 🎯 Suite completa de testes
├── support/               # 🛠️ Arquivos de suporte
│   ├── commands.ts        # 🎮 Comandos personalizados
│   ├── e2e.ts            # 🌐 Configuração global E2E
│   └── index.d.ts        # 📝 Definições de tipos TypeScript
├── fixtures/              # 📦 Dados de teste mock
│   └── auth/             # 🔐 Fixtures de autenticação
│       └── reset-password-success.json
├── downloads/            # 💾 Arquivos baixados durante testes
├── screenshots/          # 📸 Screenshots de falhas
└── videos/               # 🎥 Vídeos dos testes
```

## 🚀 Como Executar

### Modo Interativo (Desenvolvimento)

```bash
# Abrir interface do Cypress
npm run cypress

# Ou
npm run test:e2e:dev
```

### Modo Headless (CI/CD)

```bash
# Executar todos os testes
npm run test:e2e

# Executar teste específico
npx cypress run --spec "cypress/e2e/admin/admin-login.cy.ts"

# Executar com relatório
npx cypress run --reporter spec
```

## ⚙️ Configuração

### Arquivo Principal: `config.mjs`

- **Base URL**: `http://localhost:3000`
- **Timeouts**: Otimizados para aplicação Next.js
- **Browser**: Chrome com segurança desabilitada
- **Vídeos/Screenshots**: Habilitados automaticamente
- **Retries**: 2 tentativas em modo headless

### Variáveis de Ambiente

```javascript
// Usuários de teste configurados
testAdmin: { email: 'admin@prolineauto.com.br', password: '123qwe' }
testClient: { email: 'cliente@prolineauto.com.br', password: '123qwe' }
testPartner: { email: 'partner@prolineauto.com.br', password: '123qwe' }
testSpecialist: { email: 'specialist@prolineauto.com.br', password: '123qwe' }
```

## 🛠️ Comandos Personalizados

### Login/Logout

```typescript
cy.login('email@example.com', 'password');
cy.logout();
```

### Tasks Personalizadas

```javascript
// Seed do banco
cy.task('seedDatabase');

// Limpeza do banco
cy.task('clearDatabase');

// Verificação de contrato
cy.task('checkClientContractAcceptance', clientId);
```

## 📊 Relatórios

### Localização dos Arquivos

- **Vídeos**: `cypress/videos/`
- **Screenshots**: `cypress/screenshots/`
- **Downloads**: `cypress/downloads/`

### Configuração de Relatórios

```javascript
// cypress.config.mjs
reporter: 'spec',
video: true,
screenshotOnRunFailure: true
```

## 🧪 Estrutura dos Testes

### Padrão de Organização

Cada teste segue o padrão:

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup comum
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);
  });

  it('should perform specific action', () => {
    // Test implementation
  });
});
```

### Categorias de Testes

#### 👨‍💼 Admin Tests (`e2e/admin/`)

- Login e autenticação
- Gerenciamento de usuários
- Configuração de coletas
- Dashboard administrativo

#### 👤 Client Tests (`e2e/client/`)

- Login e autenticação
- Cadastro de veículos
- Aprovação de propostas
- Visualização de histórico

#### 🤝 Partner Tests (`e2e/partner/`)

- Login e autenticação
- Gerenciamento de serviços
- Controle de agenda

#### 🔧 Specialist Tests (`e2e/specialist/`)

- Login e autenticação
- Gerenciamento de inspeções
- Controle de serviços

## 🔧 Desenvolvimento

### Adicionar Novo Teste

```bash
# Criar arquivo de teste
touch cypress/e2e/nova-feature.cy.ts

# Implementar teste
describe('Nova Feature', () => {
  it('should work correctly', () => {
    // Test code
  });
});
```

### Adicionar Comando Personalizado

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('novoComando', param => {
  // Implementation
});

// cypress/support/index.d.ts
declare namespace Cypress {
  interface Chainable {
    novoComando(param: any): Chainable<void>;
  }
}
```

### Adicionar Fixture

```json
// cypress/fixtures/example.json
{
  "key": "value",
  "data": [1, 2, 3]
}
```

## 🔍 Debugging

### Comandos Úteis

```typescript
// Pausar execução
cy.pause();

// Tirar screenshot manual
cy.screenshot('debug-point');

// Log personalizado
cy.log('Debug info:', data);

// Verificar elemento
cy.get('.selector').should('be.visible');
```

### Debugging de API

```typescript
// Interceptar requests
cy.intercept('GET', '/api/users').as('getUsers');

// Aguardar request
cy.wait('@getUsers');

// Verificar response
cy.get('@getUsers').then(interception => {
  console.log(interception.response);
});
```

## 📚 Documentação

- **[Guia Completo de Configuração](../docs/CYPRESS_CONFIGURATION_GUIDE.md)**
- **[Exemplos Práticos de Testes](../docs/CYPRESS_TEST_EXAMPLES.md)**
- **[Guia Rápido](../docs/CYPRESS_QUICK_START.md)**
- **[Checklist de Configuração](../docs/CYPRESS_CHECKLIST.md)**

## 🔄 Integração CI/CD

### GitHub Actions

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
```

## 🎯 Boas Práticas

### ✅ Recomendações

- Usar `data-cy` attributes para seletores
- Implementar Page Object Pattern para testes complexos
- Manter testes independentes
- Usar fixtures para dados de teste
- Implementar cleanup após testes

### ❌ Evitar

- Seletores CSS frágeis
- Dependências entre testes
- Timeouts fixos longos
- Dados hardcoded nos testes
- Testes que dependem de estado externo

## 📞 Suporte

### Problemas Comuns

1. **Timeout**: Verificar se aplicação está rodando
2. **Auth Error**: Verificar usuários de teste no Supabase
3. **Element not found**: Usar `data-cy` attributes
4. **Flaky tests**: Implementar waits adequados

### Recursos

- [Documentação Cypress](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [TypeScript Support](https://docs.cypress.io/guides/tooling/typescript-support)

---

**📝 Última atualização:** Janeiro 2025 **🔧 Versão Cypress:** 14.x.x **🎯 Status:** Ativo e
configurado</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/cypress/README.md
