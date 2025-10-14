# 🧪 Exemplos Práticos de Testes Cypress - ProLine Auto

## 📋 Casos de Uso Comuns

Este documento contém exemplos práticos de testes Cypress para os cenários mais comuns no sistema ProLine Auto.

## 🔐 Testes de Autenticação

### Login de Admin
```typescript
describe('Admin Authentication', () => {
  it('should login admin successfully', () => {
    cy.visit('/login');
    cy.get('#email').type(Cypress.env('testAdmin').email);
    cy.get('#password').type(Cypress.env('testAdmin').password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Painel de Gestão ProLine').should('be.visible');
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

### Login via Comando Customizado
```typescript
describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);
  });

  it('should display dashboard correctly', () => {
    cy.url().should('include', '/dashboard');
    cy.contains('Cadastros pendentes').should('be.visible');
    cy.contains('Usuários').should('be.visible');
    cy.contains('Veículos').should('be.visible');
  });
});
```

## 👤 Testes de Gerenciamento de Usuários

### Criar e Remover Usuário
```typescript
describe('User Management', () => {
  let authToken: string;
  let createdUserId: string;

  beforeEach(() => {
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

    // Capturar token de autenticação
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

  it('should create and delete user', () => {
    const testEmail = `test-${Date.now()}@example.com`;

    // Criar usuário
    cy.request({
      method: 'POST',
      url: '/api/admin/create-user',
      body: {
        name: 'Test User',
        email: testEmail,
        role: 'client'
      },
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      createdUserId = response.body.userId;
    });

    // Verificar usuário na lista
    cy.visit('/admin/usuarios');
    cy.contains(testEmail).should('be.visible');

    // Remover usuário
    cy.request({
      method: 'POST',
      url: '/api/admin/remove-user',
      body: { userId: createdUserId },
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });

    // Verificar que usuário foi removido
    cy.reload();
    cy.contains(testEmail).should('not.exist');
  });
});
```

## 🚗 Testes de Gerenciamento de Veículos

### Adicionar Veículo
```typescript
describe('Vehicle Management', () => {
  let authToken: string;

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

  it('should add new vehicle', () => {
    const vehicleData = {
      plate: `ABC-${Date.now().toString().slice(-4)}`,
      brand: 'Toyota',
      model: 'Corolla',
      year: '2023',
      clientId: 'client-uuid-here'
    };

    cy.request({
      method: 'POST',
      url: '/api/admin/vehicles',
      body: vehicleData,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then(response => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
    });

    // Verificar veículo na lista
    cy.visit('/admin/veiculos');
    cy.contains(vehicleData.plate).should('be.visible');
  });
});
```

## 📍 Testes de Endereços e Coletas

### Configurar Coleta para Cliente
```typescript
describe('Collection Management', () => {
  let authToken: string;
  let clientId: string;
  let addressId: string;

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

    // Setup: criar cliente e endereço de teste
    clientId = 'test-client-id';
    addressId = 'test-address-id';
  });

  it('should set collection fees for address', () => {
    const collectionData = {
      clientId,
      fees: [{
        addressId,
        fee: 50.00,
        date: '2025-01-15'
      }]
    };

    cy.request({
      method: 'POST',
      url: '/api/admin/set-address-collection-fees',
      body: collectionData,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });
  });

  it('should approve collection proposal as client', () => {
    // Login como cliente
    cy.login(Cypress.env('testClient').email, Cypress.env('testClient').password);

    // Visitar dashboard do cliente
    cy.visit('/dashboard');

    // Verificar proposta de coleta
    cy.contains('Proposta de Coleta').should('be.visible');

    // Aprovar proposta
    cy.get('button').contains('Aprovar').click();

    // Verificar confirmação
    cy.contains('Coleta aprovada com sucesso').should('be.visible');
  });
});
```

## 🔄 Testes de Fluxo Completo

### Fluxo Completo: Cadastro → Aprovação → Coleta
```typescript
describe('Complete User Journey', () => {
  let adminToken: string;
  let clientToken: string;
  let newUserId: string;
  let vehicleId: string;

  it('should complete full user registration and collection flow', () => {
    const userEmail = `test-${Date.now()}@example.com`;

    // 1. Admin cria novo usuário
    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

    cy.window().then(win => {
      const sessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );
      if (sessionKey) {
        const session = JSON.parse(win.localStorage.getItem(sessionKey)!);
        adminToken = session.access_token;
      }
    });

    cy.request({
      method: 'POST',
      url: '/api/admin/create-user',
      body: {
        name: 'Test Client',
        email: userEmail,
        role: 'client'
      },
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }).then(response => {
      newUserId = response.body.userId;
    });

    // 2. Cliente faz login e cadastra veículo
    cy.login(userEmail, 'defaultpassword');

    cy.window().then(win => {
      const sessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );
      if (sessionKey) {
        const session = JSON.parse(win.localStorage.getItem(sessionKey)!);
        clientToken = session.access_token;
      }
    });

    // Cadastrar veículo
    cy.request({
      method: 'POST',
      url: '/api/client/vehicles',
      body: {
        plate: `XYZ-${Date.now().toString().slice(-4)}`,
        brand: 'Honda',
        model: 'Civic',
        year: '2022'
      },
      headers: {
        Authorization: `Bearer ${clientToken}`
      }
    }).then(response => {
      vehicleId = response.body.vehicleId;
    });

    // 3. Admin configura coleta
    cy.request({
      method: 'POST',
      url: '/api/admin/set-address-collection-fees',
      body: {
        clientId: newUserId,
        fees: [{
          addressId: 'client-address-id',
          fee: 75.00,
          date: '2025-01-20'
        }]
      },
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    // 4. Cliente aprova proposta
    cy.request({
      method: 'POST',
      url: '/api/client/collection-accept-proposal',
      body: {
        addressId: 'client-address-id'
      },
      headers: {
        Authorization: `Bearer ${clientToken}`
      }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });

    // 5. Verificar histórico de coletas
    cy.request({
      method: 'GET',
      url: `/api/admin/collection-history/${newUserId}`,
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.history).to.have.length.greaterThan(0);
    });
  });
});
```

## 🛠️ Utilitários e Helpers

### Helper para Captura de Token
```typescript
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
```

### Helper para Limpeza de Dados
```typescript
Cypress.Commands.add('cleanupTestData', () => {
  cy.task('clearDatabase');
});
```

### Page Object Pattern
```typescript
class DashboardPage {
  visit() {
    cy.visit('/dashboard');
    return this;
  }

