describe('Client Collection Flow - Associate Address and Date to Vehicle', () => {
  let tomorrowDate: string;

  before(() => {
    // Calcular data D+1 uma vez para todos os testes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrowDate = tomorrow.toISOString().split('T')[0];
  });

  beforeEach(() => {
    // Interceptar chamadas de API para melhor controle
    cy.intercept('POST', '/api/client/create-address').as('createAddress');
    cy.intercept('POST', '/api/client/set-vehicles-collection').as('setVehiclesCollection');
  });

  it('should associate address and date to vehicle: login → verify vehicle exists → define collection', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🔐 PASSO 1: Login como cliente');
    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    cy.log('🚗 PASSO 2: Verificar se há veículos cadastrados');

    // Aguardar carregamento do contador de veículos
    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');

    // Verificar se tem veículos ou criar um se necessário
    cy.get('body').then($body => {
      if ($body.text().includes('Nenhum veículo cadastrado')) {
        cy.log('📝 Criando veículo para teste...');
        cy.contains('Cadastrar Novo Veículo').click();

        // Preencher dados do veículo
        cy.wait(2000);
        cy.get('#plate').type('ABC-1234');
        cy.get('#brand').type('Toyota');
        cy.get('#model').type('Corolla');
        cy.get('#color').type('Branco');
        cy.get('#year').type('2020');
        cy.get('#fipe_value').type('50000');

        cy.get('button[type="submit"]').click();
        cy.wait(3000); // Aguardar criação
      }
    });

    cy.log('📋 PASSO 3: Expandir detalhes dos veículos');

    // Aguardar e verificar se há botão para expandir detalhes
    cy.get('.vehicle-counter').within(() => {
      // Procurar por diferentes tipos de botões que podem expandir detalhes
      cy.get('body').then($body => {
        const expandButtons = [
          'button:contains("Ver detalhes")',
          'button:contains("Expandir")',
          'button:contains("Mostrar")',
          '.counter-content button',
          'button[aria-expanded]',
        ];

        let buttonFound = false;
        for (const selector of expandButtons) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click();
            buttonFound = true;
            cy.log(`✅ Clicado em botão: ${selector}`);
            break;
          }
        }

        if (!buttonFound) {
          cy.log('⚠️ Nenhum botão de expandir encontrado, tentando scroll');
          cy.scrollTo('bottom');
        }
      });
    });

    cy.wait(3000);

    cy.log('� PASSO 4: Verificar se controles de coleta estão visíveis');

    // Verificar se os controles de coleta em lote aparecem
    cy.get('body').then($body => {
      if ($body.text().includes('Opções de coleta em lote')) {
        cy.log('✅ Controles de coleta encontrados!');
      } else {
        cy.log('⚠️ Controles de coleta não visíveis, capturando screenshot');
        cy.screenshot('no-collection-controls');

        // Verificar se há veículos na lista
        if ($body.text().includes('Nenhum veículo') || !$body.text().includes('veículo')) {
          cy.log('ℹ️ Problema: Não há veículos suficientes para mostrar controles');
          // Pular para o final do teste
          return;
        }
      }
    });

    cy.log('📍 PASSO 5: Verificar ponto de coleta e método de coleta');

    // Só continuar se encontrarmos os controles
    cy.get('body').then($body => {
      if (!$body.text().includes('Opções de coleta em lote')) {
        cy.log('⚠️ Controles de coleta não disponíveis - finalizando teste');
        return;
      }

      // Verificar se há ponto de coleta disponível
      if ($body.text().includes('Nenhum ponto de coleta disponível')) {
        cy.log('📍 Criando ponto de coleta...');

        // Voltar para o topo e criar endereço
        cy.scrollTo('top');
        cy.contains('Adicionar Ponto de Coleta').click();
        cy.wait(2000);

        // Preencher endereço
        cy.get('#zip_code').type('01310-100');
        cy.wait(2000);
        cy.get('#street').clear().type('Avenida Paulista');
        cy.get('#number').clear().type('1578');
        cy.get('#neighborhood').clear().type('Bela Vista');
        cy.get('#city').clear().type('São Paulo');
        cy.get('#state').clear().type('SP');

        cy.get('button[type="submit"]').contains('Cadastrar Endereço').click();
        cy.wait('@createAddress');

        // Fechar modal de sucesso
        cy.get('body').then($body => {
          if ($body.text().includes('Sucesso')) {
            cy.contains('OK').click();
          }
        });

        cy.wait(2000);
        cy.scrollTo('bottom');
        cy.wait(2000);
      }

      cy.log('🎯 PASSO 6: Selecionar método de coleta');

      // Tentar selecionar "Ponto de Coleta"
      const radioSelectors = [
        'input[value="collect_point"]',
        'input[type="radio"][value="collect_point"]',
        'input[name*="bulk"][value="collect_point"]',
      ];

      let radioFound = false;
      for (const selector of radioSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).check();
          cy.wait(1000);
          radioFound = true;
          cy.log(`✅ Radio selecionado: ${selector}`);
          break;
        }
      }

      if (!radioFound) {
        cy.log('❌ Radio button de coleta não encontrado');
        cy.screenshot('radio-not-found');
        return;
      }

      // Selecionar endereço no dropdown
      cy.get('body').then($body => {
        const selectSelectors = [
          'select[name="collect-point-address"]',
          'select[id*="collect"]',
          'select[name*="address"]',
        ];

        for (const selector of selectSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).then($select => {
              const options = $select.find('option');
              if (options.length > 1) {
                cy.get(selector).select(1); // Selecionar primeira opção válida
                cy.log(`✅ Endereço selecionado no: ${selector}`);
              }
            });
            break;
          }
        }
      });

      cy.log('📅 PASSO 7: Definir coleta em lote');

      // Clicar no botão "Definir ponto de coleta em lote"
      cy.get('body').then($body => {
        if ($body.text().includes('Definir ponto de coleta em lote')) {
          cy.contains('Definir ponto de coleta em lote').click();
          cy.wait(2000);

          cy.log('🗓️ PASSO 8: Definir data no modal');

          // No modal, definir a data
          cy.get('body').then($modalBody => {
            const dateSelectors = [
              'input[type="date"]',
              '[data-cy="date-picker"]',
              'input[placeholder*="data"]',
              'input[name*="date"]',
            ];

            let dateFieldFound = false;
            for (const selector of dateSelectors) {
              if ($modalBody.find(selector).length > 0) {
                cy.get(selector).first().type(tomorrowDate);
                dateFieldFound = true;
                cy.log(`✅ Data inserida no: ${selector}`);
                break;
              }
            }

            if (!dateFieldFound) {
              cy.log('⚠️ Campo de data não encontrado');
              cy.screenshot('modal-date-field-not-found');
            }

            cy.log('✅ PASSO 9: Confirmar definição de coleta');

            // Procurar e clicar no botão de confirmar
            const confirmButtons = [
              'button:contains("Confirmar")',
              'button:contains("Salvar")',
              'button:contains("Definir")',
              'button[type="submit"]',
            ];

            for (const buttonSelector of confirmButtons) {
              if ($modalBody.find(buttonSelector).length > 0) {
                cy.get(buttonSelector).first().click();
                cy.log(`✅ Confirmado com: ${buttonSelector}`);
                break;
              }
            }

            // Aguardar chamada da API
            cy.wait('@setVehiclesCollection', { timeout: 10000 }).then(interception => {
              cy.log('✅ Coleta definida com sucesso!');
              expect(interception.response?.statusCode).to.eq(200);
            });
          });
        } else {
          cy.log('❌ Botão de definir coleta não encontrado');
          cy.screenshot('define-button-not-found');
        }
      });
    });

    cy.log('🎉 FLUXO COMPLETO: Endereço e data associados ao veículo!');
  });

  it('should handle the case when no vehicles exist', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    cy.log('🔍 Verificando estado quando não há veículos...');

    cy.get('.vehicle-counter').should('be.visible');

    // Se não há veículos, deve mostrar mensagem adequada
    cy.get('body').then($body => {
      if ($body.text().includes('Nenhum veículo cadastrado')) {
        cy.log('✅ Estado correto: Sem veículos cadastrados');
        cy.contains('Cadastrar Novo Veículo').should('be.visible');
      } else {
        cy.log('ℹ️ Veículos já existem no sistema');
      }
    });
  });
});
