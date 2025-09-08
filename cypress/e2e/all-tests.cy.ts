describe('Admin Dashboard Tests', () => {
  let createdUserId: string; // To store the ID of the user created for testing
  let authToken: string; // To store the Supabase auth token

  beforeEach(() => {
    cy.log('Starting admin login...');
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.log('Navigated to login page.');

    cy.get('#email').should('be.visible').type('admin@prolineauto.com.br', { log: true });
    cy.log('Typed email: admin@prolineauto.com.br');

    cy.get('#password').should('be.visible').type('123qwe', { log: true });
    cy.log('Typed password.');

    cy.get('button[type="submit"]').should('be.visible').click({ log: true });
    cy.log('Clicked login button.');

    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('Login successful. Redirected from login page.');

    // The URL should now be /dashboard for all users
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    cy.log('Navigated to dashboard page.');

    // Wait for admin-specific components to render
    cy.wait(2000);

    // Get the Supabase auth token from localStorage
    cy.window().then(win => {
      // Log all localStorage keys for debugging
      cy.log('localStorage keys:', Object.keys(win.localStorage).join(', '));

      const supabaseSessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );

      if (supabaseSessionKey) {
        const sessionValue = win.localStorage.getItem(supabaseSessionKey);
        if (sessionValue) {
          const sessionData = JSON.parse(sessionValue);
          authToken = sessionData.access_token;
          cy.log(`Supabase Auth Token retrieved: ${authToken.substring(0, 10)}...`);
        } else {
          throw new Error('Supabase session value not found in localStorage.');
        }
      } else {
        throw new Error('Supabase auth token key not found in localStorage.');
      }
    });
  });

  it('should display all admin dashboard components after successful login', () => {
    cy.log('Verifying admin dashboard components...');

    // Verify Header
    cy.get('header').should('be.visible');
    cy.log('Header component is visible.');

    // Verify Toolbar
    cy.contains('Painel de Gestão ProLine').should('be.visible');
    cy.log('Toolbar component is visible.');

    // Verify Counters, waiting for them to load
    cy.contains('Cadastros pendentes', { timeout: 10000 }).should('be.visible');
    cy.log('PendingRegistrationsCounter is visible.');

    cy.contains('Usuários', { timeout: 10000 }).should('be.visible');
    cy.log('UsersCounter is visible.');

    cy.contains('Veículos', { timeout: 10000 }).should('be.visible');
    cy.log('VehiclesCounter is visible.');

    // Verify DataPanel, waiting for it to load
    // cy.get('.dataPanelOuter', { timeout: 10000 }).should('be.visible');
    // cy.log('DataPanel component is visible.');

    cy.log('All admin dashboard components verified.');
  });

  it('should create and then delete a test user via API', () => {
    const testEmail = `testuser-${Date.now()}@example.com`;
    const testName = 'Test User';
    const testRole = 'client';

    cy.log(`Attempting to create user: ${testName} (${testEmail}) with role: ${testRole}`);

    // Create user
    cy.request({
      method: 'POST',
      url: '/api/admin/create-user',
      body: {
        name: testName,
        email: testEmail,
        role: testRole,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then(response => {
      cy.log('Response from create-user API:', response.body);
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.userId).to.not.be.empty;
      createdUserId = response.body.userId;
      cy.log(`Successfully created user with ID: ${createdUserId}`);
    });

    // Delete user
    cy.log(`Attempting to delete user with ID: ${createdUserId}`);
    cy.request({
      method: 'POST',
      url: '/api/admin/remove-user',
      body: {
        userId: createdUserId,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      cy.log(`Successfully deleted user with ID: ${createdUserId}`);
    });
  });
});

describe('Client Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should allow a client to log in successfully', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.get('input[name="email"]').type(clientEmail);
    cy.get('input[name="password"]').type(clientPassword);
    cy.get('button[type="submit"]').click();

    // Assuming successful login redirects to /dashboard or shows a welcome message
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible'); // Example: check for a welcome message
  });
});

describe.skip('Forgot Password Flow', () => {
  const testEmail = `test-forgot-password-${Date.now()}@example.com`;
  const mailpitApiUrl = 'http://localhost:54324/api/v1/messages';

  before(() => {
    // Limpar emails do Mailpit antes de iniciar os testes
    cy.request('DELETE', mailpitApiUrl);
  });

  it('should send a password reset email and verify it in Mailpit', () => {
    cy.visit('/forgot-password');
    cy.url().should('include', '/forgot-password');

    cy.get('#email').type(testEmail);
    cy.get('button[type="submit"]').click();

    // Verificar mensagem de sucesso na UI
    cy.contains('Email enviado com sucesso! Verifique sua caixa de entrada.').should('be.visible');

    // Verificar no Mailpit
    cy.wait(15000); // Dar um tempo maior para o email chegar no Mailpit
    cy.request(mailpitApiUrl).then(response => {
      console.log('Mailpit API Response Body:', response.body);
      expect(response.status).to.eq(200);
      const emails = response.body.items || response.body.messages || response.body;
      expect(Array.isArray(emails)).to.be.true;
      cy.task('log', 'Emails found in Mailpit:');
      cy.task('log', emails);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resetEmail = emails.find((email: any) => {
        cy.task(
          'log',
          `Checking email: To: ${JSON.stringify(email.To)}, Subject: ${email.Subject}`
        );
        return (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email.To.some((to: any) => to.Address === testEmail) &&
          email.Subject.includes('Redefinir Senha')
        );
      });
      expect(resetEmail).to.exist;
      cy.log('Password reset email found in Mailpit:', resetEmail);
    });
  });
});

