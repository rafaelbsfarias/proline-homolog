# 🧪 Template de Teste Cypress - ProLine Auto

## 📋 Estrutura Padrão para Novos Testes

Use este template como base para criar novos testes Cypress no projeto ProLine Auto.

## 🔧 Template Básico

```typescript
// cypress/e2e/nova-feature.cy.ts

describe('Nova Feature - Descrição', () => {
  // ========================================================================================
  // SETUP E CONFIGURAÇÃO
  // ========================================================================================

  let authToken: string;
  let createdResourceId: string;

  beforeEach(() => {
    // ========================================================================================
    // LOGIN E AUTENTICAÇÃO
    // ========================================================================================

    cy.log('🔐 Fazendo login...');
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

    // Capturar token de autenticação se necessário
    cy.window().then(win => {
      const sessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );
      if (sessionKey) {
        const session = JSON.parse(win.localStorage.getItem(sessionKey)!);
        authToken = session.access_token;
        cy.log(`✅ Token capturado: ${authToken.substring(0, 10)}...`);
      }
    });

    // Navegar para página inicial se necessário
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  afterEach(() => {
    // ========================================================================================
    // CLEANUP - LIMPAR DADOS DE TESTE
    // ========================================================================================

    if (createdResourceId) {
      cy.log(`🧹 Limpando recurso criado: ${createdResourceId}`);

      // Exemplo: deletar usuário criado
      cy.request({
        method: 'POST',
        url: '/api/admin/remove-user',
        body: { userId: createdResourceId },
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false // Não falhar se já foi deletado
      });
    }

    // Logout se necessário
    cy.logout();
  });

  // ========================================================================================
  // TESTES INDIVIDUAIS
  // ========================================================================================

  it('should perform basic functionality', () => {
    cy.log('🎯 Testando funcionalidade básica...');

    // Arrange - Preparar dados
    const testData = {
      name: `Test ${Date.now()}`,
      email: `test-${Date.now()}@example.com`
    };

    // Act - Executar ação
    cy.get('[data-cy=create-button]').click();
    cy.get('[data-cy=name-input]').type(testData.name);
    cy.get('[data-cy=email-input]').type(testData.email);
    cy.get('[data-cy=submit-button]').click();

    // Assert - Verificar resultado
    cy.contains(testData.name).should('be.visible');
    cy.contains('Criado com sucesso').should('be.visible');

    // Capturar ID do recurso criado para cleanup
    cy.get('[data-cy=resource-id]').invoke('text').then(id => {
      createdResourceId = id;
    });
  });

  it('should handle error scenarios', () => {
    cy.log('⚠️ Testando cenários de erro...');

    // Arrange
    cy.visit('/nova-feature');

    // Act - Tentar ação inválida
    cy.get('[data-cy=submit-button]').click();

    // Assert - Verificar tratamento de erro
    cy.contains('Campo obrigatório').should('be.visible');
    cy.contains('Erro ao processar').should('be.visible');
  });

  it('should validate form inputs', () => {
    cy.log('📝 Testando validação de formulários...');

    // Arrange
    cy.visit('/nova-feature');

    // Act & Assert - Testar validações
    cy.get('[data-cy=email-input]').type('invalid-email');
    cy.get('[data-cy=submit-button]').click();

    cy.contains('Email inválido').should('be.visible');

    // Corrigir e testar sucesso
    cy.get('[data-cy=email-input]').clear().type('valid@email.com');
    cy.get('[data-cy=name-input]').type('Valid Name');
    cy.get('[data-cy=submit-button]').click();

    cy.contains('Sucesso').should('be.visible');
  });

  it('should handle API integration', () => {
    cy.log('🔗 Testando integração com API...');

    // Interceptar chamada da API
    cy.intercept('POST', '/api/nova-feature').as('createResource');

    // Executar ação que chama API
    cy.get('[data-cy=create-button]').click();
    cy.get('[data-cy=name-input]').type('API Test');
    cy.get('[data-cy=submit-button]').click();

    // Aguardar e verificar chamada da API
    cy.wait('@createResource').then(interception => {
      expect(interception.request.body).to.have.property('name', 'API Test');
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body).to.have.property('success', true);
    });
  });

  it('should work on different screen sizes', () => {
    cy.log('📱 Testando responsividade...');

    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];

    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height);

      cy.visit('/nova-feature');
      cy.contains('Nova Feature').should('be.visible');

      // Verificar elementos específicos para cada viewport
      if (viewport.name === 'mobile') {
        cy.get('[data-cy=mobile-menu]').should('be.visible');
      }
    });
  });
});
```

