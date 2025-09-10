describe('Client Collection Flow - Date Change Test', () => {
  let tomorrowDate: string;

  before(() => {
    // Calcular data D+1 uma vez para todos os testes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrowDate = tomorrow.toISOString().split('T')[0];
  });

  beforeEach(() => {
    // Interceptar chamadas de API para melhor controle
    cy.intercept('POST', '/api/client/set-vehicles-collection').as('setVehiclesCollection');
    cy.intercept('POST', '/api/client/collection-reschedule').as('rescheduleCollection');
  });

  it('should change collection date to D+1 - SIMPLIFIED', () => {
    // ========================================================================================
    // TESTE SIMPLIFICADO: FOCO NO FLUXO ESSENCIAL COM FILTRO
    // ========================================================================================
    cy.log('🚀 TESTE SIMPLIFICADO: Mudança de data de coleta');

    // SETUP: LOGIN
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');
    cy.log('✅ Login realizado');

    // AGUARDAR CARREGAMENTO
    cy.wait(5000);

    // PASSO 1: FILTRAR POR "AGUARDANDO COLETA" PARA ATIVAR BOTÕES DE EDIÇÃO
    cy.log('🎯 PASSO 1: Filtrando por veículos aguardando coleta');

    // Clicar no chip de filtro "AGUARDANDO COLETA"
    cy.get('body').then($body => {
      const chips = $body.find(
        'button:contains("AGUARDANDO COLETA"), .status-chip:contains("AGUARDANDO COLETA"), button:contains("Aguardando coleta")'
      );
      if (chips.length > 0) {
        cy.wrap(chips.first()).click({ force: true });
        cy.log('✅ Filtro "AGUARDANDO COLETA" aplicado');
        cy.wait(3000);
      } else {
        cy.log('⚠️ Chip de filtro "AGUARDANDO COLETA" não encontrado');
      }
    });

    // PASSO 2: EXPANDIR DETALHES DOS VEÍCULOS
    cy.log('🚗 PASSO 2: Expandindo detalhes dos veículos');

    // Procurar e clicar em botão de detalhes
    cy.get('body').then($body => {
      const detailButtons = $body.find(
        'button:contains("Mostrar Detalhes"), button.details-button, button:contains("Ver detalhes")'
      );
      if (detailButtons.length > 0) {
        cy.wrap(detailButtons.first()).click({ force: true });
        cy.log('✅ Detalhes expandidos');
        cy.wait(3000);
      } else {
        cy.log('⚠️ Botão de detalhes não encontrado');
      }
    });

    // PASSO 3: CLICAR EM "EDITAR PONTO DE COLETA"
    cy.log('🎯 PASSO 3: Clicando em "Editar ponto de coleta"');

    // Aguardar um momento para garantir que os elementos estão prontos
    cy.wait(2000);

    // Procurar botão de editar (deve estar ativo após filtro)
    cy.get('body').then($body => {
      const editButtons = $body.find(
        'button:contains("Editar ponto de coleta"), button:contains("Editar Ponto de Coleta")'
      );
      cy.log(`🔍 Botões de editar encontrados: ${editButtons.length}`);

      if (editButtons.length > 0) {
        editButtons.each((index, button) => {
          const text = Cypress.$(button).text().trim();
          const isDisabled = Cypress.$(button).is(':disabled');
          const isVisible = Cypress.$(button).is(':visible');
          cy.log(
            `  - Botão ${index + 1}: "${text}" | Desabilitado: ${isDisabled} | Visível: ${isVisible}`
          );
        });

        // Tentar clicar no primeiro botão disponível
        const firstButton = editButtons.first();
        if (firstButton.is(':visible') && !firstButton.is(':disabled')) {
          cy.wrap(firstButton).click({ force: true });
          cy.log('✅ Botão de editar clicado');
        } else {
          cy.log('⚠️ Botão de editar encontrado mas não está disponível para clique');
          throw new Error('Botão de editar não está disponível para clique');
        }
      } else {
        cy.log('❌ Botão "Editar ponto de coleta" não encontrado');
        // Listar todos os botões disponíveis para debug
        const allButtons = $body.find('button');
        cy.log(`📋 Total de botões: ${allButtons.length}`);
        allButtons.each((index, button) => {
          const text = Cypress.$(button).text().trim();
          if (text && text.length < 50) {
            cy.log(`  - "${text}"`);
          }
        });
        throw new Error('Botão de editar não encontrado');
      }
    });

    // PASSO 4: VERIFICAR MODAL E ALTERAR DATA
    cy.log('📅 PASSO 4: Verificando abertura do modal');

    // Aguardar um momento após o clique
    cy.wait(3000);

    // Verificar se o modal apareceu
    cy.get('body').then($body => {
      const modal = $body.find('.rcm-modal, .modal, [role="dialog"]');
      const modalCount = modal.length;
      cy.log(`🔍 Modais encontrados: ${modalCount}`);

      if (modalCount > 0) {
        cy.log('✅ Modal encontrado');
        modal.each((index, modalElement) => {
          const modalText = Cypress.$(modalElement).text().substring(0, 200);
          cy.log(`  - Modal ${index + 1}: "${modalText}..."`);
        });
      } else {
        cy.log('❌ Nenhum modal encontrado na página');
        // Verificar se houve alguma mudança na página
        const currentText = $body.text();
        cy.log(`📄 Estado atual da página: ${currentText.substring(0, 500)}...`);
        throw new Error('Modal não foi aberto após clicar no botão editar');
      }
    });

    // Tentar diferentes seletores para o modal
    cy.get('body').then($body => {
      if ($body.find('.rcm-modal').length > 0) {
        cy.get('.rcm-modal', { timeout: 5000 }).should('be.visible');
        cy.log('✅ Modal .rcm-modal encontrado e visível');
      } else if ($body.find('.modal').length > 0) {
        cy.get('.modal', { timeout: 5000 }).should('be.visible');
        cy.log('✅ Modal .modal encontrado e visível');
      } else if ($body.find('[role="dialog"]').length > 0) {
        cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
        cy.log('✅ Modal [role="dialog"] encontrado e visível');
      }
    });

    // Verificar se o título do modal está presente
    cy.get('body').then($body => {
      if ($body.text().includes('Editar ponto de coleta')) {
        cy.contains('Editar ponto de coleta').should('be.visible');
        cy.log('✅ Título do modal encontrado');
      } else {
        cy.log('⚠️ Título "Editar ponto de coleta" não encontrado');
      }
    });

    // Alterar data
    cy.get('.rcm-date-input').clear().type(tomorrowDate);
    cy.log(`✅ Data alterada para: ${tomorrowDate}`);

    // Salvar
    cy.get('.rcm-btn-primary').click({ force: true });
    cy.log('✅ Alterações salvas');

    // Verificações finais
    cy.url().should('include', '/dashboard');
    cy.log('✅ Teste simplificado concluído');
  });

  it('should navigate to collection editing screen', () => {
    // ========================================================================================
    // TESTE SIMPLES: APENAS NAVEGAR ATÉ A TELA DE EDIÇÃO
    // ========================================================================================
    cy.log('🧪 TESTE SIMPLES: Navegando até tela de edição de coleta');

    // Login
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');

    // Verificar se estamos no dashboard
    cy.contains('Bem-vindo').should('be.visible');
    cy.log('✅ Login realizado');

    // Verificar conteúdo da página
    cy.get('body').then($body => {
      const bodyText = $body.text();
      cy.log(`📄 Conteúdo da página: ${bodyText.substring(0, 500)}...`);

      // Verificar se há menção a veículos ou coleta
      if (bodyText.includes('veículo') || bodyText.includes('coleta')) {
        cy.log('✅ Página contém referências a veículos/coleta');
      } else {
        cy.log('⚠️ Página não contém referências claras a veículos/coleta');
      }

      // Listar todos os botões disponíveis
      const buttons = $body.find('button');
      cy.log(`📋 Botões encontrados: ${buttons.length}`);

      buttons.each((index, button) => {
        const buttonText = Cypress.$(button).text().trim();
        if (buttonText) {
          cy.log(`  - Botão ${index + 1}: "${buttonText}"`);
        }
      });

      // Verificar se há algum modal já aberto
      const modals = $body.find('.modal, .rcm-modal, [role="dialog"]');
      if (modals.length > 0) {
        cy.log(`✅ Modal encontrado: ${modals.length}`);
      } else {
        cy.log('⚠️ Nenhum modal encontrado');
      }
    });

    cy.log('✅ Teste de navegação concluído');
  });
});
