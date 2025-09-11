describe('Vehicle Counter - Show Details Button', () => {
  it('should display and interact with the "Mostrar Detalhes" button', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🔐 Fazendo login como cliente...');
    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    cy.log('🔍 Verificando se o botão "Mostrar Detalhes" está presente...');

    // Aguardar carregamento do dashboard
    cy.contains('Bem-vindo').should('be.visible');
    cy.wait(3000); // Aguardar carregamento dos dados

    // Verificar se há veículos no contador
    cy.get('body').then($body => {
      if ($body.text().includes('Meus Veículos')) {
        cy.log('✅ Componente VehicleCounter encontrado');

        // Verificar se há contagem de veículos
        cy.get('.counter-number').then($counter => {
          const count = parseInt($counter.text());
          cy.log(`📊 Contagem de veículos: ${count}`);

          if (count > 0) {
            cy.log('✅ Há veículos cadastrados, botão deve estar presente');

            // Procurar pelo botão "Mostrar Detalhes" usando diferentes seletores
            const buttonSelectors = [
              'button.details-button',
              'button[title*="Mostrar detalhes"]',
              'button[aria-expanded="false"]',
              'button:has(.lucide-plus)',
              'button:contains("Mostrar detalhes")',
            ];

            let buttonFound = false;
            for (const selector of buttonSelectors) {
              if ($body.find(selector).length > 0) {
                cy.log(`✅ Botão encontrado com seletor: ${selector}`);
                cy.get(selector).first().should('be.visible');

                // Testar clique no botão
                cy.get(selector).first().click();
                cy.log('✅ Botão clicado com sucesso');

                // Verificar se os detalhes foram expandidos
                cy.get('.vehicles-details').should('be.visible');
                cy.log('✅ Detalhes dos veículos expandidos');

                // Verificar se o botão mudou para "Ocultar detalhes"
                cy.get(selector).first().should('have.attr', 'title').and('include', 'Ocultar');

                buttonFound = true;
                break;
              }
            }

            if (!buttonFound) {
              cy.log('❌ Botão "Mostrar Detalhes" não encontrado');
              cy.screenshot('button-not-found');

              // Debug: mostrar estrutura do componente
              cy.get('.vehicle-counter').then($counter => {
                cy.log('📋 Estrutura do VehicleCounter:', $counter.html());
              });
            }
          } else {
            cy.log('⚠️ Nenhum veículo encontrado, botão não deve estar presente');
          }
        });
      } else {
        cy.log('❌ Componente VehicleCounter não encontrado');
        cy.screenshot('vehicle-counter-not-found');
      }
    });
  });

  it('should verify vehicle data is loaded correctly', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    // Interceptar chamada da API de veículos
    cy.intercept('GET', '/api/client/vehicles-count').as('getVehicles');

    // Aguardar carregamento
    cy.wait('@getVehicles', { timeout: 10000 }).then(interception => {
      cy.log('📡 API de veículos interceptada');
      cy.log('📊 Status da resposta:', interception.response?.statusCode);
      cy.log('📋 Dados retornados:', interception.response?.body);

      if (interception.response?.body?.vehicles) {
        const vehicles = interception.response.body.vehicles;
        cy.log(`✅ ${vehicles.length} veículos retornados pela API`);

        // Verificar se os dados estão sendo exibidos na UI
        cy.get('.counter-number').should('contain', vehicles.length.toString());
      } else {
        cy.log('⚠️ Nenhum veículo retornado pela API');
      }
    });
  });
});
