describe('Specialist Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/login'); // Assuming the login page is at /login
  });

  it('should allow specialist to login and view dashboard', () => {
    // Input specialist credentials
    cy.get('input[name="email"]').type('especialista@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Verify successful login and redirection to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Painel do Especialista').should('be.visible'); // Assuming this text appears for specialist
    // Further checks for specialist dashboard elements can be added here
  });
});
