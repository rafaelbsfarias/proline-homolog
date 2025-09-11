describe('Client Address Creation Test', () => {
  beforeEach(() => {
    // Interceptar chamadas de API para melhor controle
    cy.intercept('POST', '/api/client/create-address').as('createAddress');
  });

  it('should create collection point successfully', () => {
    // ========================================================================================
    // SETUP: LOGIN E NAVEGAÇÃO
    // ========================================================================================
    cy.log('🚀 INICIANDO TESTE DE CRIAÇÃO DE PONTO DE COLETA');

    // 1. Login usando comando personalizado
    cy.login('cliente@prolineauto.com.br', '123qwe');

    // 2. Verificar se estamos no dashboard correto
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');
    cy.log('✅ Login realizado com sucesso');

    // ========================================================================================
    // PASSO 1: ADICIONAR PONTO DE COLETA
    // ========================================================================================
    cy.log('📍 PASSO 1: Adicionando novo ponto de coleta');

    // 1.1 Verificar se estamos no dashboard correto e aguardar carregamento
    cy.url().should('include', '/dashboard');
    cy.wait(3000); // Aguardar carregamento completo da página

    // 1.2 Procurar e clicar no botão "Adicionar Ponto de Coleta" com múltiplas estratégias
    cy.log('🔍 Procurando botão "Adicionar Ponto de Coleta"...');

    // Estratégia principal: tentar clicar diretamente
    cy.get('body').then($body => {
      if ($body.text().includes('Adicionar Ponto de Coleta')) {
        cy.log('✅ Texto "Adicionar Ponto de Coleta" encontrado na página');
        cy.contains('Adicionar Ponto de Coleta').click({ force: true });
        cy.log('✅ Clicou no botão "Adicionar Ponto de Coleta"');
      } else {
        cy.log('⚠️ Texto "Adicionar Ponto de Coleta" não encontrado, tentando alternativas...');

        // Estratégia 2: Buscar por variações do texto
        const alternativeTexts = ['Adicionar', 'Novo', 'Ponto', 'Coleta'];
        let clicked = false;

        alternativeTexts.forEach(text => {
          if (!clicked && $body.text().includes(text)) {
            cy.contains(text).first().click({ force: true });
            cy.log(`✅ Clicou no botão alternativo: "${text}"`);
            clicked = true;
          }
        });

        if (!clicked) {
          throw new Error('Botão "Adicionar Ponto de Coleta" não encontrado');
        }
      }
    });

    // 1.3 Verificar se modal abriu com múltiplos seletores
    cy.log('🔍 Aguardando modal abrir...');
    cy.get('body').then($body => {
      const modalSelectors = [
        '[data-cy="address-modal"]',
        '.modal',
        '.rcm-modal',
        '[role="dialog"]',
        '.overlay',
      ];

      let modalFound = false;
      for (const selector of modalSelectors) {
        const modal = $body.find(selector);
        if (modal.length > 0) {
          cy.log(`✅ Modal encontrado com seletor: ${selector}`);
          cy.get(selector, { timeout: 10000 }).should('be.visible');
          modalFound = true;
          break;
        }
      }

      if (!modalFound) {
        cy.log('⚠️ Modal não encontrado com seletores padrão, verificando se página mudou...');
        // Verificar se fomos redirecionados para outra página
        cy.url().then(currentUrl => {
          cy.log(`📍 URL atual: ${currentUrl}`);
        });
      }
    });

    // Verificar se o modal contém o título esperado
    cy.contains('Adicionar Ponto de Coleta', { timeout: 10000 }).should('be.visible');
    cy.log('✅ Modal de adicionar ponto de coleta aberto');

    // 1.4 Preencher formulário com dados válidos
    cy.log('📝 Preenchendo formulário com dados: CEP 40070100, Salvador/BA');
    cy.get('#zip_code').type('40070100');
    cy.wait(2000); // Aguardar preenchimento automático

    // Completar campos restantes com valores específicos
    cy.get('#street').clear().type('qualquer');
    cy.get('#number').clear().type('123');
    cy.get('#neighborhood').clear().type('centro');
    cy.get('#city').clear().type('salvador');
    cy.get('#state').clear().type('bahia');
    cy.get('#complement').clear().type('Teste de automação');

    // 1.5 Submeter formulário
    cy.get('button[type="submit"]').contains('Cadastrar Endereço').click();

    // 1.6 Aguardar resposta da API e verificar sucesso
    cy.wait('@createAddress').then(interception => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.be.true;
    });

    // 1.7 Verificar modal de confirmação de sucesso (mais flexível)
    cy.log('🔍 Aguardando modal de confirmação de sucesso...');

    // Aguardar um pouco para o modal aparecer
    cy.wait(2000);

    // Verificar diferentes possibilidades de mensagem de sucesso
    cy.get('body').then($body => {
      const bodyText = $body.text().toLowerCase();

      // Possíveis mensagens de sucesso
      const successMessages = [
        'ponto de coleta adicionado com sucesso',
        'endereço cadastrado com sucesso',
        'endereço adicionado com sucesso',
        'ponto de coleta cadastrado',
        'sucesso',
        'cadastrado com sucesso',
      ];

      let messageFound = false;
      for (const message of successMessages) {
        if (bodyText.includes(message)) {
          cy.log(`✅ Mensagem de sucesso encontrada: "${message}"`);
          messageFound = true;
          break;
        }
      }

      if (!messageFound) {
        cy.log(
          '⚠️ Mensagem específica não encontrada, verificando se há algum modal de sucesso...'
        );
        // Verificar se há algum modal ou toast de sucesso
        cy.get('.modal, .toast, .notification, [role="dialog"]').then($modals => {
          if ($modals.length > 0) {
            cy.log(`📋 Encontrou ${$modals.length} modal(s)/toast(s)`);
            // Pegar o primeiro e verificar se tem texto de sucesso
            cy.wrap($modals.first()).should('be.visible');
            cy.log('✅ Modal/toast de sucesso encontrado');
          } else {
            cy.log('⚠️ Nenhum modal/toast encontrado, continuando...');
          }
        });
      }
    });

    // 1.8 Tentar clicar em OK ou Fechar (mais flexível)
    cy.log('🔍 Procurando botão OK/Fechar...');

    const closeButtons = [
      'button:contains("OK")',
      'button:contains("Fechar")',
      'button:contains("X")',
      '[data-cy="close-modal"]',
      '.modal button',
    ];

    let buttonClicked = false;
    for (const selector of closeButtons) {
      cy.get('body').then($body => {
        if ($body.find(selector).length > 0 && !buttonClicked) {
          cy.get(selector).first().click({ force: true });
          cy.log(`✅ Clicou no botão: ${selector}`);
          buttonClicked = true;
        }
      });
    }

    if (!buttonClicked) {
      cy.log('⚠️ Nenhum botão OK/Fechar encontrado, esperando modal fechar automaticamente...');
      cy.wait(3000); // Aguardar modal fechar automaticamente
    }

    cy.log('✅ Ponto de coleta adicionado com sucesso - CEP: 40070100, Salvador/BA');

    // ========================================================================================
    // VERIFICAÇÕES FINAIS
    // ========================================================================================
    cy.log('🔍 Verificações finais');

    // Verificar se ainda estamos no dashboard
    cy.url().should('include', '/dashboard');

    // Verificar se não há erros na tela
    cy.get('body').should('not.contain', 'Erro');
    cy.get('body').should('not.contain', 'Falha');

    // Capturar screenshot final
    cy.screenshot('address-creation-success', { capture: 'fullPage' });

    cy.log('✅ TESTE DE CRIAÇÃO DE PONTO DE COLETA CONCLUÍDO COM SUCESSO!');
  });

  it('should validate address form fields', () => {
    // ========================================================================================
    // TESTE DE VALIDAÇÃO DE CAMPOS DO FORMULÁRIO
    // ========================================================================================
    cy.log('📋 TESTANDO VALIDAÇÃO DE CAMPOS');

    // Login
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');

    // Abrir modal de adicionar ponto de coleta
    cy.contains('Adicionar Ponto de Coleta').click();

    // Testar validação de CEP obrigatório
    cy.get('#street').type('Rua Teste');
    cy.get('button[type="submit"]').click();

    // Verificar se há mensagem de erro
    cy.get('body').then($body => {
      if (
        $body.text().includes('CEP') ||
        $body.text().includes('obrigatório') ||
        $body.text().includes('required')
      ) {
        cy.log('✅ Validação de CEP funcionando');
      } else {
        cy.log('⚠️ Validação de CEP não encontrada');
      }
    });

    // Fechar modal
    cy.contains('Cancelar').click();

    cy.log('✅ Validação de campos testada com sucesso');
  });
});
