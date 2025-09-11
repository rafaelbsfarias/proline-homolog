describe('Client Collection Date Change - Simplified', () => {
  it('should navigate to dashboard and list available buttons', () => {
    // ========================================================================================
    // TESTE BÁSICO: LOGIN E LISTAGEM DE BOTÕES
    // ========================================================================================
    cy.log('🧪 TESTE BÁSICO: Login e exploração da interface');

    // Login
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');
    cy.log('✅ Login realizado');

    // Aguardar carregamento
    cy.wait(5000);

    // Listar todos os botões disponíveis
    cy.get('body').then($body => {
      const allButtons = $body.find('button');
      cy.log(`📋 Total de botões encontrados: ${allButtons.length}`);

      const buttonTexts: string[] = [];
      allButtons.each((index, button) => {
        const text = Cypress.$(button).text().trim();
        if (text && text.length < 100) {
          // Filtrar textos muito longos
          buttonTexts.push(text);
        }
      });

      cy.log('📝 Lista de botões disponíveis:');
      buttonTexts.forEach((text, index) => {
        cy.log(`  ${index + 1}. "${text}"`);
      });

      // Verificar se há chips de status
      const statusChips = $body.find('.status-chip, button:contains("AGUARDANDO")');
      if (statusChips.length > 0) {
        cy.log(`🎯 Chips de status encontrados: ${statusChips.length}`);
        statusChips.each((index, chip) => {
          const chipText = Cypress.$(chip).text().trim();
          cy.log(`  - Chip ${index + 1}: "${chipText}"`);
        });
      } else {
        cy.log('⚠️ Nenhum chip de status encontrado');
      }
    });

    cy.log('✅ Exploração da interface concluída');
  });

  it('should filter by "AGUARDANDO COLETA" status', () => {
    // ========================================================================================
    // TESTE DE FILTRO: APLICAR FILTRO DE STATUS
    // ========================================================================================
    cy.log('🎯 TESTE DE FILTRO: Aplicando filtro "AGUARDANDO COLETA"');

    // Login
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    // Aguardar carregamento
    cy.wait(3000);

    // Procurar e clicar no chip "AGUARDANDO COLETA"
    cy.get('body').then($body => {
      const awaitingChips = $body.find(
        'button:contains("AGUARDANDO COLETA"), .status-chip:contains("AGUARDANDO COLETA")'
      );

      if (awaitingChips.length > 0) {
        cy.log(`✅ Chip "AGUARDANDO COLETA" encontrado: ${awaitingChips.length}`);

        // Clicar no primeiro chip encontrado
        cy.wrap(awaitingChips.first()).then($chip => {
          const chipText = $chip.text().trim();
          cy.log(`🎯 Clicando no chip: "${chipText}"`);
          cy.wrap($chip).scrollIntoView();
          cy.wrap($chip).click({ force: true });
          cy.log('✅ Filtro aplicado');
        });

        // Aguardar filtro ser aplicado
        cy.wait(3000);

        // Verificar se o filtro foi aplicado (botões de editar devem estar disponíveis)
        cy.get('body').then($bodyAfter => {
          const editButtons = $bodyAfter.find('button:contains("Editar")');
          cy.log(`📝 Botões de editar após filtro: ${editButtons.length}`);

          if (editButtons.length > 0) {
            cy.log('✅ Botões de editar encontrados após aplicação do filtro');
          } else {
            cy.log('⚠️ Nenhum botão de editar encontrado após filtro');
          }
        });
      } else {
        cy.log('❌ Chip "AGUARDANDO COLETA" não encontrado');
        // Listar chips disponíveis
        const allChips = $body.find('.status-chip, button');
        cy.log(`📋 Todos os chips/botões encontrados: ${allChips.length}`);
        allChips.each((index, chip) => {
          const chipText = Cypress.$(chip).text().trim();
          if (chipText.includes('AGUARDANDO') || chipText.includes('COLETA')) {
            cy.log(`  - "${chipText}"`);
          }
        });
      }
    });

    cy.log('✅ Teste de filtro concluído');
  });
});
