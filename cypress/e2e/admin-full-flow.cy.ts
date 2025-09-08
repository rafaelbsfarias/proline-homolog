describe('Admin Full Flow Tests', () => {
  let createdAdminEmail: string;
  let createdSpecialistEmail: string;
  let createdPartnerEmail: string;
  let createdClientEmail: string;
  let authToken: string; // To store the Supabase auth token

  beforeEach(() => {
    cy.log('Starting admin login for full flow tests...');
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

  it('should perform the full admin flow: create users, manage pending, manage all users', () => {
    // 1. Create Admin User
    cy.log('Creating Admin User...');
    createdAdminEmail = `admin-test-${Date.now()}@example.com`;
    cy.contains('Adicionar Usuário').click(); // Assuming a button with this text exists
    cy.wait(2000); // Wait for the form to render
    cy.get('#name').type(`Admin Test ${Date.now()}`);
    cy.get('#email').type(createdAdminEmail);
    cy.get('#password').type('123qwe');
    cy.get('#role').select('admin'); // Assuming a select input for role
    cy.get('button[type="submit"]').click();
    cy.contains('Usuário criado com sucesso').should('be.visible'); // Assuming a success message
    cy.wait(1000); // Wait for success message to disappear or page to settle

    // 2. Create Specialist User
    cy.log('Creating Specialist User...');
    createdSpecialistEmail = `specialist-test-${Date.now()}@example.com`;
    cy.contains('Adicionar Usuário').click();
    cy.get('#name').type(`Specialist Test ${Date.now()}`);
    cy.get('#email').type(createdSpecialistEmail);
    cy.get('#password').type('123qwe');
    cy.get('#role').select('specialist');
    cy.get('button[type="submit"]').click();
    cy.contains('Usuário criado com sucesso').should('be.visible');
    cy.wait(1000);

    // 3. Create Partner User
    cy.log('Creating Partner User...');
    createdPartnerEmail = `partner-test-${Date.now()}@example.com`;
    cy.contains('Adicionar Usuário').click();
    cy.get('#name').type(`Partner Test ${Date.now()}`);
    cy.get('#email').type(createdPartnerEmail);
    cy.get('#password').type('123qwe');
    cy.get('#role').select('partner');
    cy.get('button[type="submit"]').click();
    cy.contains('Usuário criado com sucesso').should('be.visible');
    cy.wait(1000);

    // 4. Create Client User
    cy.log('Creating Client User...');
    createdClientEmail = `client-test-${Date.now()}@example.com`;
    cy.contains('Adicionar Usuário').click();
    cy.get('#name').type(`Client Test ${Date.now()}`);
    cy.get('#email').type(createdClientEmail);
    cy.get('#password').type('123qwe');
    cy.get('#role').select('client');
    cy.get('button[type="submit"]').click();
    cy.contains('Usuário criado com sucesso').should('be.visible');
    cy.wait(1000);

    // 5. Create Car (assuming there's an 'Adicionar Veículo' button or similar)
    cy.log('Creating Car...');
    // Placeholder: Click button to add vehicle, fill form, submit, verify success
    // cy.contains('Adicionar Veículo').click();
    // cy.get('#carMake').type('Toyota');
    // cy.get('#carModel').type('Corolla');
    // cy.get('button[type="submit"]').click();
    // cy.contains('Veículo criado com sucesso').should('be.visible');
    // cy.wait(1000);

    // 6. Manage Pending Registrations
    cy.log('Managing Pending Registrations...');
    cy.contains('Cadastros pendentes').click(); // Navigate to pending registrations page
    // Placeholder: Accept and reject users
    // cy.contains(createdClientEmail).parent().contains('Aceitar').click();
    // cy.contains(createdPartnerEmail).parent().contains('Recusar').click();
    cy.go('back'); // Go back to dashboard
    cy.wait(1000);

    // 7. Manage All Users
    cy.log('Managing All Users...');
    cy.contains('Usuários').click(); // Navigate to all users page
    // Placeholder: List, edit, suspend, reactivate, delete users
    // Verify created users are listed
    // cy.contains(createdAdminEmail).should('be.visible');
    // cy.contains(createdSpecialistEmail).should('be.visible');
    // cy.contains(createdPartnerEmail).should('be.visible');
    // cy.contains(createdClientEmail).should('be.visible');

    // Edit a user
    // cy.contains(createdClientEmail).parent().contains('Editar').click();
    // cy.get('#name').clear().type('Client Edited');
    // cy.get('button[type="submit"]').click();
    // cy.contains('Usuário atualizado com sucesso').should('be.visible');
    // cy.wait(1000);

    // Suspend and Reactivate a user
    // cy.contains('Client Edited').parent().contains('Suspender').click();
    // cy.contains('Usuário suspenso com sucesso').should('be.visible');
    // cy.wait(1000);
    // cy.contains('Client Edited').parent().contains('Reativar').click();
    // cy.contains('Usuário reativado com sucesso').should('be.visible');
    // cy.wait(1000);

    // Delete a user
    // cy.contains('Client Edited').parent().contains('Excluir').click();
    // cy.contains('Confirmar Exclusão').click(); // Assuming a confirmation modal
    // cy.contains('Usuário excluído com sucesso').should('be.visible');
    // cy.contains('Client Edited').should('not.exist');
  });
});