## 🎯 Templates Específicos por Tipo

### 🔐 Template de Autenticação

```typescript
describe('Authentication Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('#email').type(Cypress.env('testAdmin').email);
    cy.get('#password').type(Cypress.env('testAdmin').password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');
  });

  it('should handle invalid credentials', () => {
    cy.visit('/login');
    cy.get('#email').type('invalid@email.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Credenciais inválidas').should('be.visible');
  });
});
```

### 👤 Template de Gerenciamento de Usuários

```typescript
describe('User Management', () => {
  let authToken: string;
  let testUserId: string;

  beforeEach(() => {
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

    cy.window().then(win => {
      const sessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );
      if (sessionKey) {
        const session = JSON.parse(win.localStorage.getItem(sessionKey)!);
        authToken = session.access_token;
      }
    });
  });

  it('should create new user', () => {
    const userData = {
      name: `Test User ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      role: 'client'
    };

    cy.request({
      method: 'POST',
      url: '/api/admin/create-user',
      body: userData,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then(response => {
      expect(response.status).to.eq(200);
      testUserId = response.body.userId;
    });

    cy.visit('/admin/usuarios');
    cy.contains(userData.email).should('be.visible');
  });

  it('should delete user', () => {
    cy.request({
      method: 'POST',
      url: '/api/admin/remove-user',
      body: { userId: testUserId },
      headers: { Authorization: `Bearer ${authToken}` }
    }).then(response => {
      expect(response.status).to.eq(200);
    });

    cy.reload();
    cy.contains(testUserId).should('not.exist');
  });
});
```

### 🚗 Template de Gerenciamento de Veículos

```typescript
describe('Vehicle Management', () => {
  let authToken: string;
  let vehicleId: string;

  beforeEach(() => {
    cy.login(Cypress.env('testClient').email, Cypress.env('testClient').password);

    cy.window().then(win => {
      const sessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );
      if (sessionKey) {
        const session = JSON.parse(win.localStorage.getItem(sessionKey)!);
        authToken = session.access_token;
      }
    });
  });

  it('should add new vehicle', () => {
    const vehicleData = {
      plate: `ABC-${Date.now().toString().slice(-4)}`,
      brand: 'Toyota',
      model: 'Corolla',
      year: '2023'
    };

    cy.request({
      method: 'POST',
      url: '/api/client/vehicles',
      body: vehicleData,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then(response => {
      expect(response.status).to.eq(201);
      vehicleId = response.body.vehicleId;
    });

    cy.visit('/dashboard');
    cy.contains(vehicleData.plate).should('be.visible');
  });
});
```

## 🛠️ Utilitários e Helpers

### Helper para Captura de Token

```typescript
// Adicionar em cypress/support/commands.ts
Cypress.Commands.add('getAuthToken', () => {
  return cy.window().then(win => {
    const sessionKey = Object.keys(win.localStorage).find(key =>
      key.match(/^sb-.*-auth-token$/)
    );

    if (sessionKey) {
      const session = JSON.parse(win.localStorage.getItem(sessionKey)!);
      return session.access_token;
    }

    throw new Error('Auth token not found');
  });
});

// Uso nos testes
cy.getAuthToken().then(token => {
  // Usar token
});
```

### Helper para Limpeza de Dados

```typescript
// Adicionar em cypress/support/commands.ts
Cypress.Commands.add('cleanupTestData', (resourceType, resourceId) => {
  cy.getAuthToken().then(token => {
    cy.request({
      method: 'DELETE',
      url: `/api/${resourceType}/${resourceId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false
    });
  });
});

// Uso nos testes
cy.cleanupTestData('users', testUserId);
```

### Page Object Pattern

```typescript
// cypress/support/pages/LoginPage.ts
export class LoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  fillEmail(email: string) {
    cy.get('#email').type(email);
    return this;
  }

  fillPassword(password: string) {
    cy.get('#password').type(password);
    return this;
  }

  submit() {
    cy.get('button[type="submit"]').click();
    return this;
  }

  login(email: string, password: string) {
    return this.visit()
      .fillEmail(email)
      .fillPassword(password)
      .submit();
  }
}

// Uso nos testes
const loginPage = new LoginPage();
loginPage.login('admin@test.com', 'password');
```

## 📝 Boas Práticas no Template

### ✅ Padrões a Seguir

1. **Nomenclatura Descritiva**
   ```typescript
   // ✅ Bom
   it('should create user with valid data', () => { ... });

   // ❌ Ruim
   it('test user creation', () => { ... });
   ```

2. **Organização Lógica**
   ```typescript
   // ✅ Bom - Arrange, Act, Assert
   it('should perform action', () => {
     // Arrange
     const testData = { ... };

     // Act
     cy.get('[data-cy=button]').click();

     // Assert
     cy.contains('Success').should('be.visible');
   });
   ```

3. **Uso de Data Attributes**
   ```typescript
   // ✅ Bom
   cy.get('[data-cy=email-input]').type('test@example.com');

   // ❌ Ruim
   cy.get('.form-control.email').type('test@example.com');
   ```

4. **Cleanup Adequado**
   ```typescript
   // ✅ Bom
   afterEach(() => {
     if (createdResourceId) {
       cy.cleanupTestData('users', createdResourceId);
     }
   });
   ```

5. **Logs Informativos**
   ```typescript
   // ✅ Bom
   cy.log('🔐 Fazendo login...');
   cy.log('✅ Login realizado com sucesso');
   ```

### ❌ Padrões a Evitar

1. **Dependências entre Testes**
   ```typescript
   // ❌ Ruim - Teste depende do anterior
   it('should edit user', () => {
     // Assume que usuário foi criado no teste anterior
   });
   ```

2. **Timeouts Fixos**
   ```typescript
   // ❌ Ruim
   cy.wait(5000);

   // ✅ Bom
   cy.get('[data-cy=loading]').should('not.exist');
   ```

3. **Dados Hardcoded**
   ```typescript
   // ❌ Ruim
   cy.get('#email').type('admin@test.com');

   // ✅ Bom
   cy.get('#email').type(Cypress.env('testAdmin').email);
   ```

## 🎯 Checklist para Novos Testes

- [ ] **Nome descritivo** do arquivo e testes
- [ ] **Setup adequado** com beforeEach/afterEach
- [ ] **Login automático** quando necessário
- [ ] **Captura de token** para APIs
- [ ] **Cleanup completo** dos dados de teste
- [ ] **Asserções claras** e específicas
- [ ] **Logs informativos** para debugging
- [ ] **Tratamento de erros** adequado
- [ ] **Uso de data-cy** attributes
- [ ] **Independência** dos outros testes

## 🚀 Próximos Passos

1. **Copiar este template** para novo arquivo
2. **Adaptar para a funcionalidade** específica
3. **Seguir o checklist** de boas práticas
4. **Executar o teste** para verificar funcionamento
5. **Adicionar ao repositório** com commit descritivo

---

**📝 Template criado para:** ProLine Auto
**🔧 Cypress:** 14.x.x
**📅 Atualizado em:** Janeiro 2025</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/CYPRESS_TEST_TEMPLATE.md