describe('Partner Dashboard Tests', () => {
  beforeEach(() => {
    cy.log('Starting partner login...');
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.log('Navigated to login page.');

    cy.get('#email').should('be.visible').type(Cypress.env('testPartner').email, { log: true });
    cy.log(`Typed email: ${Cypress.env('testPartner').email}`);

    cy.get('#password')
      .should('be.visible')
      .type(Cypress.env('testPartner').password, { log: true });
    cy.log('Typed password.');

    cy.get('button[type="submit"]').should('be.visible').click({ log: true });
    cy.log('Clicked login button.');

    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('Login successful. Redirected from login page.');

    // The URL should now be /dashboard for all users
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    cy.log('Navigated to dashboard page.');

    // Wait for partner-specific components to render
    cy.wait(2000);
  });

  it('should display partner dashboard components after successful login', () => {
    cy.log('Verifying partner dashboard components...');

    // Verify Header
    cy.get('header').should('be.visible');
    cy.log('Header component is visible.');

    // Check if contract acceptance is required
    cy.get('body').then($body => {
      if ($body.find('h1:contains("Termos do Contrato")').length > 0) {
        cy.log('Contract terms found. Accepting contract...');
        cy.get('input[type="checkbox"]').check();
        cy.contains('Aceitar Contrato').click();
        cy.log('Contract accepted. Waiting for dashboard to load...');
        cy.wait(2000); // Give time for the dashboard to load after acceptance
      } else {
        cy.log('Contract terms not found. Assuming contract already accepted or not required.');
      }
    });

    // Verify Partner-specific content (e.g., a unique text or element in PartnerDashboard)
    cy.contains('Painel do Parceiro', { timeout: 10000 }).should('be.visible');
    cy.log('PartnerDashboard content is visible.');

    cy.log('All partner dashboard components verified.');
  });
});

describe('Partner Service Management', () => {
  const partnerEmail = Cypress.env('testPartner').email;
  const partnerPassword = Cypress.env('testPartner').password;

  beforeEach(() => {
    cy.log('Starting partner login for service management tests...');
    cy.visit('/login');
    cy.url().should('include', '/login');

    cy.get('#email').should('be.visible').type(partnerEmail, { log: true });
    cy.get('#password').should('be.visible').type(partnerPassword, { log: true });
    cy.get('button[type="submit"]').should('be.visible').click({ log: true });

    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Handle contract acceptance if present
    cy.get('body').then($body => {
      if ($body.find('h1:contains("Termos do Contrato")').length > 0) {
        cy.log('Contract terms found. Accepting contract...');
        cy.get('input[type="checkbox"]').check();
        cy.contains('Aceitar Contrato').click();
        cy.wait(2000); // Give time for the dashboard to load after acceptance
      }
    });
    cy.wait(2000); // Additional wait for dashboard to settle
  });

  it('should open the Add Service modal', () => {
    cy.log('Attempting to open Add Service modal...');
    cy.contains('Adicionar Serviço').should('be.visible').click();
    cy.get('.modal-overlay').should('be.visible'); // Use o seletor correto para o overlay do modal
    cy.contains('Gerenciar Serviços').should('be.visible'); // Verificar o título do modal
    cy.log('Add Service modal opened successfully.');
  });

  it('should allow manual service creation', () => {
    cy.log('Attempting manual service creation...');
    cy.contains('Adicionar Serviço').should('be.visible').click();
    cy.get('.modal-overlay').should('be.visible');
    cy.contains('Gerenciar Serviços').should('be.visible');

    const serviceName = `Serviço Teste ${Date.now()}`;
    const serviceDescription = 'Descrição do serviço de teste.';
    const estimatedDays = 5;
    const servicePrice = 150.75;

    cy.get('#name').type(serviceName);
    cy.get('#description').type(serviceDescription);
    cy.get('#estimated_days').type(estimatedDays.toString());
    cy.get('#price').type(servicePrice.toString());

    // Clica no botão de adicionar serviço dentro do modal, garantindo que ele esteja visível
    cy.get('.modal-content').contains('Adicionar Serviço').should('be.visible').click();

    // Verificar se o modal fechou
    cy.get('.modal-overlay').should('not.exist');

    // Verificar se o serviço aparece na lista (assumindo que a tabela de serviços é atualizada)
    // Você precisará ajustar este seletor e texto de verificação para a sua tabela real
    cy.contains(serviceName).should('be.visible');
    cy.log(`Service '${serviceName}' created successfully.`);
  });

  it('should successfully create a service via direct API request', () => {
    cy.log('Attempting to create service via direct API request...');
    const directServiceName = `Serviço Direto ${Date.now()}`;
    const directServiceDescription = 'Descrição do serviço de teste via API.';
    const directEstimatedDays = 7;
    const directServicePrice = 200.0;

    // Get the auth token from localStorage (assuming login was successful in beforeEach)
    cy.window().then(win => {
      const supabaseSessionKey = Object.keys(win.localStorage).find(key =>
        key.match(/^sb-.*-auth-token$/)
      );
      if (supabaseSessionKey) {
        const sessionValue = win.localStorage.getItem(supabaseSessionKey);
        if (sessionValue) {
          const sessionData = JSON.parse(sessionValue);
          const authToken = sessionData.access_token;

          cy.request({
            method: 'POST',
            url: '/api/partner/services',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: {
              name: directServiceName,
              description: directServiceDescription,
              estimated_days: directEstimatedDays,
              price: directServicePrice,
            },
            failOnStatusCode: false, // Do not fail on non-2xx status codes
          }).then(response => {
            cy.log('Direct API Response for create service:', response.body);
            cy.log('Direct API Response Status:', response.status);
            expect(response.status).to.eq(200);
            expect(response.body.success).to.be.true;
          });
        } else {
          throw new Error('Supabase session value not found in localStorage for direct API test.');
        }
      } else {
        throw new Error('Supabase auth token key not found in localStorage for direct API test.');
      }
    });
  });

  // Future tests for CSV import will go here
});

