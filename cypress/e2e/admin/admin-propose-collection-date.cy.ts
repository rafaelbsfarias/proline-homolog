describe('Admin propose collection date flow', () => {
  beforeEach(() => {
    // interceptar a chamada do admin para propor data
    cy.intercept('POST', '/api/admin/propose-collection-date').as('proposeDate');
  });

  it('logs in as admin, opens client and proposes a new collection date', () => {
    // Acessar a tela de login
    cy.visit('/login');

    // Login admin
    cy.get('input[name="email"]').type('admin@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');
    cy.get('button[type="submit"]').click();

    // Confirma dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');

    // Abrir cliente exemplo
    cy.log('🔎 Abrindo Empresa Cliente 1528');
    cy.contains('Empresa Cliente 1528', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    // Esperar o painel de pontos de coleta para precificação
    // Esperar o carregamento da página/overview do cliente.
    // A UI pode exibir títulos ligeiramente diferentes ou demorar a renderizar a seção de precificação,
    // então verificar múltiplos marcadores visíveis no body para ser mais resiliente.
    cy.log('⏳ Aguardando a página de overview do cliente carregar (procurando por marcadores)');
    cy.get('body', { timeout: 20000 }).should($body => {
      const text = $body.text();
      const markers = [
        'Pontos de coleta para precifica',
        'Pontos de coleta para precificação',
        'Visão geral',
        'Overview',
        'Dados do cliente',
        'Endereços',
        'Pontos de coleta',
      ];
      const found = markers.some(m => text.includes(m));
      expect(found, `esperado encontrar um dos marcadores: ${markers.join(', ')}`).to.be.true;
    });

    // Localizar a linha do ponto de coleta desejado (ajuste o texto conforme sua UI)
    const pontoTexto = 'qualquer, 123 - salvador';
    // Antes de propor, garantir que o ponto esteja precificado: preencher o valor e salvar
    cy.contains(pontoTexto, { timeout: 10000 })
      .should('be.visible')
      .closest('tr')
      .within(() => {
        // preencher o campo de Valor da coleta se existir — consultar o DOM da linha para evitar
        // que o comando falhe quando nenhum input estiver presente.
        cy.root().then($row => {
          const $visibleInput = $row.find('input:visible').first();
          if ($visibleInput && $visibleInput.length) {
            cy.wrap($visibleInput).clear().type('10,00').should('have.value', '10,00');
          } else {
            cy.log('⚠️ Nenhum input de valor visível encontrado na linha do ponto de coleta');
          }
        });
      });

    // Clicar no botão Salvar do painel (precificação)
    cy.contains('button', 'Salvar', { timeout: 5000 }).then($btn => {
      if ($btn && $btn.is(':visible')) cy.wrap($btn).click({ force: true });
    });

    // Pequena espera para o save propagar (ou aguardar request se houver endpoint)
    cy.wait(1000);

    // Agora acionar o fluxo de 'Propor' de forma resiliente.
    // Se houver um botão 'Editar proposta' preferir esse caminho (edição de proposta existente),
    // caso contrário clicar em 'Propor' para criar uma nova proposta.
    cy.contains(pontoTexto, { timeout: 10000 })
      .closest('tr')
      .within(() => {
        cy.root().then($row => {
          // procurar por botão 'Editar proposta' dentro da linha
          const $edit = $row.find('button:contains("Editar proposta")');
          if ($edit.length > 0) {
            cy.log('✏️ Botão "Editar proposta" encontrado — abrindo edição');
            cy.wrap($edit.first()).click({ force: true });
          } else {
            cy.log('➕ Botão "Editar proposta" não encontrado — clicando em "Propor"');
            cy.contains('button', /propor/i, { timeout: 5000 }).click({ force: true });
          }
        });
      });

    // Agora o modal de proposta deve aparecer
    cy.get('.modal, [role="dialog"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        // Preencher a data no formato brasileiro
        const targetDateBR = '20/09/2025';
        // Tentar input[type=date] ou input por placeholder
        cy.get('input[type="date"]')
          .first()
          .then($d => {
            if ($d && $d.length) {
              // se for input date, usar ISO string via invoke
              cy.wrap($d).invoke('val', '2025-09-20').trigger('change');
            } else {
              cy.get('input[placeholder*="dd/mm"], input[placeholder*="data"]')
                .first()
                .clear()
                .type(targetDateBR)
                .blur();
            }
          });

        // Clicar no botão Propor dentro do modal
        cy.contains('button', /propor/i, { timeout: 5000 })
          .should('be.visible')
          .click({ force: true });
      });

    // Aguardar a requisição real do backend
    cy.wait('@proposeDate', { timeout: 10000 }).then(interception => {
      cy.log(
        '🔁 propose-collection-date payload:',
        JSON.stringify(interception.request.body || {})
      );
      // Salvar interception para análise
      try {
        cy.writeFile('cypress/results/propose-date-interception.json', {
          body: interception.request.body || {},
          headers: interception.request.headers || {},
          status: interception.response?.statusCode,
          responseBody: interception.response?.body,
        });
      } catch (e) {
        cy.log('⚠️ Falha ao salvar interception: ' + String(e));
      }

      // Asserções sobre a resposta
      expect(interception.response && interception.response.statusCode).to.be.oneOf([
        200, 201, 204,
      ]);
      if (interception.response && interception.response.body) {
        const resp = interception.response.body as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(resp, 'success')) {
          expect(resp.success).to.equal(true);
        }
      }
    });

    // Opcional: verificar que a interface mostra a data proposta
    cy.contains('20/09/2025', { timeout: 5000 }).should('be.visible');
  });
});
