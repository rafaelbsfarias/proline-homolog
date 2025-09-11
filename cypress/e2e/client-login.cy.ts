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
