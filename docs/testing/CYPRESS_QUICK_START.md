# 🚀 Guia Rápido de Configuração Cypress - ProLine Auto

## ⚡ Configuração em 5 Minutos

Este guia permite configurar rapidamente o Cypress para desenvolvimento e testes no projeto ProLine Auto.

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Projeto ProLine Auto clonado
- Variáveis de ambiente configuradas

## 🛠️ Instalação e Configuração

### 1. Instalar Dependências
```bash
cd /path/to/proline-homolog
npm install
```

### 2. Verificar Configuração
```bash
# Verificar se Cypress está instalado
npx cypress --version

# Verificar configuração
ls -la cypress.config.mjs
```

### 3. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com suas credenciais
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Iniciar Servidor de Desenvolvimento
```bash
# Terminal 1: Iniciar aplicação Next.js
npm run dev

# Aguardar aplicação iniciar na porta 3000
```

### 5. Executar Cypress
```bash
# Terminal 2: Abrir Cypress em modo interativo
npm run cypress

# Ou executar todos os testes
npm run test:e2e
```

## 🔧 Configuração de Usuários de Teste

### Usuários Padrão (já configurados)
```javascript
// cypress.config.mjs
env: {
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
}
```

### Criar Usuários de Teste no Supabase
```sql
-- Executar no SQL Editor do Supabase
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('admin@prolineauto.com.br', crypt('123qwe', gen_salt('bf')), now(), now(), now()),
  ('cliente@prolineauto.com.br', crypt('123qwe', gen_salt('bf')), now(), now(), now()),
  ('partner@prolineauto.com.br', crypt('123qwe', gen_salt('bf')), now(), now(), now()),
  ('specialist@prolineauto.com.br', crypt('123qwe', gen_salt('bf')), now(), now(), now());

-- Inserir perfis correspondentes
INSERT INTO public.profiles (id, full_name, role)
SELECT
  id,
  CASE
    WHEN email = 'admin@prolineauto.com.br' THEN 'Admin ProLine'
    WHEN email = 'cliente@prolineauto.com.br' THEN 'Cliente Teste'
    WHEN email = 'partner@prolineauto.com.br' THEN 'Parceiro Teste'
    WHEN email = 'specialist@prolineauto.com.br' THEN 'Especialista Teste'
  END,
  CASE
    WHEN email = 'admin@prolineauto.com.br' THEN 'admin'
    WHEN email = 'cliente@prolineauto.com.br' THEN 'client'
    WHEN email = 'partner@prolineauto.com.br' THEN 'partner'
    WHEN email = 'specialist@prolineauto.com.br' THEN 'specialist'
  END
FROM auth.users
WHERE email IN (
  'admin@prolineauto.com.br',
  'cliente@prolineauto.com.br',
  'partner@prolineauto.com.br',
  'specialist@prolineauto.com.br'
);
```

## 🧪 Executar Testes

### Modo Interativo (Recomendado para Desenvolvimento)
```bash
npm run cypress
# Selecione "E2E Testing"
# Escolha o navegador
# Clique no teste desejado
```

### Modo Headless (CI/CD)
```bash
# Executar todos os testes
npm run test:e2e

# Executar teste específico
npx cypress run --spec "cypress/e2e/admin/admin-login.cy.ts"

# Executar com vídeo
npx cypress run --record --key your-record-key
```

### Scripts Disponíveis
```json
{
  "cypress": "cypress open",
  "cypress:run": "cypress run",
  "test:e2e": "cypress run",
  "test:e2e:dev": "cypress open"
}
```

## 🔧 Solução de Problemas

### Erro: "Cannot connect to localhost:3000"
```bash
# Verificar se aplicação está rodando
curl http://localhost:3000

# Se não estiver, iniciar
npm run dev
```

### Erro: "Supabase connection failed"
```bash
# Verificar variáveis de ambiente
cat .env.local

# Verificar conexão com Supabase
npx supabase status
```

### Erro: "User authentication failed"
```bash
# Verificar se usuários de teste existem no Supabase
# Executar query SQL acima para criar usuários
```

### Erro: "Timeout waiting for element"
```bash
# Aumentar timeout no cypress.config.mjs
defaultCommandTimeout: 15000, // de 10000 para 15000
```

## 📁 Estrutura de Arquivos

```
cypress/
├── config.mjs              # ✅ Configuração principal
├── tsconfig.json           # ✅ Config TypeScript
├── e2e/                    # ✅ Testes E2E
│   ├── admin/
│   ├── client/
│   ├── partner/
│   └── specialist/
├── support/                # ✅ Comandos customizados
│   ├── commands.ts
│   ├── e2e.ts
│   └── index.d.ts
├── fixtures/               # ✅ Dados de teste
└── downloads/             # 📁 Downloads automáticos
```

## 🎯 Primeiro Teste

### Criar Teste Básico
```typescript
// cypress/e2e/test/my-first-test.cy.ts
describe('My First Test', () => {
  it('should visit homepage', () => {
    cy.visit('/');
    cy.contains('ProLine Auto').should('be.visible');
  });

  it('should login admin', () => {
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);
    cy.url().should('include', '/dashboard');
  });
});
```

### Executar Teste Específico
```bash
npx cypress run --spec "cypress/e2e/test/my-first-test.cy.ts"
```

## 🔄 Integração com CI/CD

### GitHub Actions
```yaml
# .github/workflows/e2e.yml
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

## 📊 Relatórios

### Vídeos e Screenshots
- **Vídeos**: `cypress/videos/`
- **Screenshots**: `cypress/screenshots/`
- **Configuração**: Automática em caso de falha

### Relatório Personalizado
```bash
# Instalar reporter
npm install --save-dev cypress-mochawesome-reporter

# Configurar em cypress.config.mjs
reporter: 'cypress-mochawesome-reporter',
reporterOptions: {
  reportDir: 'cypress/reports',
  overwrite: false,
  html: true,
  json: true
}
```

## 🚀 Próximos Passos

1. ✅ **Configuração básica** - Completa
2. 🔄 **Executar primeiros testes** - Em andamento
3. 📝 **Criar mais testes** - Próximo
4. 🔧 **Configurar CI/CD** - Futuro
5. 📊 **Relatórios avançados** - Futuro

## 📚 Recursos

- [Documentação Cypress](https://docs.cypress.io/)
- [ProLine Auto - Configuração Cypress](./CYPRESS_CONFIGURATION_GUIDE.md)
- [Exemplos de Testes](./CYPRESS_TEST_EXAMPLES.md)

---

**🎉 Pronto!** O Cypress está configurado e funcionando no projeto ProLine Auto.</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/CYPRESS_QUICK_START.md
