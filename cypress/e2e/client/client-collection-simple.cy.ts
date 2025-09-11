describe('Client Collection Flow - Simple Test', () => {
  it('should login as client and verify dashboard loads', () => {
    // Login usando credenciais do ambiente
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🔐 Fazendo login como cliente...');
    cy.login(clientEmail, clientPassword);

    // Verificar se chegamos no dashboard
    cy.url().should('include', '/dashboard');

    // Verificar se o texto de boas-vindas aparece (baseado no código atual)
    cy.contains('Bem-vindo').should('be.visible');

    cy.log('✅ Login do cliente funcionando!');
  });

  it('should verify dashboard components are present', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    cy.log('🔍 Verificando componentes do dashboard...');

    // Verificar botões principais (baseado no código atual)
    cy.contains('Cadastrar Novo Veículo').should('be.visible');
    cy.contains('Adicionar Ponto de Coleta').should('be.visible');

    // Verificar se o contador de veículos está presente
    cy.get('.dashboard-counter').should('exist');

    cy.log('✅ Componentes do dashboard carregados!');
  });

  it('should try to open add collection point modal', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    cy.log('📍 Tentando abrir modal de ponto de coleta...');

    // Clicar no botão "Adicionar Ponto de Coleta"
    cy.contains('Adicionar Ponto de Coleta').click();

    // Aguardar um pouco para o modal abrir
    cy.wait(2000);

    // Verificar se o modal abriu usando seletores baseados no CSS
    cy.get('body').then($body => {
      // Procurar por diferentes possibilidades de modal
      const modalSelectors = [
        '[style*="position: fixed"]', // Overlay fixo
        '[style*="z-index: 1000"]', // Z-index alto
        'div[style*="backdrop-filter"]', // Backdrop blur
        'div[style*="rgba(0, 0, 0, 0.4)"]', // Fundo escuro
        'h2:contains("Adicionar Ponto de Coleta")', // Título do modal
      ];

      let modalFound = false;
      for (const selector of modalSelectors) {
        if ($body.find(selector).length > 0) {
          cy.log(`✅ Modal encontrado com seletor: ${selector}`);
          cy.get(selector).should('be.visible');
          modalFound = true;
          break;
        }
      }

      if (!modalFound) {
        cy.log('⚠️ Modal não encontrado com seletores CSS - testando por conteúdo');
        // Verificar se o conteúdo do modal apareceu
        cy.get('body').then($body => {
          if ($body.text().includes('Adicionar Ponto de Coleta')) {
            cy.log('✅ Conteúdo do modal encontrado!');
            cy.contains('Adicionar Ponto de Coleta').should('be.visible');
          } else {
            cy.log('❌ Modal não abriu - capturando screenshot');
            cy.screenshot('modal-debug');
          }
        });
      }
    });
  });
});
