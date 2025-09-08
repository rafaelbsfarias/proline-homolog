describe('Admin Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/login'); // Assuming the login page is at /login
  });

  it('should allow admin to login and view dashboard', () => {
    // Input admin credentials
    cy.get('input[name="email"]').type('admin@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Verify successful login and redirection to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo, Administrador').should('be.visible'); // Assuming this text appears for admin
    // Further checks for admin dashboard elements can be added here
  });

  // Add more tests for admin functionalities later
});
