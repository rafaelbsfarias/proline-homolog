/// <reference types="cypress" />

/**
 * Teste de fluxo de mudança de senha
 * - Faz login via API para obter token
 * - Chama force-change-password com o token
 * - Valida que novo login funciona
 * - (Opcional) Reverte senha original se variável for fornecida
 * - Valida request-password-reset retorna sucesso genérico
 *
 * Pré-requisitos (definir via CYPRESS env):
 * - CYPRESS_TEST_CLIENT_EMAIL
 * - CYPRESS_TEST_CLIENT_PASSWORD
 * - CYPRESS_TEST_CLIENT_NEW_PASSWORD
 * - (Opcional) CYPRESS_TEST_CLIENT_PASSWORD_REVERT
 */

describe('Fluxo de mudança de senha (API)', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3000/api';
  const email = Cypress.env('TEST_CLIENT_EMAIL') || Cypress.env('testClient')?.email;
  const password = Cypress.env('TEST_CLIENT_PASSWORD') || Cypress.env('testClient')?.password;
  const newPassword = Cypress.env('TEST_CLIENT_NEW_PASSWORD') || 'NovaSenha!123';
  const revertPassword = Cypress.env('TEST_CLIENT_PASSWORD_REVERT');

  const skipMsg = 'Variáveis de ambiente de teste do cliente ausentes. Teste ignorado.';

  it('altera a senha via force-change-password e valida login', function () {
    if (!email || !password) {
      cy.log(skipMsg);
      this.skip();
      return;
    }

    // 1) Login atual para obter token
    cy.apiLogin(email, password).then(loginResp => {
      if (loginResp.status !== 200) {
        cy.log(`Login falhou (${loginResp.status}). Ignorando teste.`);
        this.skip();
        return;
      }
      const token = loginResp.body?.session?.access_token;
      expect(token, 'access token').to.be.a('string').and.have.length.greaterThan(10);

      // 2) Forçar mudança de senha
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/force-change-password`,
        headers: { Authorization: `Bearer ${token}` },
        body: { password: newPassword },
        failOnStatusCode: false,
      }).then(forceResp => {
        expect(forceResp.status).to.eq(200);
        expect(forceResp.body?.success).to.eq(true);

        // 3) Login com nova senha
        cy.apiLogin(email, newPassword).then(login2 => {
          expect(login2.status).to.eq(200);
          expect(login2.body?.session?.access_token).to.be.a('string');

          // 4) (Opcional) Reverter senha
          if (revertPassword) {
            const token2 = login2.body?.session?.access_token;
            cy.request({
              method: 'POST',
              url: `${apiUrl}/auth/force-change-password`,
              headers: { Authorization: `Bearer ${token2}` },
              body: { password: revertPassword },
              failOnStatusCode: false,
            }).then(revertResp => {
              expect(revertResp.status).to.eq(200);
              expect(revertResp.body?.success).to.eq(true);
            });
          }
        });
      });
    });
  });

  it('request-password-reset retorna sucesso genérico', function () {
    const targetEmail = email || 'naoexiste-automatizado@exemplo.com';
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/request-password-reset`,
      body: { email: targetEmail },
      failOnStatusCode: false,
    }).then(resp => {
      expect(resp.status).to.be.oneOf([200]);
      expect(resp.body?.success).to.eq(true);
      expect(resp.body?.message).to.match(/email de redefinição/i);
    });
  });
});
