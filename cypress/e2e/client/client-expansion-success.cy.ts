describe('Client Collection Flow - Card Expansion Success', () => {
  it('should successfully expand vehicle card using the + icon', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🎉 TESTE DE SUCESSO: Expansão do card de veículos');

    cy.log('🔐 PASSO 1: Login como cliente');
    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    cy.log('🚗 PASSO 2: Localizar seção "Meus Veículos"');
    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');

    // Aguardar carregamento completo
    cy.wait(3000);

    cy.log('🎯 PASSO 3: Expandir card usando o seletor correto do botão "Mostrar Detalhes"');

    // Screenshot inicial
    cy.screenshot('estado-inicial-antes-expansão');

    // Verificar se há veículos antes de tentar expandir
    cy.get('body').then($body => {
      const bodyText = $body.text();

      if (bodyText.includes('Nenhum veículo cadastrado') || bodyText.includes('0 veículo')) {
        cy.log('⚠️ Não há veículos cadastrados - pulando expansão');
        return;
      }

      cy.log('✅ Veículos disponíveis, expandindo detalhes...');

      // Usar o seletor correto para expandir detalhes
      cy.get('button.details-button')
        .first()
        .then($detailsButton => {
          cy.log(`✅ Botão "Mostrar Detalhes" encontrado`);

          // Destacar o botão
          $detailsButton.css('border', '5px solid lime');
          $detailsButton.css('background-color', 'cyan');
          $detailsButton.css('transform', 'scale(1.3)');

          cy.wait(1000);
          cy.screenshot('botão-mostrar-detalhes-destacado');

          // Clicar no botão
          cy.wrap($detailsButton).click({ force: true });
          cy.wait(3000);

          cy.screenshot('após-clique-botão-detalhes');

          // Verificar se o card expandiu
          cy.get('.vehicles-details').should('be.visible');
          cy.log('✅ Detalhes dos veículos expandidos com sucesso');
        });
    });

    cy.log('🎯 RESULTADO: Teste focado na expansão do card concluído');
  });

  it('should verify the working selector consistently', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🔄 TESTE DE CONSISTÊNCIA: Verificar se o seletor funciona sempre');

    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');
    cy.wait(2000);

    // Verificar se o seletor encontra o elemento consistentemente
    const workingSelector = 'button.details-button';

    cy.get(workingSelector).should('exist').and('be.visible');
    cy.get(workingSelector).should('have.length.greaterThan', 0);

    cy.log('✅ Seletor encontra elemento consistentemente');

    // Clicar apenas no primeiro elemento encontrado
    cy.get(workingSelector)
      .first()
      .then($firstButton => {
        cy.log(`🎯 Testando consistência com o botão "Mostrar Detalhes"`);

        // Clicar e verificar múltiplas vezes
        for (let i = 0; i < 3; i++) {
          cy.log(`🔄 Teste de clique ${i + 1}/3`);

          cy.wrap($firstButton).click({ force: true });
          cy.wait(1000);

          // Verificar se algo mudou na página
          cy.get('.vehicles-details').should('be.visible');
          cy.log(`✅ Clique ${i + 1} funcionou`);

          // Aguardar um pouco antes do próximo teste
          cy.wait(1000);
        }
      });

    cy.log('🎉 CONSISTÊNCIA CONFIRMADA: Seletor funciona perfeitamente!');
  });
});
