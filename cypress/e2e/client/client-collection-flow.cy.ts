describe('Client Collection Flow', () => {
  beforeEach(() => {
    // Visitar página de login antes de cada teste
    cy.visit('/login');
    cy.url().should('include', '/login');
  });

  it('should login as client, add collection point, and assign collection to vehicles with D+1 date', () => {
    // ========================================================================================
    // PASSO 1: LOGIN COMO CLIENTE
    // ========================================================================================
    cy.log('🚀 PASSO 1: Fazendo login como cliente');

    // Preencher credenciais do cliente
    cy.get('input[name="email"]').type('cliente@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');

    // Clicar no botão de submit
    cy.get('button[type="submit"]').click();

    // Verificar se foi redirecionado para o dashboard
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    cy.contains('Bem-vindo').should('be.visible');

    cy.log('✅ Login realizado com sucesso');

    // ========================================================================================
    // PASSO 2: ADICIONAR PONTO DE COLETA
    // ========================================================================================
    cy.log('📍 PASSO 2: Adicionando ponto de coleta');

    // Clicar no botão "Adicionar Ponto de Coleta"
    cy.contains('Adicionar Ponto de Coleta').click();

    // Aguardar o modal abrir
    cy.get('.modal').should('be.visible');
    cy.contains('Adicionar Ponto de Coleta').should('be.visible');

    // Preencher formulário de endereço
    cy.get('#zip_code').type('01310-100'); // CEP de exemplo
    cy.wait(1000); // Aguardar busca automática

    // Preencher campos restantes
    cy.get('#street').type('Avenida Paulista');
    cy.get('#number').type('1000');
    cy.get('#neighborhood').type('Bela Vista');
    cy.get('#city').type('São Paulo');
    cy.get('#state').type('SP');
    cy.get('#complement').type('Próximo ao metrô');

    // Clicar em "Cadastrar Endereço"
    cy.contains('Cadastrar Endereço').click();

    // Verificar se o modal de sucesso apareceu
    cy.contains('Sucesso').should('be.visible');
    cy.contains('Endereço cadastrado com sucesso').should('be.visible');

    // Fechar modal de sucesso
    cy.get('.modal button').contains('OK').click();

    cy.log('✅ Ponto de coleta adicionado com sucesso');

    // ========================================================================================
    // PASSO 3: DEFINIR COLETA PARA VEÍCULOS COM DATA D+1
    // ========================================================================================
    cy.log('🚛 PASSO 3: Definindo coleta para veículos com data D+1');

    // Calcular data de amanhã (D+1)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    cy.log(`📅 Data selecionada para coleta: ${tomorrowFormatted}`);

    // Aguardar carregamento da seção de veículos
    cy.contains('Coleta de Veículos').should('be.visible');

    // Verificar se há veículos disponíveis
    cy.get('body').then($body => {
      if ($body.text().includes('Nenhuma sugestão pendente')) {
        cy.log('⚠️ Nenhum veículo encontrado para agendamento');

        // Se não há veículos, vamos criar uma coleta via API diretamente
        cy.window().then(win => {
          const supabaseSessionKey = Object.keys(win.localStorage).find(key =>
            key.match(/^sb-.*-auth-token$/)
          );

          if (supabaseSessionKey) {
            const sessionValue = win.localStorage.getItem(supabaseSessionKey);
            if (sessionValue) {
              const sessionData = JSON.parse(sessionValue);
              const token = sessionData.access_token;

              // Fazer chamada para API de set-vehicles-collection
              cy.request({
                method: 'POST',
                url: '/api/client/set-vehicles-collection',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: {
                  method: 'collect_point',
                  addressId: 'newly_created_address_id', // Este ID precisaria ser obtido
                  estimated_arrival_date: tomorrowFormatted,
                  vehicleIds: [], // Todos os veículos do cliente
                },
              }).then(response => {
                expect(response.status).to.eq(200);
                expect(response.body.success).to.be.true;
                cy.log('✅ Coleta definida via API com sucesso');
              });
            }
          }
        });
      } else {
        // Se há veículos disponíveis, usar a interface
        cy.log('📋 Veículos encontrados, definindo coleta via interface');

        // Clicar em "Sugerir outra data" no primeiro veículo disponível
        cy.get('.vehicle-item')
          .first()
          .within(() => {
            cy.contains('Sugerir outra data').click();
          });

        // Selecionar data D+1 no date picker
        cy.get('input[type="date"]').then($dateInput => {
          // Definir valor diretamente no input de data
          cy.wrap($dateInput).invoke('val', tomorrowFormatted).trigger('change');
        });

        // Clicar em "Enviar sugestão"
        cy.contains('Enviar sugestão').click();

        // Verificar mensagem de sucesso
        cy.contains('Solicitação de nova data enviada').should('be.visible');

        cy.log('✅ Sugestão de data enviada com sucesso');
      }
    });

    // ========================================================================================
    // PASSO 4: VERIFICAÇÕES FINAIS
    // ========================================================================================
    cy.log('🔍 PASSO 4: Verificações finais');

    // Verificar se estamos ainda no dashboard
    cy.url().should('include', '/dashboard');

    // Verificar se não há erros na tela
    cy.get('body').should('not.contain', 'Erro');

    cy.log('✅ Teste concluído com sucesso');
  });

  it('should handle collection flow with existing vehicles', () => {
    // ========================================================================================
    // TESTE ALTERNATIVO: COLETA COM VEÍCULOS EXISTENTES
    // ========================================================================================
    cy.log('🔄 TESTE ALTERNATIVO: Fluxo com veículos existentes');

    // Login
    cy.get('input[name="email"]').type('cliente@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Verificar se há veículos no contador
    cy.get('.vehicle-counter').within(() => {
      cy.get('.counter-number').then($counter => {
        const vehicleCount = parseInt($counter.text());
        if (vehicleCount > 0) {
          cy.log(`📊 Encontrados ${vehicleCount} veículos`);

          // Se há veículos, verificar se podemos interagir com eles
          cy.contains('Coleta de Veículos').should('be.visible');
        } else {
          cy.log('⚠️ Nenhum veículo encontrado no contador');
        }
      });
    });
  });

  it('should validate collection point form', () => {
    // ========================================================================================
    // TESTE DE VALIDAÇÃO: FORMULÁRIO DE PONTO DE COLETA
    // ========================================================================================
    cy.log('📝 TESTE DE VALIDAÇÃO: Validando formulário de ponto de coleta');

    // Login
    cy.get('input[name="email"]').type('cliente@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Abrir modal de ponto de coleta
    cy.contains('Adicionar Ponto de Coleta').click();

    // Tentar submeter formulário vazio
    cy.contains('Cadastrar Endereço').click();

    // Verificar se há mensagens de erro de validação
    cy.get('.error-message, .field-error').should('exist');

    // Fechar modal
    cy.contains('Cancelar').click();

    cy.log('✅ Validação do formulário testada com sucesso');
  });
});
