describe('Client Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/login'); // Assuming the login page is at /login
  });

  it('should allow client to login and view dashboard', () => {
    // Input client credentials
    cy.get('input[name="email"]').type('cliente@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Verify successful login and redirection to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Painel do Cliente').should('be.visible'); // Assuming this text appears for client
    // Further checks for client dashboard elements can be added here
  });
});
