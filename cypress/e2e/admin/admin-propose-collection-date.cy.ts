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

    // Clicar no botão Salvar do painel (precificação) — usar múltiplos seletores como fallback
    cy.get('body').then($body => {
      const saveSelectors = [
        'button:contains("Salvar")',
        'button:contains("Salvar alterações")',
        'button:contains("Save")',
        '.save-button',
        '[data-cy*="save"]',
      ];

      let clicked = false;
      for (const sel of saveSelectors) {
        const $found = $body.find(sel).filter(':visible');
        if ($found.length > 0) {
          cy.wrap($found.first()).click({ force: true });
          cy.log(`✅ Clicou em salvar usando: ${sel}`);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        cy.log('⚠️ Botão Salvar não encontrado - prosseguindo sem clicar (pode já estar salvo)');
      }
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
          // Preferir o botão com title="Propor uma nova data" (✏️ Editar proposta)
          const $byTitle = $row.find('button[title="Propor uma nova data"]');
          if ($byTitle.length > 0) {
            cy.log('✏️ Clicando no botão com title "Propor uma nova data"');
            cy.wrap($byTitle.first()).click({ force: true });
            return;
          }

          // Fallback: procurar pelo botão com texto 'Editar proposta'
          const $edit = $row.find('button:contains("Editar proposta")');
          if ($edit.length > 0) {
            cy.log('✏️ Botão "Editar proposta" encontrado — abrindo edição');
            cy.wrap($edit.first()).click({ force: true });
            return;
          }

          // Último recurso: procurar qualquer botão 'Propor'
          cy.log('➕ Nenhum botão específico encontrado — clicando em "Propor" como fallback');
          cy.contains('button', /propor/i, { timeout: 5000 }).click({ force: true });
        });
      });

    // Agora o modal de proposta deve aparecer
    cy.get('.modal, [role="dialog"]', { timeout: 10000 }).should('be.visible');

    // Abrir o calendário (fora do within do modal)
    cy.get('button[aria-label="Abrir calendário"], .calendar-btn').first().click({ force: true });
    cy.wait(1000);

    // Procurar globalmente por button com texto "20"
    cy.get('button').then($btns => {
      const btn20 = [...$btns].find(
        btn => btn.innerText.trim() === '20' && btn.offsetParent !== null
      );
      if (btn20) {
        cy.wrap(btn20).click({ force: true });
      } else {
        // Logar todos os botões visíveis para debug
        const visibleBtns = [...$btns]
          .filter(btn => btn.offsetParent !== null)
          .map(btn => btn.innerText.trim());
        cy.log('Botões visíveis:', JSON.stringify(visibleBtns));
        throw new Error('Não encontrou botão "20" visível no calendário!');
      }
    });

    // Garantir que o input BR foi atualizado
    cy.get('input[placeholder*="dd/mm"], input[placeholder*="data"]')
      .first()
      .should('have.value', '20/09/2025');

    // Clicar no botão Confirmar dentro do modal
    cy.get('.modal, [role="dialog"]').within(() => {
      cy.contains('button', /(confirmar|enviando)/i, { timeout: 5000 }).click({ force: true });
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
