describe('Forgot Password Flow', () => {
  const testEmail = `test-forgot-password-${Date.now()}@example.com`;
  const mailpitApiUrl = 'http://localhost:54324/api/v1/messages';

  before(() => {
    // Limpar emails do Mailpit antes de iniciar os testes
    cy.request('DELETE', mailpitApiUrl);
  });

  it('should send a password reset email and verify it in Mailpit', () => {
    cy.visit('/forgot-password');
    cy.url().should('include', '/forgot-password');

    cy.get('#email').type(testEmail);
    cy.get('button[type="submit"]').click();

    // Verificar mensagem de sucesso na UI
    cy.contains('Email enviado com sucesso! Verifique sua caixa de entrada.').should('be.visible');

    // Verificar no Mailpit
    cy.wait(15000); // Dar um tempo maior para o email chegar no Mailpit
    cy.request(mailpitApiUrl).then(response => {
      console.log('Mailpit API Response Body:', response.body); // Log para o console do navegador
      expect(response.status).to.eq(200);
      const emails = response.body.items || response.body.messages || response.body;
      expect(Array.isArray(emails)).to.be.true; // Asserção para garantir que é um array
      cy.task('log', 'Emails found in Mailpit:');
      cy.task('log', emails);
      const resetEmail = emails.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (email: any) => {
          cy.task(
            'log',
            `Checking email: To: ${JSON.stringify(email.To)}, Subject: ${email.Subject}`
          );
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            email.To.some((to: any) => to.Address === testEmail) &&
            email.Subject.includes('Redefinir Senha')
          );
        }
      );
      expect(resetEmail).to.exist;
      cy.log('Password reset email found in Mailpit:', resetEmail);
    });
  });
});
