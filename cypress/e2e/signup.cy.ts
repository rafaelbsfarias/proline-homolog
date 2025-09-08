describe('User Signup Flow', () => {
  const testEmail = `test-signup-${Date.now()}@example.com`;
  const testName = 'Test User';
  const testPassword = 'password123';
  const mailpitApiUrl = 'http://localhost:54324/api/v1/messages';

  before(() => {
    // Limpar emails do Mailpit antes de iniciar os testes
    cy.request('DELETE', mailpitApiUrl);
  });

  it('should allow a user to sign up and verify confirmation email in Mailpit', () => {
    cy.visit('/cadastro');
    cy.url().should('include', '/cadastro');

    cy.get('#name').type(testName);
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Verificar mensagem de sucesso ou redirecionamento
    // Assumindo que após o cadastro, o usuário é redirecionado para /confirm-email
    cy.url().should('include', '/confirm-email', { timeout: 10000 });
    cy.contains('Verifique seu e-mail para confirmar sua conta.').should('be.visible');

    // Verificar no Mailpit
    cy.wait(5000); // Dar um tempo para o email chegar no Mailpit
    cy.request(mailpitApiUrl).then(response => {
      expect(response.status).to.eq(200);
      const emails = response.body;
      const confirmationEmail = emails.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (email: any) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email.To.some((to: any) => to.Address === testEmail) &&
          email.Subject.includes('Confirme seu e-mail')
      );
      expect(confirmationEmail).to.exist;
      cy.log('Confirmation email found in Mailpit:', confirmationEmail);
    });
  });
});
