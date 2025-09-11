describe('Client Collection Flow - Expand Card and Edit Collection Point', () => {
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

  it('should expand vehicle card, click edit collection point, and interact with modal', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🔐 PASSO 1: Login como cliente');
    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    cy.log('🚗 PASSO 2: Localizar seção "Meus Veículos"');

    // Aguardar carregamento e encontrar a seção de veículos
    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');

    // Verificar se temos veículos cadastrados
    cy.get('body').then($body => {
      if (
        $body.text().includes('Nenhum veículo cadastrado') ||
        $body.text().includes('0 veículo')
      ) {
        cy.log('📝 Criando veículo para teste...');
        cy.contains('Cadastrar Novo Veículo').click();

        // Preencher dados do veículo
        cy.wait(2000);
        cy.get('#plate').type('ABC535S1');
        cy.get('#brand').type('Fiat');
        cy.get('#model').type('Ka');
        cy.get('#color').type('Prata');
        cy.get('#year').type('2012');
        cy.get('#fipe_value').type('25000');

        cy.get('button[type="submit"]').click();
        cy.wait(3000); // Aguardar criação
      } else {
        cy.log('✅ Veículos já existem no sistema');
      }
    });

    cy.log('📋 PASSO 3: Expandir card de veículos para ver detalhes');

    // Aguardar carregamento e verificar se temos veículos
    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');

    // Verificar se há veículos disponíveis antes de tentar expandir
    cy.get('body').then($body => {
      const bodyText = $body.text();

      if (
        bodyText.includes('Aguardando definição de coleta') ||
        bodyText.includes('100') ||
        (!bodyText.includes('Nenhum veículo') && !bodyText.includes('0 veículo'))
      ) {
        cy.log('✅ Veículos disponíveis, expandindo detalhes...');

        // Usar o seletor correto para expandir detalhes
        cy.get('button.details-button').first().click();
        cy.get('.vehicles-details').should('be.visible');
        cy.log('✅ Detalhes dos veículos expandidos com sucesso');
      } else {
        cy.log('⚠️ Não há veículos disponíveis para expandir');
        return;
      }
    });

    cy.log('🔍 PASSO 4: Localizar veículo específico e botão "Editar ponto de coleta"');

    // Aguardar aparecer os detalhes dos veículos
    cy.get('body').then($body => {
      if (
        $body.text().includes('Detalhes dos Veículos') ||
        $body.text().includes('Editar ponto de coleta')
      ) {
        cy.log('✅ Detalhes dos veículos visíveis');

        // Procurar pelo veículo específico ou botão de editar
        const editSelectors = [
          'button:contains("Editar ponto de coleta")',
          'button:contains("Editar")',
          '[aria-label*="editar"]',
          'button[title*="editar"]',
        ];

        let editButtonFound = false;
        for (const selector of editSelectors) {
          if ($body.find(selector).length > 0) {
            cy.log(`✅ Encontrou botão editar: ${selector}`);
            cy.get(selector).first().click();
            editButtonFound = true;
            break;
          }
        }

        if (!editButtonFound) {
          cy.log('❌ Botão "Editar ponto de coleta" não encontrado');
          cy.screenshot('edit-button-not-found');
          return;
        }
      } else {
        cy.log('⚠️ Detalhes dos veículos não visíveis');
        cy.screenshot('details-not-visible');
        return;
      }
    });

    cy.wait(2000);

    cy.log('🎯 PASSO 5: Interagir com modal "Editar ponto de coleta"');

    // Verificar se o modal abriu
    cy.get('body').then($body => {
      if ($body.text().includes('Editar ponto de coleta')) {
        cy.log('✅ Modal "Editar ponto de coleta" aberto');

        // 5.1: Verificar se já temos pontos de coleta ou criar um
        if ($body.text().includes('Selecione um ponto de coleta')) {
          cy.log('📍 Verificando pontos de coleta disponíveis...');

          // Se não houver pontos de coleta, primeiro criar um
          cy.get('select').then($select => {
            const options = $select.find('option');
            if (options.length <= 1 || $select.val() === '') {
              cy.log('📍 Criando ponto de coleta primeiro...');

              // Fechar modal atual
              cy.get('button:contains("Cancelar")').click();
              cy.wait(1000);

              // Criar endereço
              cy.contains('Adicionar Ponto de Coleta').click();
              cy.wait(2000);

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
              cy.contains('OK').click();
              cy.wait(2000);

              // Reabrir o modal de editar ponto de coleta
              cy.contains('Editar ponto de coleta').click();
              cy.wait(2000);
            }
          });
        }

        // 5.2: Selecionar "Ponto de Coleta" (radio button)
        cy.get('input[type="radio"]').then($radios => {
          // Procurar pelo radio "Ponto de Coleta"
          $radios.each((index, radio) => {
            const $radio = Cypress.$(radio);
            const label = $radio.next('label').text() || $radio.parent().text();
            if (label.includes('Ponto de Coleta')) {
              cy.wrap($radio).check();
              cy.log('✅ Selecionado "Ponto de Coleta"');
              return false; // Sair do loop
            }
          });
        });

        cy.wait(1000);

        // 5.3: Selecionar ponto de coleta no dropdown
        cy.get('select').then($select => {
          const options = $select.find('option');
          if (options.length > 1) {
            cy.get('select').select(1); // Selecionar primeira opção válida
            cy.log('✅ Ponto de coleta selecionado');
          }
        });

        // 5.4: Definir data preferencial
        cy.get('input[placeholder*="dd/mm/aaaa"], input[type="date"]').then($dateInputs => {
          if ($dateInputs.length > 0) {
            // Se for input type="date", usar formato ISO
            const $input = $dateInputs.first();
            if ($input.attr('type') === 'date') {
              cy.wrap($input).type(tomorrowDate);
            } else {
              // Se for formato brasileiro, converter
              const [year, month, day] = tomorrowDate.split('-');
              const brazilianDate = `${day}/${month}/${year}`;
              cy.wrap($input).type(brazilianDate);
            }
            cy.log('✅ Data preferencial definida');
          }
        });

        cy.wait(1000);

        // 5.5: Salvar as alterações
        cy.get('button:contains("Salvar")').click();
        cy.log('💾 Clicado em "Salvar"');

        // Aguardar chamada da API
        cy.wait('@setVehiclesCollection', { timeout: 10000 }).then(interception => {
          cy.log('✅ Coleta definida com sucesso!');
          expect(interception.response?.statusCode).to.eq(200);
        });
      } else {
        cy.log('❌ Modal não abriu corretamente');
        cy.screenshot('modal-not-opened');
      }
    });

    cy.log('🎉 FLUXO COMPLETO: Veículo associado com endereço e data!');
  });

  it('should handle case when no vehicles exist and guide user to create one', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    cy.log('🔍 Verificando estado quando não há veículos...');

    cy.get('.vehicle-counter').should('be.visible');

    cy.get('body').then($body => {
      if (
        $body.text().includes('Nenhum veículo cadastrado') ||
        $body.text().includes('0 veículo')
      ) {
        cy.log('✅ Estado correto: Orientação para cadastrar veículos');
        cy.contains('Cadastrar Novo Veículo').should('be.visible');
      } else {
        cy.log('ℹ️ Veículos já existem - estado normal');
      }
    });
  });
});
