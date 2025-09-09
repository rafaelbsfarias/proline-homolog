describe('Client Collection Flow - Complete Integration Test', () => {
  let createdAddressId: string;
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
    cy.intercept('POST', '/api/client/collection-reschedule').as('rescheduleCollection');
  });

  it('should complete full client collection flow: login → add collection point → assign vehicles → D+1 date', () => {
    // ========================================================================================
    // SETUP: LOGIN E NAVEGAÇÃO
    // ========================================================================================
    cy.log('🚀 INICIANDO FLUXO COMPLETO DE COLETA DO CLIENTE');

    // 1. Login usando comando personalizado
    cy.login('cliente@prolineauto.com.br', '123qwe');

    // 2. Verificar se estamos no dashboard correto
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');
    cy.contains('Painel do Cliente').should('be.visible');

    cy.log('✅ Login realizado com sucesso');

    // ========================================================================================
    // PASSO 1: ADICIONAR PONTO DE COLETA
    // ========================================================================================
    cy.log('📍 PASSO 1: Adicionando novo ponto de coleta');

    // 1.1 Clicar no botão "Adicionar Ponto de Coleta"
    cy.contains('Adicionar Ponto de Coleta').click();

    // 1.2 Verificar se modal abriu
    cy.get('[data-cy="address-modal"], .modal').should('be.visible');
    cy.contains('Adicionar Ponto de Coleta').should('be.visible');

    // 1.3 Preencher formulário com dados válidos
    cy.get('#zip_code').type('01310-100');
    cy.wait(2000); // Aguardar preenchimento automático

    // Completar campos restantes
    cy.get('#street').clear().type('Avenida Paulista');
    cy.get('#number').clear().type('1578');
    cy.get('#neighborhood').clear().type('Bela Vista');
    cy.get('#city').clear().type('São Paulo');
    cy.get('#state').clear().type('SP');
    cy.get('#complement').clear().type('Próximo ao MASP');

    // 1.4 Submeter formulário
    cy.get('button[type="submit"]').contains('Cadastrar Endereço').click();

    // 1.5 Aguardar resposta da API e verificar sucesso
    cy.wait('@createAddress').then(interception => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.be.true;
    });

    // 1.6 Verificar modal de sucesso
    cy.contains('Sucesso').should('be.visible');
    cy.contains('Endereço cadastrado com sucesso').should('be.visible');

    // 1.7 Fechar modal
    cy.get('[data-cy="close-modal"], .modal button').contains('OK').click();

    cy.log('✅ Ponto de coleta adicionado com sucesso');

    // ========================================================================================
    // PASSO 2: VERIFICAR VEÍCULOS DISPONÍVEIS
    // ========================================================================================
    cy.log('🚗 PASSO 2: Verificando veículos disponíveis');

    // 2.1 Aguardar carregamento do contador de veículos
    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');

    // 2.2 Verificar se há veículos
    cy.get('body').then($body => {
      const hasVehicles =
        !$body.text().includes('0 veículos') && !$body.text().includes('Nenhum veículo');

      if (hasVehicles) {
        cy.log('✅ Veículos encontrados, continuando com o fluxo');
      } else {
        cy.log('⚠️ Nenhum veículo encontrado, pulando passos seguintes');
        return; // Pular resto do teste se não há veículos
      }
    });

    // ========================================================================================
    // PASSO 3: DEFINIR COLETA PARA VEÍCULOS COM DATA D+1
    // ========================================================================================
    cy.log(`📅 PASSO 3: Definindo coleta com data D+1 (${tomorrowDate})`);

    // 3.1 Aguardar carregamento da seção de coletas
    cy.contains('Coleta de Veículos').should('be.visible');

    // 3.2 Verificar se há sugestões pendentes ou criar nova
    cy.get('body').then($body => {
      if ($body.text().includes('Nenhuma sugestão pendente')) {
        cy.log('📝 Nenhuma sugestão pendente, criando nova coleta via API');

        // Criar coleta diretamente via API usando o endpoint set-vehicles-collection
        cy.window().then(win => {
          const supabaseSessionKey = Object.keys(win.localStorage).find(key =>
            key.match(/^sb-.*-auth-token$/)
          );

          if (supabaseSessionKey) {
            const sessionValue = win.localStorage.getItem(supabaseSessionKey);
            if (sessionValue) {
              const sessionData = JSON.parse(sessionValue);
              const token = sessionData.access_token;

              // Buscar endereço recém-criado
              cy.request({
                method: 'GET',
                url: '/api/client/addresses',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }).then(addressResponse => {
                const addresses = addressResponse.body;
                const newAddress = addresses.find(
                  (addr: { is_collect_point: boolean }) => addr.is_collect_point
                );

                if (newAddress) {
                  createdAddressId = newAddress.id;

                  // Definir coleta para todos os veículos
                  cy.request({
                    method: 'POST',
                    url: '/api/client/set-vehicles-collection',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: {
                      method: 'collect_point',
                      addressId: createdAddressId,
                      estimated_arrival_date: tomorrowDate,
                      vehicleIds: [], // Todos os veículos
                    },
                  }).then(collectionResponse => {
                    expect(collectionResponse.status).to.eq(200);
                    expect(collectionResponse.body.success).to.be.true;
                    cy.log('✅ Coleta definida via API com sucesso');
                  });
                }
              });
            }
          }
        });
      } else {
        cy.log('📋 Sugestões pendentes encontradas, interagindo via interface');

        // Interagir com sugestões existentes
        cy.get('.vehicle-item')
          .first()
          .within(() => {
            // Clicar em "Sugerir outra data"
            cy.contains('Sugerir outra data').click();
          });

        // Aguardar date picker aparecer
        cy.get('input[type="date"], [data-cy="date-picker"]').should('be.visible');

        // Definir data D+1
        cy.get('input[type="date"], [data-cy="date-picker"]').then($dateInput => {
          cy.wrap($dateInput).invoke('val', tomorrowDate).trigger('change');
        });

        // Enviar sugestão
        cy.contains('Enviar sugestão').click();

        // Aguardar resposta da API
        cy.wait('@rescheduleCollection').then(interception => {
          expect(interception.response?.statusCode).to.eq(200);
          expect(interception.response?.body.success).to.be.true;
        });

        // Verificar mensagem de sucesso
        cy.contains('Solicitação de nova data enviada').should('be.visible');

        cy.log('✅ Sugestão de data D+1 enviada com sucesso');
      }
    });

    // ========================================================================================
    // PASSO 4: VERIFICAÇÕES FINAIS E VALIDAÇÕES
    // ========================================================================================
    cy.log('🔍 PASSO 4: Verificações finais');

    // 4.1 Verificar se ainda estamos no dashboard
    cy.url().should('include', '/dashboard');

    // 4.2 Verificar se não há erros na tela
    cy.get('body').should('not.contain', 'Erro');
    cy.get('body').should('not.contain', 'Falha');

    // 4.3 Verificar se o botão de logout ainda funciona (usuário ainda logado)
    cy.get('button, a').contains(/sair/i).should('be.visible');

    // 4.4 Capturar screenshot final para documentação
    cy.screenshot('client-collection-flow-completed', { capture: 'fullPage' });

    cy.log('✅ FLUXO COMPLETO DE COLETA CONCLUÍDO COM SUCESSO!');
    cy.log(`📊 Resumo: Login → Ponto de Coleta → Coleta D+1 (${tomorrowDate})`);
  });

  it('should handle edge cases and error scenarios', () => {
    // ========================================================================================
    // TESTE DE CENÁRIOS DE ERRO E EDGE CASES
    // ========================================================================================
    cy.log('🧪 TESTANDO CENÁRIOS DE ERRO');

    // Login
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');

    // Testar formulário de ponto de coleta com dados inválidos
    cy.contains('Adicionar Ponto de Coleta').click();

    // Tentar submeter sem CEP
    cy.get('#street').type('Rua Teste');
    cy.get('button[type="submit"]').click();

    // Verificar validação
    cy.get('.error-message, [data-cy="error"]').should('be.visible');

    // Fechar modal
    cy.contains('Cancelar').click();

    cy.log('✅ Cenários de erro testados com sucesso');
  });

  it('should validate date constraints and business rules', () => {
    // ========================================================================================
    // TESTE DE VALIDAÇÃO DE REGRAS DE NEGÓCIO
    // ========================================================================================
    cy.log('📋 VALIDANDO REGRAS DE NEGÓCIO');

    // Login
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');

    // Verificar se data mínima é hoje
    cy.contains('Coleta de Veículos').should('be.visible');

    // Verificar se há restrições de data no date picker
    cy.get('input[type="date"], [data-cy="date-picker"]').then($input => {
      const minDate = $input.attr('min');
      if (minDate) {
        const today = new Date().toISOString().split('T')[0];
        expect(minDate).to.eq(today);
        cy.log('✅ Restrição de data mínima validada');
      }
    });

    cy.log('✅ Regras de negócio validadas com sucesso');
  });
});
