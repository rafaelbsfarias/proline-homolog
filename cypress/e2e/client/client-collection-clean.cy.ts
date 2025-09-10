describe('Client Collection Flow - Clean Test', () => {
  const targetDateBR = '11/09/2025';

  beforeEach(() => {
    cy.intercept('POST', '/api/client/set-vehicles-collection').as('setVehiclesCollection');
    cy.intercept('POST', '/api/client/collection-reschedule').as('rescheduleCollection');
  });

  it('should complete collection date and point change successfully', () => {
    // Login
    cy.login('cliente@prolineauto.com.br', '123qwe');
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo').should('be.visible');

    // Wait for page to load completely
    cy.wait(8000);

    // Apply "AGUARDANDO COLETA" filter
    cy.get('body').then($body => {
      const filterSelectors = [
        'button:contains("AGUARDANDO COLETA")',
        'button:contains("Aguardando coleta")',
        '[data-status="AGUARDANDO COLETA"]',
      ];

      for (const selector of filterSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });

    cy.wait(5000);

    // Expand vehicle details
    cy.get('body').then($body => {
      const detailSelectors = [
        'button:contains("Mostrar Detalhes")',
        'button:contains("Ver detalhes")',
        'button[data-action="expand"]',
      ];

      for (const selector of detailSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });

    cy.wait(3000);

    // Click "Editar ponto de coleta" button
    cy.get('body').then($body => {
      const editSelectors = [
        'button:contains("Editar ponto de coleta")',
        'button:contains("Editar Ponto de Coleta")',
        'button[data-action="edit-collection"]',
      ];

      for (const selector of editSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });

    // Wait for modal and select collection point
    cy.wait(3000);

    // Select collection point from dropdown
    cy.get('body').then($body => {
      const dropdownSelectors = [
        '.rcm-select',
        'select[name*="coleta"]',
        'select[name*="address"]',
        'select',
      ];

      for (const selector of dropdownSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).then($select => {
            if ($select.find('option').length > 1) {
              const firstValidOption = $select.find('option').eq(1);
              const value = firstValidOption.val();
              if (value && value !== '') {
                cy.get(selector).select(value, { force: true });
                return false; // break out of loop
              }
            }
          });
          break;
        }
      }
    });

    cy.wait(1000);

    // Change date
    cy.get('.rcm-date-input').clear().type(targetDateBR);
    cy.wait(500);

    // Save changes
    cy.get('.rcm-btn-primary').should('be.visible').click({ force: true });

    // Wait for API call
    cy.wait('@setVehiclesCollection', { timeout: 10000 });

    // Verify we're back on dashboard
    cy.url().should('include', '/dashboard');
  });
});
