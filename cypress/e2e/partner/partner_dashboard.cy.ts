describe('Partner Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/login'); // Assuming the login page is at /login
  });

  it('should allow partner to login and view dashboard', () => {
    // Input partner credentials
    cy.get('input[name="email"]').type('parceiro@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Verify successful login and redirection to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Painel do Parceiro').should('be.visible'); // Assuming this text appears for partner
    // Further checks for partner dashboard elements can be added here
  });
});
