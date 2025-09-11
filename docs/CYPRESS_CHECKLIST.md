# ✅ Checklist de Configuração Cypress - ProLine Auto

## 📋 Lista de Verificação Completa

Use este checklist para configurar e verificar o Cypress no projeto ProLine Auto.

### 🔧 Instalação e Dependências

- [ ] **Node.js 18+ instalado**
  ```bash
  node --version
  ```

- [ ] **Cypress instalado**
  ```bash
  npx cypress --version
  # Deve mostrar versão 14.x.x
  ```

- [ ] **Dependências do projeto instaladas**
  ```bash
  npm install
  ```

- [ ] **TypeScript configurado para Cypress**
  ```bash
  ls cypress/tsconfig.json
  ```

### ⚙️ Configuração Básica

- [ ] **Arquivo de configuração principal existe**
  ```bash
  ls cypress.config.mjs
  ```

- [ ] **Base URL configurada**
  ```javascript
  baseUrl: 'http://localhost:3000'
  ```

- [ ] **Timeouts adequados**
  ```javascript
  defaultCommandTimeout: 10000
  requestTimeout: 10000
  responseTimeout: 10000
  pageLoadTimeout: 30000
  ```

- [ ] **Captura de mídia habilitada**
  ```javascript
  video: true
  screenshotOnRunFailure: true
  ```

### 🔐 Autenticação e Variáveis de Ambiente

- [ ] **Arquivo .env.local existe**
  ```bash
  ls .env.local
  ```

- [ ] **Variáveis Supabase configuradas**
  ```bash
  cat .env.local | grep SUPABASE
  # Deve conter NEXT_PUBLIC_SUPABASE_URL e SERVICE_ROLE_KEY
  ```

- [ ] **Usuários de teste configurados no Cypress**
  ```javascript
  // cypress.config.mjs
  testAdmin: { email: '...', password: '...' }
  testClient: { email: '...', password: '...' }
  testPartner: { email: '...', password: '...' }
  testSpecialist: { email: '...', password: '...' }
  ```

- [ ] **Usuários de teste existem no Supabase**
  ```sql
  -- Verificar no SQL Editor do Supabase
  SELECT email, role FROM profiles WHERE email LIKE '%@prolineauto.com.br';
  ```

### 📁 Estrutura de Arquivos

- [ ] **Diretório cypress existe**
  ```bash
  ls -la cypress/
  ```

- [ ] **Arquivos de suporte existem**
  ```bash
  ls cypress/support/
  # Deve conter: commands.ts, e2e.ts, index.d.ts
  ```

- [ ] **Diretório de testes existe**
  ```bash
  ls cypress/e2e/
  # Deve conter: admin/, client/, partner/, specialist/
  ```

- [ ] **Diretório de fixtures existe**
  ```bash
  ls cypress/fixtures/
  ```

### 🧪 Comandos Customizados

- [ ] **Comando de login personalizado**
  ```typescript
  // cypress/support/commands.ts
  Cypress.Commands.add('login', (email, password) => { ... });
  ```

- [ ] **Comando de logout personalizado**
  ```typescript
  Cypress.Commands.add('logout', () => { ... });
  ```

- [ ] **Definições de tipos atualizadas**
  ```typescript
  // cypress/support/index.d.ts
  declare namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
  ```

### 🚀 Funcionalidades Avançadas

- [ ] **Tasks personalizadas configuradas**
  ```javascript
  // cypress.config.mjs
  on('task', {
    seedDatabase() { ... },
    clearDatabase() { ... },
    checkClientContractAcceptance() { ... }
  });
  ```

- [ ] **Interceptação de API configurada**
  ```javascript
  experimentalStudio: true
  ```

- [ ] **Retry strategy configurada**
  ```javascript
  retries: {
    runMode: 2,
    openMode: 0
  }
  ```

### 🖥️ Ambiente de Desenvolvimento

- [ ] **Aplicação Next.js rodando**
  ```bash
  npm run dev
  # Deve iniciar na porta 3000
  ```

- [ ] **Cypress abre corretamente**
  ```bash
  npm run cypress
  # Deve abrir interface do Cypress
  ```

- [ ] **Testes executam sem erros**
  ```bash
  npm run test:e2e
  # Deve executar todos os testes
  ```

### 📊 Relatórios e Debugging

- [ ] **Vídeos são salvos**
  ```bash
  ls cypress/videos/
  ```

- [ ] **Screenshots são capturados em falhas**
  ```bash
  ls cypress/screenshots/
  ```

- [ ] **Logs de debug funcionam**
  ```typescript
  cy.log('Debug message');
  cy.pause();
  ```

### 🔄 Integração CI/CD

- [ ] **Scripts npm configurados**
  ```json
  {
    "cypress": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "cypress run",
    "test:e2e:dev": "cypress open"
  }
  ```

- [ ] **GitHub Actions configurado** (opcional)
  ```yaml
  # .github/workflows/e2e.yml
  - uses: cypress-io/github-action@v5
  ```

### 🧪 Testes Funcionais

- [ ] **Teste de login admin funciona**
  ```bash
  npx cypress run --spec "cypress/e2e/admin/admin-login.cy.ts"
  ```

- [ ] **Teste de criação de usuário funciona**
  ```bash
  npx cypress run --spec "cypress/e2e/admin/admin-full-flow.cy.ts"
  ```

- [ ] **Teste de fluxo completo funciona**
  ```bash
  npx cypress run --spec "cypress/e2e/all-tests.cy.ts"
  ```

### 🔍 Verificações de Qualidade

- [ ] **Linting passa**
  ```bash
  npm run lint
  ```

- [ ] **TypeScript compila sem erros**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Testes não têm duplicação**
  ```bash
  npm run jscpd
  ```

### 📚 Documentação

- [ ] **Guia de configuração criado**
  ```bash
  ls docs/CYPRESS_CONFIGURATION_GUIDE.md
  ```

- [ ] **Exemplos de testes criados**
  ```bash
  ls docs/CYPRESS_TEST_EXAMPLES.md
  ```

- [ ] **Guia rápido criado**
  ```bash
  ls docs/CYPRESS_QUICK_START.md
  ```

## 🎯 Status da Configuração

### ✅ Completo
- [x] Instalação e dependências
- [x] Configuração básica
- [x] Autenticação configurada
- [x] Estrutura de arquivos
- [x] Comandos customizados
- [x] Ambiente de desenvolvimento
- [x] Scripts npm
- [x] Documentação

### 🔄 Em Andamento
- [ ] Testes funcionais (depende dos dados de teste)
- [ ] Integração CI/CD (opcional)
- [ ] Relatórios avançados (opcional)

### ❌ Pendente
- [ ] Usuários de teste no Supabase (se não existirem)
- [ ] Configuração de CI/CD (se necessário)

## 🚀 Próximos Passos

1. **Verificar usuários de teste no Supabase**
2. **Executar testes básicos**
3. **Criar novos testes conforme necessário**
4. **Configurar CI/CD se aplicável**

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do Cypress
2. Verificar variáveis de ambiente
3. Verificar conexão com Supabase
4. Consultar documentação completa

---

**✅ Checklist atualizado em:** Janeiro 2025
**📝 Versão Cypress:** 14.x.x
**🎯 Status:** Pronto para desenvolvimento</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/CYPRESS_CHECKLIST.md
