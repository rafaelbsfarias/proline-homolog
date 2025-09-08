describe('Admin Dashboard Tests', () => {
  let createdUserId: string; // To store the ID of the user created for testing
  let authToken: string; // To store the Supabase auth token

  beforeEach(() => {
    cy.log('Starting admin login...');
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.log('Navigated to login page.');

    cy.get('#email').should('be.visible').type(Cypress.env('testAdmin').email, { log: true });
    cy.log(`Typed email: ${Cypress.env('testAdmin').email}`);

    cy.get('#password').should('be.visible').type(Cypress.env('testAdmin').password, { log: true });
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
          throw new Error('Supabase auth token value is null or empty.');
        }
      } else {
        throw new Error('Supabase auth token not found in localStorage.');
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
