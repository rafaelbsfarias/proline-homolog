describe('Specialist Dashboard Tests', () => {
  const specialistEmail = Cypress.env('testSpecialist').email;
  const specialistPassword = Cypress.env('testSpecialist').password;

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