  verifyCounters() {
    cy.contains('Cadastros pendentes').should('be.visible');
    cy.contains('Usuários').should('be.visible');
    cy.contains('Veículos').should('be.visible');
    return this;
  }

  navigateToUsers() {
    cy.contains('Usuários').click();
    return this;
  }

  navigateToVehicles() {
    cy.contains('Veículos').click();
    return this;
  }
}

// Uso
const dashboard = new DashboardPage();
dashboard.visit().verifyCounters().navigateToUsers();
```

## 📊 Testes de API

### Teste de Endpoint de Health Check
```typescript
describe('API Health Checks', () => {
  it('should return healthy status', () => {
    cy.request('/api/health').then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.status).to.eq('healthy');
    });
  });
});
```

### Teste de Rate Limiting
```typescript
describe('Rate Limiting', () => {
  it('should handle rate limiting gracefully', () => {
    // Fazer múltiplas requests rápidas
    for (let i = 0; i < 10; i++) {
      cy.request({
        method: 'GET',
        url: '/api/admin/users',
        failOnStatusCode: false
      });
    }

    // Verificar se a última request foi rate limited
    cy.request({
      method: 'GET',
      url: '/api/admin/users',
      failOnStatusCode: false
    }).then(response => {
      if (response.status === 429) {
        cy.log('Rate limiting working correctly');
      }
    });
  });
});
```

## 🔍 Testes de Performance

### Teste de Tempo de Carregamento
```typescript
describe('Performance Tests', () => {
  it('should load dashboard within acceptable time', () => {
    const startTime = Date.now();

    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

    cy.url().should('include', '/dashboard').then(() => {
      const loadTime = Date.now() - startTime;
      cy.log(`Dashboard load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(5000); // Máximo 5 segundos
    });
  });
});
```

## 🐛 Debugging Avançado

### Captura de Estado da Aplicação
```typescript
Cypress.Commands.add('captureAppState', () => {
  cy.window().then(win => {
    cy.log('=== Application State ===');
    cy.log('URL:', win.location.href);
    cy.log('LocalStorage:', Object.keys(win.localStorage));
    cy.log('SessionStorage:', Object.keys(win.sessionStorage));

    // Capturar estado do Supabase se disponível
    if (win.supabase) {
      cy.log('Supabase client found');
    }
  });
});
```

### Teste com Mock de API
```typescript
describe('API Mocking', () => {
  it('should handle API errors gracefully', () => {
    // Interceptar chamada da API
    cy.intercept('GET', '/api/admin/users', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('getUsers');

    cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

    // Verificar tratamento de erro
    cy.contains('Erro ao carregar usuários').should('be.visible');
  });
});
```

## 📱 Testes Responsivos

### Teste em Diferentes Viewports
```typescript
describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 }
  ];

  viewports.forEach(viewport => {
    it(`should work on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.login(Cypress.env('testAdmin').email, Cypress.env('testAdmin').password);

      // Verificar elementos responsivos
      cy.get('[data-cy=menu-toggle]').should('be.visible');
      cy.contains('Painel de Gestão ProLine').should('be.visible');
    });
  });
});
```

## 🔒 Testes de Segurança

### Teste de Autorização
```typescript
describe('Authorization Tests', () => {
  it('should prevent client from accessing admin routes', () => {
    cy.login(Cypress.env('testClient').email, Cypress.env('testClient').password);

    // Tentar acessar rota admin
    cy.visit('/admin/usuarios');

    // Deve redirecionar ou mostrar erro
    cy.url().should('not.include', '/admin/usuarios');
    cy.contains('Acesso negado').should('be.visible');
  });
});
```

---

**Nota**: Estes exemplos podem ser adaptados conforme a evolução da aplicação. Sempre mantenha os testes atualizados com as mudanças no código.</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/CYPRESS_TEST_EXAMPLES.md