describe('User Signup Flow', () => {
  const testEmail = `test-signup-${Date.now()}@example.com`;
  const testName = 'Test User';
  const testPassword = 'password123';
  const mailpitApiUrl = 'http://localhost:54324/api/v1/messages';

  before(() => {
    // Limpar emails do Mailpit antes de iniciar os testes
    cy.request('DELETE', mailpitApiUrl);
  });

  it('should allow a user to sign up and verify confirmation email in Mailpit', () => {
    cy.visit('/cadastro');
    cy.url().should('include', '/cadastro');

    cy.get('#fullName').type(testName);
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Verificar mensagem de sucesso ou redirecionamento
    // Assumindo que após o cadastro, o usuário é redirecionado para /confirm-email
    cy.url().should('include', '/confirm-email', { timeout: 10000 });
    cy.contains('Verifique seu e-mail para confirmar sua conta.').should('be.visible');

    // Verificar no Mailpit
    cy.wait(5000); // Dar um tempo para o email chegar no Mailpit
    cy.request(mailpitApiUrl).then(response => {
      expect(response.status).to.eq(200);
      const emails = response.body;
      const confirmationEmail = emails.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (email: any) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email.To.some((to: any) => to.Address === testEmail) &&
          email.Subject.includes('Confirme seu e-mail')
      );
      expect(confirmationEmail).to.exist;
      cy.log('Confirmation email found in Mailpit:', confirmationEmail);
    });
  });
});

describe('Specialist Dashboard Tests', () => {
  beforeEach(() => {
    cy.log('Starting specialist login...');
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.log('Navigated to login page.');

    cy.get('#email').should('be.visible').type(Cypress.env('testSpecialist').email, { log: true });
    cy.log(`Typed email: ${Cypress.env('testSpecialist').email}`);

    cy.get('#password')
      .should('be.visible')
      .type(Cypress.env('testSpecialist').password, { log: true });
    cy.log('Typed password.');

    cy.get('button[type="submit"]').should('be.visible').click({ log: true });
    cy.log('Clicked login button.');

    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('Login successful. Redirected from login page.');

    // The URL should now be /dashboard for all users
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    cy.log('Navigated to dashboard page.');

    // Wait for specialist-specific components to render
    cy.wait(2000);
  });

  it('should display specialist dashboard components after successful login', () => {
    cy.log('Verifying specialist dashboard components...');

    // Verify Header
    cy.get('header').should('be.visible');
    cy.log('Header component is visible.');

    // Verify Specialist-specific content (e.g., a unique text or element in SpecialistDashboard)
    // You'll need to replace this with an actual element or text from your SpecialistDashboard
    cy.contains('Painel do Especialista', { timeout: 10000 }).should('be.visible');
    cy.log('SpecialistDashboard content is visible.');

    cy.log('All specialist dashboard components verified.');
  });
});
