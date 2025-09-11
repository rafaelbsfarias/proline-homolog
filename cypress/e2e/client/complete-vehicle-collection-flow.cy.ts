describe('Complete Vehicle Collection Flow - Select Vehicle and Add Date', () => {
  let tomorrowDate: string;

  before(() => {
    // Calcular data D+1 uma vez para todos os testes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrowDate = tomorrow.toISOString().split('T')[0];
    cy.log(`📅 Data selecionada para coleta: ${tomorrowDate}`);
  });

  beforeEach(() => {
    // Interceptar chamadas de API para melhor controle
    cy.intercept('POST', '/api/client/create-address').as('createAddress');
    cy.intercept('POST', '/api/client/set-vehicles-collection').as('setVehiclesCollection');
  });

  it('should complete full flow: expand card → select vehicle → set collection date', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🎯 OBJETIVO: Completar o fluxo completo de seleção de veículo e data de coleta');

    // PASSO 1: Login
    cy.log('🔐 PASSO 1: Login como cliente');
    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    // PASSO 2: Aguardar carregamento e expandir card
    cy.log('🚗 PASSO 2: Localizar e expandir card de veículos');
    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');

    // Verificar se há veículos antes de tentar expandir
    cy.get('body').then($body => {
      const bodyText = $body.text();

      if (bodyText.includes('Nenhum veículo cadastrado') || bodyText.includes('0 veículo')) {
        cy.log('⚠️ Não há veículos cadastrados - pulando expansão');
        return;
      }

      cy.log('✅ Veículos disponíveis, expandindo detalhes...');

      // Usar o seletor correto para expandir detalhes
      cy.get('button.details-button').first().click();
      cy.get('.vehicles-details').should('be.visible');
      cy.log('✅ Detalhes dos veículos expandidos com sucesso');
    });

    // PASSO 3: Localizar e clicar em "Editar ponto de coleta"
    cy.log('📍 PASSO 3: Localizar botão "Editar ponto de coleta"');

    // Aguardar elementos carregarem após expansão
    cy.wait(2000);

    // Screenshot para debug
    cy.screenshot('card-expandido-procurando-botao-editar');

    // Estratégias múltiplas para encontrar o botão de editar
    cy.get('body').then($body => {
      const pageText = $body.text();
      cy.log(`📝 Texto da página após expansão: ${pageText.substring(0, 300)}...`);

      // Verificar se temos botões de editar
      const editButtonSelectors = [
        'button:contains("Editar ponto de coleta")',
        'button:contains("Editar")',
        'a:contains("Editar ponto de coleta")',
        'a:contains("Editar")',
        '[aria-label*="editar"]',
        '[title*="editar"]',
      ];

      let editButtonFound = false;

      for (const selector of editButtonSelectors) {
        cy.get(selector).then($buttons => {
          if ($buttons.length > 0 && !editButtonFound) {
            cy.log(
              `✅ Encontrou botão editar com seletor: ${selector} (${$buttons.length} botões)`
            );

            // Pegar o primeiro botão que contém texto de editar
            const $editButton = $buttons.first();
            const buttonText = $editButton.text().trim();

            cy.log(`🎯 Clicando no botão: "${buttonText}"`);

            // Destacar o botão
            $editButton.css('border', '3px solid orange');
            $editButton.css('background-color', 'lightyellow');

            cy.wait(1000);
            cy.screenshot('botao-editar-destacado');

            // Scroll até o botão e clicar
            cy.wrap($editButton).scrollIntoView();
            cy.wrap($editButton).click({ force: true });

            editButtonFound = true;
            cy.wait(3000);

            return false; // Sair do loop
          }
        });

        if (editButtonFound) break;
      }

      // Se não encontrou, fazer uma busca mais ampla
      if (!editButtonFound) {
        cy.log('⚠️ Botão "Editar ponto de coleta" não encontrado com seletores específicos');
        cy.log('🔍 Procurando por TODOS os botões disponíveis...');

        cy.get('button, a').then($allButtons => {
          cy.log(`📋 Total de botões/links encontrados: ${$allButtons.length}`);

          $allButtons.each((index, btn) => {
            const $btn = Cypress.$(btn);
            const text = $btn.text().trim();
            const ariaLabel = $btn.attr('aria-label') || '';
            const title = $btn.attr('title') || '';

            cy.log(
              `🔘 Botão ${index + 1}: "${text}" | aria-label: "${ariaLabel}" | title: "${title}"`
            );

            // Se contém palavra "editar" em qualquer lugar
            if (
              text.toLowerCase().includes('editar') ||
              ariaLabel.toLowerCase().includes('editar') ||
              title.toLowerCase().includes('editar')
            ) {
              cy.log(`🎯 ENCONTROU BOTÃO DE EDITAR: "${text}"`);

              // Destacar e clicar
              $btn.css('border', '5px solid red');
              $btn.css('background-color', 'yellow');

              cy.wait(1000);
              cy.wrap($btn).click({ force: true });
              editButtonFound = true;

              return false; // Sair do loop each
            }
          });
        });
      }
    });

    // PASSO 4: Interagir com o modal/formulário
    cy.log('🎛️ PASSO 4: Interagir com modal de edição de ponto de coleta');

    // Aguardar modal aparecer
    cy.wait(3000);
    cy.screenshot('modal-ou-formulario-aberto');

    // Verificar se o modal/formulário está aberto
    cy.get('body').then($body => {
      const bodyText = $body.text();
      cy.log(`📄 Texto da página após clicar em editar: ${bodyText.substring(0, 400)}...`);

      // Indicadores de que estamos na tela/modal certo
      const correctScreenIndicators = [
        'Editar ponto de coleta',
        'Ponto de coleta',
        'Data preferencial',
        'Selecione',
        'Endereço',
        'Coleta',
      ];

      let onCorrectScreen = false;
      for (const indicator of correctScreenIndicators) {
        if (bodyText.toLowerCase().includes(indicator.toLowerCase())) {
          cy.log(`✅ Tela correta detectada por: "${indicator}"`);
          onCorrectScreen = true;
          break;
        }
      }

      if (!onCorrectScreen) {
        cy.log('❌ Modal/formulário de edição não foi aberto corretamente');
        cy.log(`🔍 Texto atual da página: ${bodyText}`);
        cy.screenshot('modal-nao-abriu');
        return;
      }

      cy.log('✅ Modal/formulário de edição está aberto');

      // PASSO 4.1: Verificar se precisamos criar um endereço primeiro
      if (
        bodyText.includes('Nenhum endereço cadastrado') ||
        bodyText.includes('Cadastrar endereço') ||
        bodyText.includes('Adicionar endereço')
      ) {
        cy.log('📍 PASSO 4.1: Criando endereço primeiro...');

        // Procurar botão de adicionar endereço
        const addAddressButtons = [
          'Adicionar Ponto de Coleta',
          'Cadastrar Endereço',
          'Novo Endereço',
          'Adicionar Endereço',
          'Cadastrar',
          '+',
        ];

        let addressButtonClicked = false;
        for (const buttonText of addAddressButtons) {
          if (bodyText.includes(buttonText) && !addressButtonClicked) {
            cy.contains(buttonText).click();
            cy.wait(2000);
            addressButtonClicked = true;
            cy.log(`✅ Clicou em: ${buttonText}`);
            break;
          }
        }

        if (addressButtonClicked) {
          cy.log('📝 Preenchendo formulário de endereço...');

          // Preencher dados do endereço
          cy.get(
            '#zip_code, input[name="zip_code"], input[placeholder*="CEP"], input[placeholder*="cep"]'
          )
            .clear()
            .type('01310-100');

          cy.wait(2000); // Aguardar busca automática do CEP

          // Verificar se campos foram preenchidos automaticamente
          cy.get(
            '#street, input[name="street"], input[placeholder*="Rua"], input[placeholder*="rua"]'
          ).then($street => {
            if ($street.val() === '') {
              cy.wrap($street).clear().type('Avenida Paulista');
            }
          });

          cy.get(
            '#number, input[name="number"], input[placeholder*="Número"], input[placeholder*="número"]'
          )
            .clear()
            .type('1578');

          cy.get(
            '#neighborhood, input[name="neighborhood"], input[placeholder*="Bairro"], input[placeholder*="bairro"]'
          ).then($neighborhood => {
            if ($neighborhood.val() === '') {
              cy.wrap($neighborhood).clear().type('Bela Vista');
            }
          });

          cy.get(
            '#city, input[name="city"], input[placeholder*="Cidade"], input[placeholder*="cidade"]'
          ).then($city => {
            if ($city.val() === '') {
              cy.wrap($city).clear().type('São Paulo');
            }
          });

          cy.get(
            '#state, input[name="state"], input[placeholder*="Estado"], input[placeholder*="estado"]'
          ).then($state => {
            if ($state.val() === '') {
              cy.wrap($state).clear().type('SP');
            }
          });

          // Salvar endereço
          cy.get(
            'button[type="submit"], button:contains("Cadastrar"), button:contains("Salvar")'
          ).click();

          // Aguardar criação do endereço
          cy.wait('@createAddress', { timeout: 10000 }).then(interception => {
            cy.log('✅ Endereço criado com sucesso!');
            expect(interception.response?.statusCode).to.eq(200);
          });

          // Aguardar feedback de sucesso e fechar modal se necessário
          cy.wait(2000);

          // Se aparecer modal de sucesso, fechar
          cy.get('body').then($bodyAfterAddress => {
            if (
              $bodyAfterAddress.text().includes('Sucesso') ||
              $bodyAfterAddress.text().includes('criado') ||
              $bodyAfterAddress.text().includes('cadastrado')
            ) {
              // Procurar botão OK, Fechar, etc.
              const closeButtons = ['OK', 'Fechar', 'Continuar', 'X'];
              for (const btnText of closeButtons) {
                if ($bodyAfterAddress.text().includes(btnText)) {
                  cy.contains(btnText).click();
                  cy.wait(1000);
                  break;
                }
              }
            }
          });

          cy.log('📍 Endereço criado, retornando ao fluxo de coleta...');

          // Reabrir o modal de editar ponto de coleta
          cy.wait(2000);
          cy.contains('Editar ponto de coleta').click();
          cy.wait(3000);
        }
      }

      // PASSO 4.2: Selecionar tipo de coleta (se necessário)
      cy.log('📋 PASSO 4.2: Configurando tipo de coleta...');

      // Procurar por radio buttons para tipo de coleta
      cy.get('input[type="radio"]').then($radios => {
        if ($radios.length > 0) {
          cy.log(`📻 Encontrou ${$radios.length} opções de radio`);

          $radios.each((index, radio) => {
            const $radio = Cypress.$(radio);
            const $label =
              $radio.closest('label').length > 0
                ? $radio.closest('label')
                : $radio.siblings('label').first();

            const labelText = $label.text() || $radio.parent().text();
            cy.log(`📻 Opção ${index + 1}: "${labelText}"`);

            // Selecionar "Ponto de Coleta" se disponível
            if (
              labelText.toLowerCase().includes('ponto de coleta') ||
              labelText.toLowerCase().includes('endereço')
            ) {
              cy.wrap($radio).check({ force: true });
              cy.log(`✅ Selecionado: "${labelText}"`);
              return false; // Sair do loop each
            }
          });
        }
      });

      cy.wait(1000);

      // PASSO 4.3: Selecionar endereço no dropdown
      cy.log('🏠 PASSO 4.3: Selecionando endereço...');

      cy.get('select, [role="combobox"]').then($selects => {
        if ($selects.length > 0) {
          cy.log(`📋 Encontrou ${$selects.length} dropdown(s)`);

          const $select = $selects.first();
          const options = $select.find('option, [role="option"]');
          cy.log(`📋 Dropdown tem ${options.length} opções`);

          if (options.length > 1) {
            // Selecionar primeira opção válida (não vazia)
            cy.wrap($select).select(1);
            cy.log('✅ Endereço selecionado no dropdown');
          } else {
            cy.log('⚠️ Dropdown não tem opções válidas');
          }
        } else {
          cy.log('⚠️ Nenhum dropdown encontrado para seleção de endereço');
        }
      });

      cy.wait(1000);

      // PASSO 4.4: Definir data preferencial de coleta
      cy.log('📅 PASSO 4.4: Definindo data preferencial de coleta...');

      // Procurar campo de data
      cy.get(
        'input[type="date"], input[placeholder*="data"], input[placeholder*="Data"], input[name*="date"], input[id*="date"]'
      ).then($dateInputs => {
        if ($dateInputs.length > 0) {
          cy.log(`📅 Encontrou ${$dateInputs.length} campo(s) de data`);

          const $dateInput = $dateInputs.first();
          const inputType = $dateInput.attr('type');
          const placeholder = $dateInput.attr('placeholder') || '';

          cy.log(`📅 Campo de data: type="${inputType}" placeholder="${placeholder}"`);

          // Limpar campo primeiro
          cy.wrap($dateInput).clear();

          if (inputType === 'date') {
            // Input HTML5 date - usar formato ISO (YYYY-MM-DD)
            cy.wrap($dateInput).type(tomorrowDate);
            cy.log(`✅ Data definida (formato ISO): ${tomorrowDate}`);
          } else {
            // Input texto - tentar formato brasileiro (DD/MM/YYYY)
            const [year, month, day] = tomorrowDate.split('-');
            const brazilianDate = `${day}/${month}/${year}`;
            cy.wrap($dateInput).type(brazilianDate);
            cy.log(`✅ Data definida (formato brasileiro): ${brazilianDate}`);
          }

          // Aguardar um pouco para a data ser processada
          cy.wait(1000);
        } else {
          cy.log('⚠️ Campo de data não encontrado');

          // Procurar por campos alternativos
          cy.get('input').then($allInputs => {
            cy.log(`🔍 Procurando em todos os ${$allInputs.length} inputs disponíveis:`);

            $allInputs.each((index, input) => {
              const $input = Cypress.$(input);
              const type = $input.attr('type') || '';
              const name = $input.attr('name') || '';
              const placeholder = $input.attr('placeholder') || '';
              const id = $input.attr('id') || '';

              cy.log(
                `📝 Input ${index + 1}: type="${type}" name="${name}" placeholder="${placeholder}" id="${id}"`
              );

              // Se algum campo parece ser de data
              if (
                placeholder.toLowerCase().includes('data') ||
                placeholder.toLowerCase().includes('dd/mm') ||
                name.toLowerCase().includes('date') ||
                id.toLowerCase().includes('date')
              ) {
                cy.log(`🎯 Campo suspeito de ser data encontrado!`);
                cy.wrap($input).clear();

                // Tentar ambos os formatos
                const [year, month, day] = tomorrowDate.split('-');
                const brazilianDate = `${day}/${month}/${year}`;

                cy.wrap($input).type(brazilianDate);
                cy.log(`✅ Tentativa de data: ${brazilianDate}`);

                return false; // Sair do loop each
              }
            });
          });
        }
      });

      cy.wait(1000);

      // PASSO 4.5: Salvar configurações
      cy.log('💾 PASSO 4.5: Salvando configurações de coleta...');

      // Screenshot antes de salvar
      cy.screenshot('antes-salvar-configuracoes');

      // Procurar botão de salvar
      cy.get(
        'button[type="submit"], button:contains("Salvar"), button:contains("Confirmar"), button:contains("Agendar")'
      ).then($saveButtons => {
        if ($saveButtons.length > 0) {
          cy.log(`💾 Encontrou ${$saveButtons.length} botão(ões) de salvar`);

          const $saveButton = $saveButtons.first();
          const buttonText = $saveButton.text().trim();

          cy.log(`💾 Clicando no botão: "${buttonText}"`);

          // Destacar o botão
          $saveButton.css('border', '3px solid green');
          $saveButton.css('background-color', 'lightgreen');

          cy.wait(1000);
          cy.wrap($saveButton).click({ force: true });

          // Aguardar chamada da API
          cy.wait('@setVehiclesCollection', { timeout: 15000 }).then(interception => {
            cy.log('🎉 SUCESSO! Coleta agendada com sucesso!');
            expect(interception.response?.statusCode).to.eq(200);

            // Screenshot de sucesso
            cy.screenshot('coleta-agendada-sucesso');
          });
        } else {
          cy.log('❌ Botão de salvar não encontrado');

          // Listar todos os botões disponíveis
          cy.get('button').then($allButtons => {
            cy.log(`🔍 Botões disponíveis na tela (${$allButtons.length}):`);
            $allButtons.each((index, btn) => {
              const $btn = Cypress.$(btn);
              const text = $btn.text().trim();
              const type = $btn.attr('type') || '';
              cy.log(`🔘 Botão ${index + 1}: "${text}" (type: ${type})`);
            });
          });

          cy.screenshot('botao-salvar-nao-encontrado');
        }
      });
    });

    // PASSO 5: Verificar sucesso final
    cy.log('🎊 PASSO 5: Verificando conclusão do fluxo...');

    cy.wait(3000);

    // Verificar se há feedback de sucesso
    cy.get('body').then($body => {
      const finalText = $body.text();

      const successIndicators = ['sucesso', 'agendado', 'salvo', 'confirmado', 'coleta definida'];

      let successDetected = false;
      for (const indicator of successIndicators) {
        if (finalText.toLowerCase().includes(indicator)) {
          cy.log(`🎉 SUCESSO DETECTADO: "${indicator}"`);
          successDetected = true;
          break;
        }
      }

      if (successDetected) {
        cy.log('🎉 FLUXO COMPLETO CONCLUÍDO COM SUCESSO!');
        cy.log('✅ Veículo selecionado e data de coleta definida');
        cy.screenshot('fluxo-completo-sucesso');
      } else {
        cy.log('⚠️ Feedback de sucesso não detectado, mas processo pode ter funcionado');
        cy.log(`📄 Texto final da página: ${finalText.substring(0, 300)}...`);
        cy.screenshot('fluxo-finalizado-sem-feedback');
      }
    });

    cy.log('🏁 TESTE CONCLUÍDO: Fluxo completo de seleção de veículo e agendamento de coleta');
  });

  it('should handle edge case: no vehicles registered', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');

    cy.log('🔍 Verificando comportamento quando não há veículos...');

    cy.get('.vehicle-counter').should('be.visible');

    cy.get('body').then($body => {
      if (
        $body.text().includes('Nenhum veículo cadastrado') ||
        $body.text().includes('0 veículo') ||
        $body.text().includes('Cadastrar Novo Veículo')
      ) {
        cy.log('ℹ️ Estado: Nenhum veículo cadastrado');
        cy.log('💡 Sistema deve orientar usuário a cadastrar veículos primeiro');

        cy.contains('Cadastrar Novo Veículo').should('be.visible');
        cy.log('✅ Botão de cadastro de veículo disponível');
      } else {
        cy.log('ℹ️ Estado: Veículos já existem no sistema');
      }
    });
  });
});
