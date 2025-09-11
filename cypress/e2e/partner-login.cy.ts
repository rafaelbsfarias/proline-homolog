describe('Partner Dashboard Tests', () => {
  const partnerEmail = Cypress.env('testPartner').email;
  const partnerPassword = Cypress.env('testPartner').password;

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
