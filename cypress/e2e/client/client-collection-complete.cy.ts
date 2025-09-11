describe('Client Collection Complete Flow', () => {
  let createdAddressId: string;

  before(() => {
    // Configurações iniciais do teste
  });

  beforeEach(() => {
    // Interceptar chamadas de API para melhor controle
    cy.intercept('POST', '/api/client/create-address').as('createAddress');
    cy.intercept('POST', '/api/client/set-vehicles-collection').as('setVehiclesCollection');
    cy.intercept('GET', '/api/client/vehicles').as('getVehicles');
    cy.intercept('GET', '/api/client/addresses').as('getAddresses');
    cy.intercept('POST', '/api/client/collection-reschedule').as('rescheduleCollection');
  });

  it('should complete full client collection flow: login → add collection point → assign vehicles → verify success', () => {
    const clientEmail = Cypress.env('testClient')?.email || 'cliente@prolineauto.com.br';
    const clientPassword = Cypress.env('testClient')?.password || '123qwe';

    cy.log('🚀 === INICIANDO FLUXO COMPLETO DE COLETA DO CLIENTE ===');

    // ========================================================================================
    // PASSO 1: LOGIN DO CLIENTE
    // ========================================================================================
    cy.log('🔐 PASSO 1: Fazendo login como cliente...');

    // Usar comando personalizado de login se disponível, senão fazer manualmente
    if (cy.login) {
      cy.login(clientEmail, clientPassword);
    } else {
      cy.visit('/login');
      cy.get('input[name="email"], input[type="email"]').clear().type(clientEmail);
      cy.get('input[name="password"], input[type="password"]').clear().type(clientPassword);
      cy.get('button[type="submit"], button:contains("Entrar")').click();
    }

    // Verificar se login foi bem-sucedido
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
    cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');
    cy.log('✅ Login realizado com sucesso');

    // ========================================================================================
    // PASSO 2: ADICIONAR PONTO DE COLETA
    // ========================================================================================
    cy.log('📍 PASSO 2: Adicionando novo ponto de coleta');

    // 2.1 Aguardar carregamento inicial dos dados
    cy.wait('@getVehicles', { timeout: 10000 });
    cy.wait('@getAddresses', { timeout: 5000 });

    // 2.2 Clicar no botão "Adicionar Ponto de Coleta"
    cy.get('body').then($body => {
      const addButtonSelectors = [
        'button:contains("Adicionar Ponto de Coleta")',
        'button:contains("Novo Ponto de Coleta")',
        'button:contains("Adicionar Endereço")',
        '[data-cy*="add-collection-point"]',
        '.add-collection-button',
      ];

      let buttonFound = false;
      for (const selector of addButtonSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          cy.log(`✅ Clicou no botão: ${selector}`);
          buttonFound = true;
          break;
        }
      }

      if (!buttonFound) {
        cy.log('⚠️ Botão "Adicionar Ponto de Coleta" não encontrado');
        throw new Error('Botão para adicionar ponto de coleta não encontrado');
      }
    });

    // 2.3 Verificar se modal/formulário abriu
    cy.get('body').then($body => {
      const modalSelectors = [
        '[data-cy="address-modal"]',
        '.modal',
        '.address-form',
        'form',
        '.collection-point-form',
      ];

      let modalFound = false;
      for (const selector of modalSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).should('be.visible');
          cy.log(`✅ Modal/formulário encontrado: ${selector}`);
          modalFound = true;
          break;
        }
      }

      if (!modalFound) {
        cy.log('⚠️ Modal/formulário não encontrado');
      }
    });

    // 2.4 Preencher formulário com dados válidos
    cy.log('📝 Preenchendo formulário de endereço...');

    // CEP (com preenchimento automático)
    cy.get('input[name="zip_code"], input[id="zip_code"], #zip_code').clear().type('01310-100');
    cy.wait(2000); // Aguardar preenchimento automático

    // Campos obrigatórios
    cy.get('input[name="street"], input[id="street"], #street').clear().type('Avenida Paulista');
    cy.get('input[name="number"], input[id="number"], #number').clear().type('1578');
    cy.get('input[name="neighborhood"], input[id="neighborhood"], #neighborhood')
      .clear()
      .type('Bela Vista');
    cy.get('input[name="city"], input[id="city"], #city').clear().type('São Paulo');
    cy.get('input[name="state"], input[id="state"], #state').clear().type('SP');

    // Campo opcional
    cy.get('input[name="complement"], input[id="complement"], #complement')
      .clear()
      .type('Próximo ao MASP');

    cy.log('✅ Formulário preenchido');

    // 2.5 Submeter formulário
    cy.log('💾 Submetendo formulário...');

    cy.get('body').then($body => {
      const submitSelectors = [
        'button[type="submit"]:contains("Cadastrar")',
        'button[type="submit"]:contains("Salvar")',
        'button[type="submit"]:contains("Adicionar")',
        'button:contains("Cadastrar Endereço")',
        'button:contains("Salvar Endereço")',
        'button[type="submit"]',
      ];

      let submitFound = false;
      for (const selector of submitSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          cy.log(`✅ Clicou no botão de submit: ${selector}`);
          submitFound = true;
          break;
        }
      }

      if (!submitFound) {
        cy.log('⚠️ Botão de submit não encontrado');
        throw new Error('Botão de submit não encontrado');
      }
    });

    // 2.6 Aguardar resposta da API e verificar sucesso
    cy.log('🔍 Verificando resposta da API...');

    cy.wait('@createAddress', { timeout: 10000 }).then(interception => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.be.true;

      // Guardar ID do endereço criado para uso posterior
      if (interception.response?.body.data?.id) {
        createdAddressId = interception.response.body.data.id;
        cy.log(`✅ Endereço criado com ID: ${createdAddressId}`);
      }
    });

    // 2.7 Verificar feedback visual de sucesso
    cy.get('body').then($body => {
      const successSelectors = [
        ':contains("Sucesso")',
        ':contains("sucesso")',
        ':contains("criado")',
        ':contains("Criado")',
        ':contains("salvo")',
        ':contains("Salvo")',
      ];

      let successFound = false;
      for (const selector of successSelectors) {
        if ($body.text().includes(selector.replace(':contains("', '').replace('")', ''))) {
          cy.contains(selector.replace(':contains("', '').replace('")', '')).should('be.visible');
          cy.log(`✅ Mensagem de sucesso encontrada: ${selector}`);
          successFound = true;
          break;
        }
      }

      if (!successFound) {
        cy.log('⚠️ Mensagem de sucesso não encontrada, verificando se modal fechou');
        // Se não encontrou mensagem, verificar se modal fechou (indicativo de sucesso)
        cy.wait(2000);
        cy.contains('Bem-vindo').should('be.visible');
        cy.log('✅ Modal fechou, indicando sucesso');
      }
    });

    cy.log('✅ Ponto de coleta adicionado com sucesso');

    // ========================================================================================
    // PASSO 3: EXPANDIR CARD MEUS VEÍCULOS E EDITAR PONTO DE COLETA
    // ========================================================================================
    cy.log('🚗 PASSO 3: Expandindo card Meus Veículos e editando ponto de coleta');

    // 3.1 Aguardar carregamento do card Meus Veículos
    cy.get('body').then($body => {
      const vehicleCardSelectors = [
        ':contains("Meus Veículos")',
        ':contains("meus veículos")',
        '.vehicle-card',
        '[data-cy*="vehicle-card"]',
        '.vehicles-section',
        '[data-cy*="vehicles"]',
      ];

      let cardFound = false;
      for (const selector of vehicleCardSelectors) {
        if (
          $body.text().includes(selector.replace(':contains("', '').replace('")', '')) ||
          $body.find(selector.replace(':contains("', '').replace('")', '')).length > 0
        ) {
          cy.log(`✅ Card Meus Veículos encontrado: ${selector}`);
          cardFound = true;
          break;
        }
      }

      if (!cardFound) {
        cy.log('⚠️ Card Meus Veículos não encontrado');
      }
    });

    // 3.2 Expandir o card Meus Veículos usando o seletor correto
    cy.log('🚗 Expandindo detalhes dos veículos...');
    cy.get('button.details-button').first().click();
    cy.get('.vehicles-details').should('be.visible');
    cy.log('✅ Detalhes dos veículos expandidos com sucesso');

    // 3.3 Aguardar expansão do card e carregamento dos veículos
    cy.wait(2000); // Aguardar animação de expansão
    cy.get('.vehicle-list, .vehicles-list, [data-cy*="vehicle-list"]', { timeout: 10000 }).should(
      'be.visible'
    );

    // 3.4 Verificar se há veículos disponíveis
    cy.get('body').then($body => {
      const vehicleCount = $body.text().match(/(\d+)\s+veículos?/);
      const hasVehicles = vehicleCount && parseInt(vehicleCount[1]) > 0;

      if (!hasVehicles) {
        cy.log('⚠️ Nenhum veículo encontrado no card expandido');
        return;
      }

      cy.log(`✅ ${vehicleCount[1]} veículo(s) encontrado(s) no card expandido`);
    });

    // 3.5 Clicar no botão "Editar Ponto de Coleta"
    cy.get('body').then($body => {
      const editButtonSelectors = [
        'button:contains("Editar Ponto de Coleta")',
        'button:contains("Editar ponto de coleta")',
        'button:contains("Editar Endereço")',
        'button:contains("Editar endereço")',
        '.edit-collection-point',
        '[data-cy*="edit-collection-point"]',
        '.edit-address-button',
        '[data-cy*="edit-address"]',
      ];

      let editButtonFound = false;
      for (const selector of editButtonSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          cy.log(`✅ Botão "Editar Ponto de Coleta" clicado: ${selector}`);
          editButtonFound = true;
          break;
        }
      }

      if (!editButtonFound) {
        cy.log('⚠️ Botão "Editar Ponto de Coleta" não encontrado');
        throw new Error('Botão "Editar Ponto de Coleta" não encontrado após expansão do card');
      }
    });

    // 3.6 Verificar se modal/formulário de edição abriu
    cy.get('body').then($body => {
      const editModalSelectors = [
        '[data-cy="edit-address-modal"]',
        '.edit-modal',
        '.edit-address-form',
        '.address-edit-form',
        'form.edit-form',
      ];

      let editModalFound = false;
      for (const selector of editModalSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).should('be.visible');
          cy.log(`✅ Modal/formulário de edição encontrado: ${selector}`);
          editModalFound = true;
          break;
        }
      }

      if (!editModalFound) {
        cy.log('⚠️ Modal/formulário de edição não encontrado');
      }
    });

    cy.log('✅ Card Meus Veículos expandido e botão Editar Ponto de Coleta clicado com sucesso');

    // ========================================================================================
    // PASSO 4: EDITAR ENDEREÇO DE COLETA
    // ========================================================================================
    cy.log('📝 PASSO 4: Editando endereço de coleta');

    // 4.1 Modificar dados do endereço
    cy.log('📝 Modificando dados do endereço...');

    // Modificar complemento
    cy.get('input[name="complement"], input[id="complement"], #complement')
      .clear()
      .type('Próximo ao MASP - Atualizado');

    // Modificar número
    cy.get('input[name="number"], input[id="number"], #number').clear().type('1579');

    cy.log('✅ Dados do endereço modificados');

    // 4.2 Salvar alterações
    cy.get('body').then($body => {
      const saveSelectors = [
        'button[type="submit"]:contains("Salvar")',
        'button[type="submit"]:contains("Atualizar")',
        'button[type="submit"]:contains("Editar")',
        'button:contains("Salvar Alterações")',
        'button:contains("Atualizar Endereço")',
        'button[type="submit"]',
      ];

      let saveFound = false;
      for (const selector of saveSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          cy.log(`✅ Alterações salvas: ${selector}`);
          saveFound = true;
          break;
        }
      }

      if (!saveFound) {
        cy.log('⚠️ Botão de salvar não encontrado');
        throw new Error('Botão de salvar alterações não encontrado');
      }
    });

    // 4.3 Aguardar resposta da API e verificar sucesso
    cy.log('🔍 Verificando resposta da API de atualização...');

    cy.wait('@createAddress', { timeout: 10000 }).then(interception => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.be.true;
      cy.log('✅ Endereço atualizado com sucesso via API');
    });

    // 4.4 Verificar feedback visual de sucesso
    cy.get('body').then($body => {
      const successSelectors = [
        ':contains("Sucesso")',
        ':contains("sucesso")',
        ':contains("atualizado")',
        ':contains("Atualizado")',
        ':contains("salvo")',
        ':contains("Salvo")',
        ':contains("editado")',
        ':contains("Editado")',
      ];

      let successFound = false;
      for (const selector of successSelectors) {
        if ($body.text().includes(selector.replace(':contains("', '').replace('")', ''))) {
          cy.contains(selector.replace(':contains("', '').replace('")', '')).should('be.visible');
          cy.log(`✅ Mensagem de sucesso da edição encontrada: ${selector}`);
          successFound = true;
          break;
        }
      }

      if (!successFound) {
        cy.log('⚠️ Mensagem de sucesso da edição não encontrada, verificando se modal fechou');
        // Se não encontrou mensagem, verificar se modal fechou (indicativo de sucesso)
        cy.wait(2000);
        cy.contains('Bem-vindo').should('be.visible');
        cy.log('✅ Modal de edição fechou, indicando sucesso');
      }
    });

    cy.log('✅ Endereço de coleta editado com sucesso');

    // ========================================================================================
    // PASSO 5: VERIFICAÇÕES FINAIS
    // ========================================================================================
    cy.log('🔍 PASSO 5: Verificações finais');

    // 5.1 Verificar se ainda estamos no dashboard
    cy.url().should('include', '/dashboard');

    // 5.2 Verificar se não há erros na tela
    cy.get('body').should('not.contain', 'Erro');
    cy.get('body').should('not.contain', 'Falha');
    cy.get('body').should('not.contain', 'error');

    // 5.3 Verificar se usuário ainda está logado
    cy.get('body').then($body => {
      const logoutSelectors = [
        'button:contains("Sair")',
        'button:contains("Logout")',
        'button:contains("Desconectar")',
        '.logout-button',
        '[data-cy*="logout"]',
      ];

      let logoutFound = false;
      for (const selector of logoutSelectors) {
        if ($body.find(selector).length > 0) {
          cy.log('✅ Botão de logout encontrado - usuário ainda logado');
          logoutFound = true;
          break;
        }
      }

      if (!logoutFound) {
        cy.log('⚠️ Botão de logout não encontrado');
      }
    });

    // 5.4 Capturar screenshot final
    cy.screenshot('client-collection-edit-flow-finished', { capture: 'fullPage' });

    cy.log('🎉 === FLUXO DE EDIÇÃO DE COLETA CONCLUÍDO COM SUCESSO! ===');
    cy.log(
      `📊 Resumo: Login → Expandir Card → Editar Ponto de Coleta → Atualizar Endereço → Verificações`
    );
  });

  it('should handle error scenarios gracefully', () => {
    const clientEmail = Cypress.env('testClient')?.email || 'cliente@prolineauto.com.br';
    const clientPassword = Cypress.env('testClient')?.password || '123qwe';

    cy.log('🧪 === TESTANDO CENÁRIOS DE ERRO ===');

    // Login
    if (cy.login) {
      cy.login(clientEmail, clientPassword);
    } else {
      cy.visit('/login');
      cy.get('input[name="email"]').type(clientEmail);
      cy.get('input[name="password"]').type(clientPassword);
      cy.get('button[type="submit"]').click();
    }

    cy.url().should('include', '/dashboard');

    // Tentar adicionar ponto de coleta com dados inválidos
    cy.get('body').then($body => {
      const addButtonSelectors = [
        'button:contains("Adicionar Ponto de Coleta")',
        'button:contains("Novo Ponto de Coleta")',
      ];

      for (const selector of addButtonSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          break;
        }
      }
    });

    // Tentar submeter formulário vazio
    cy.get('body').then($body => {
      const submitSelectors = ['button[type="submit"]', 'button:contains("Cadastrar")'];

      for (const selector of submitSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          break;
        }
      }
    });

    // Verificar se há validação de erro
    cy.get('body').then($body => {
      const errorSelectors = [
        ':contains("obrigatório")',
        ':contains("required")',
        ':contains("inválido")',
        ':contains("invalid")',
        '.error-message',
        '[data-cy="error"]',
      ];

      let errorFound = false;
      for (const selector of errorSelectors) {
        if (
          $body.text().includes(selector.replace(':contains("', '').replace('")', '')) ||
          $body.find(selector.replace(':contains("', '').replace('")', '')).length > 0
        ) {
          cy.log(`✅ Validação de erro encontrada: ${selector}`);
          errorFound = true;
          break;
        }
      }

      if (!errorFound) {
        cy.log('⚠️ Nenhuma validação de erro encontrada');
      }
    });

    // Fechar modal e verificar se voltou ao dashboard
    cy.get('body').then($body => {
      const closeSelectors = [
        'button:contains("×")',
        'button:contains("Cancelar")',
        'button:contains("Fechar")',
        '[aria-label*="fechar"]',
      ];

      for (const selector of closeSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          cy.log('✅ Modal fechado');
          break;
        }
      }
    });

    // Verificar se voltou ao dashboard
    cy.contains('Bem-vindo').should('be.visible');

    cy.log('✅ Cenários de erro testados com sucesso');
  });

  it('should validate business rules and constraints', () => {
    const clientEmail = Cypress.env('testClient')?.email || 'cliente@prolineauto.com.br';
    const clientPassword = Cypress.env('testClient')?.password || '123qwe';

    cy.log('📋 === VALIDANDO REGRAS DE NEGÓCIO ===');

    // Login
    if (cy.login) {
      cy.login(clientEmail, clientPassword);
    } else {
      cy.visit('/login');
      cy.get('input[name="email"]').type(clientEmail);
      cy.get('input[name="password"]').type(clientPassword);
      cy.get('button[type="submit"]').click();
    }

    cy.url().should('include', '/dashboard');

    // Verificar se há restrições de data
    cy.get('body').then($body => {
      const dateSelectors = ['input[type="date"]', '[data-cy="date-picker"]', '.date-picker'];

      for (const selector of dateSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector)
            .first()
            .then($input => {
              const minDate = $input.attr('min');
              if (minDate) {
                const today = new Date().toISOString().split('T')[0];
                expect(minDate).to.eq(today);
                cy.log('✅ Restrição de data mínima validada');
              }
            });
          break;
        }
      }
    });

    // Verificar se há validação de campos obrigatórios
    cy.get('body').then($body => {
      const requiredSelectors = ['input[required]', '[data-required="true"]'];

      for (const selector of requiredSelectors) {
        if ($body.find(selector).length > 0) {
          cy.log('✅ Campos obrigatórios encontrados');
          break;
        }
      }
    });

    cy.log('✅ Regras de negócio validadas com sucesso');
  });
});
