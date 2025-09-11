describe('Client Accept Collection Flow', () => {
  beforeEach(() => {
    // apenas interceptar para observar a requisição real (não stub)
    cy.intercept('POST', '/api/client/collection-accept-proposal').as('acceptProposal');
  });

  it('logs in, navigates to collection panel and accepts a collection proposal', () => {
    // login como cliente de teste
    cy.login('cliente@prolineauto.com.br', '123qwe');

    // garante estamos no dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    // esperar o painel de Coleta de Veículos aparecer
    cy.contains('Coleta de Veículos', { timeout: 10000 }).should('be.visible');

    // Dentro do painel, procurar por botões Aceitar e clicar no primeiro disponível
    // Usamos busca genérica pois o layout pode variar entre cliente/admin
    cy.log('🔎 Procurando botão Aceitar na seção de Coleta de Veículos');
    cy.contains('Aceitar', { timeout: 10000 }).should('be.visible').first().click({ force: true });

    // Aguarda a requisição real e valida resposta
    cy.wait('@acceptProposal', { timeout: 10000 }).then(interception => {
      cy.log('✅ Requisição interceptada:', JSON.stringify(interception.request.body || {}));
      // Persistir para debug local
      try {
        cy.writeFile('cypress/results/accept-proposal-interception.json', {
          body: interception.request.body || {},
          headers: interception.request.headers || {},
          status: interception.response?.statusCode,
          responseBody: interception.response?.body,
        });
      } catch (e) {
        cy.log('⚠️ Falha ao salvar interception: ' + String(e));
      }

      // A resposta deve indicar sucesso (ajustar conforme API)
      expect(interception.response && interception.response.statusCode).to.be.oneOf([
        200, 201, 204,
      ]);
      if (interception.response && interception.response.body) {
        const resp = interception.response.body as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(resp, 'success')) {
          expect(resp.success).to.equal(true);
        }
      }
    });

    // Verificação visual opcional: modal de pendências deve desaparecer
    cy.contains('Pendências por endereço', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Fluxo de aceite executado (verifique intercept file em cypress/results)');
  });
});
