describe('Debug: Encontrar Ícone de Expansão (+)', () => {
  it('should find and highlight the expansion icon (+) for debugging', () => {
    const clientEmail = Cypress.env('testClient').email;
    const clientPassword = Cypress.env('testClient').password;

    cy.log('🔍 TESTE ESPECÍFICO: Encontrar ícone de expansão (+)');

    cy.log('🔐 Login como cliente');
    cy.login(clientEmail, clientPassword);
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    cy.log('🚗 Localizar seção "Meus Veículos"');
    cy.get('.vehicle-counter', { timeout: 10000 }).should('be.visible');

    // Aguardar carregamento completo
    cy.wait(5000);

    cy.log('🔍 ANÁLISE COMPLETA DA PÁGINA PARA ENCONTRAR O ÍCONE +');

    // Screenshot inicial para comparação
    cy.screenshot('página-inicial-busca-ícone');

    cy.get('body').then($body => {
      cy.log('📋 ESTRATÉGIA 1: Procurar por símbolos + literais');

      // Buscar por qualquer elemento que contenha o símbolo +
      const elementsWithPlus = $body.find('*').filter(function () {
        const text = Cypress.$(this).text();
        return text.includes('+') || text.includes('⊕') || text.includes('⊞');
      });

      if (elementsWithPlus.length > 0) {
        cy.log(`✅ Encontrou ${elementsWithPlus.length} elemento(s) com símbolo +`);
        elementsWithPlus.each((index, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          const tagName = $el.prop('tagName');
          const className = $el.attr('class') || '';

          cy.log(`   + Elemento ${index + 1}: <${tagName}> texto="${text}" class="${className}"`);

          // Se for clicável, destacar
          if (tagName === 'BUTTON' || $el.is('[onclick]') || $el.css('cursor') === 'pointer') {
            cy.wrap($el).then($clickableEl => {
              $clickableEl.css('border', '3px solid red');
              $clickableEl.css('background-color', 'yellow');
              cy.log(`   🎯 ELEMENTO CLICÁVEL COM + DESTACADO: ${text}`);
            });
          }
        });
      } else {
        cy.log('❌ Nenhum elemento com símbolo + encontrado literalmente');
      }

      cy.log('📋 ESTRATÉGIA 2: Procurar por ícones SVG de expansão');

      // Procurar por SVGs que podem ser ícones de +
      cy.get('svg').then($svgs => {
        cy.log(`🎨 Analisando ${$svgs.length} ícones SVG`);

        $svgs.each((index, svg) => {
          const $svg = Cypress.$(svg);
          const className = $svg.attr('class') || '';
          const parent = $svg.parent();
          const parentTag = parent.prop('tagName');
          const parentClass = parent.attr('class') || '';
          const viewBox = $svg.attr('viewBox') || '';
          const paths = $svg.find('path').length;

          cy.log(`   SVG ${index + 1}:`);
          cy.log(`      class: "${className}"`);
          cy.log(`      parent: <${parentTag}> class="${parentClass}"`);
          cy.log(`      viewBox: "${viewBox}"`);
          cy.log(`      paths: ${paths}`);

          // Destacar SVGs que estão dentro de botões
          if (parentTag === 'BUTTON') {
            cy.wrap(parent).then($parentButton => {
              $parentButton.css('border', '3px solid blue');
              $parentButton.css('background-color', 'lightblue');
              cy.log(`   🎯 SVG DENTRO DE BOTÃO DESTACADO!`);
            });
          }

          // Destacar SVGs com classes suspeitas de expansão
          if (
            className.includes('plus') ||
            className.includes('expand') ||
            className.includes('toggle')
          ) {
            cy.wrap($svg).then($suspiciousSvg => {
              $suspiciousSvg.css('filter', 'drop-shadow(0 0 10px red)');
              cy.log(`   🎯 SVG COM CLASSE SUSPEITA DESTACADO: ${className}`);
            });
          }
        });
      });

      cy.log('📋 ESTRATÉGIA 3: Procurar por botões próximos à área de veículos');

      // Procurar botões especificamente na área dos veículos
      cy.get('.vehicle-counter')
        .parent()
        .find('button')
        .then($vehicleButtons => {
          cy.log(`🚗 Encontrou ${$vehicleButtons.length} botão(ões) na área dos veículos`);

          $vehicleButtons.each((index, btn) => {
            const $btn = Cypress.$(btn);
            const text = $btn.text().trim();
            const ariaLabel = $btn.attr('aria-label') || '';
            const title = $btn.attr('title') || '';
            const className = $btn.attr('class') || '';

            cy.log(`   Botão veículo ${index + 1}:`);
            cy.log(`      texto: "${text}"`);
            cy.log(`      aria-label: "${ariaLabel}"`);
            cy.log(`      title: "${title}"`);
            cy.log(`      class: "${className}"`);

            // Destacar todos os botões da área de veículos
            cy.wrap($btn).then($vehicleBtn => {
              $vehicleBtn.css('border', '3px solid green');
              $vehicleBtn.css('background-color', 'lightgreen');
            });
          });
        });

      cy.log('📋 ESTRATÉGIA 4: Procurar por elementos com aria-expanded="false"');

      cy.get('[aria-expanded="false"]').then($expandableElements => {
        if ($expandableElements.length > 0) {
          cy.log(`📂 Encontrou ${$expandableElements.length} elemento(s) expandível(eis)`);

          $expandableElements.each((index, el) => {
            const $el = Cypress.$(el);
            const text = $el.text().trim();
            const tagName = $el.prop('tagName');
            const className = $el.attr('class') || '';

            cy.log(`   Expandível ${index + 1}: <${tagName}> texto="${text}" class="${className}"`);

            // Destacar elementos expandíveis
            cy.wrap($el).then($expandableEl => {
              $expandableEl.css('border', '3px solid purple');
              $expandableEl.css('background-color', 'lavender');
            });
          });
        } else {
          cy.log('❌ Nenhum elemento com aria-expanded="false" encontrado');
        }
      });
    });

    // Pausa longa para você observar todos os destaques
    cy.wait(10000);

    // Screenshot final com todos os elementos destacados
    cy.screenshot('análise-completa-ícones-destacados');

    cy.log('🎯 ANÁLISE CONCLUÍDA! Verifique os elementos destacados:');
    cy.log('   🔴 Vermelho/Amarelo: Elementos com símbolo + literal');
    cy.log('   🔵 Azul: SVGs dentro de botões');
    cy.log('   🟢 Verde: Botões na área dos veículos');
    cy.log('   🟣 Roxo: Elementos com aria-expanded="false"');
  });
});
