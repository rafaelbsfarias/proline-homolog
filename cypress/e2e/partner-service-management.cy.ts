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
            expect(response.status).to.eq(200); // Expect a 200 OK status
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
