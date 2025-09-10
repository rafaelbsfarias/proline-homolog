describe('Admin Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/login'); // Assuming the login page is at /login
  });

  it('should allow admin to login and view dashboard', () => {
    // Input admin credentials
    cy.get('input[name="email"]').type('admin@prolineauto.com.br');
    cy.get('input[name="password"]').type('123qwe');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Verify successful login and redirection to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo, Administrador').should('be.visible'); // Assuming this text appears for admin
    // Further checks for admin dashboard elements can be added here

    // Após login, clicar em 'Empresa Cliente 1528'
    cy.log('🔎 Clicando em "Empresa Cliente 1528"');
    cy.contains('Empresa Cliente 1528', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });
    // Verificar redirecionamento para a área de cliente no admin (rota aproximada)
    cy.url({ timeout: 10000 }).should('include', '/admin/clients');

    // Aguardar o painel de pontos de coleta para precificação aparecer
    cy.contains('Pontos de coleta para precificação', { timeout: 10000 }).should('be.visible');

    // Localizar a linha do ponto de coleta esperado e preencher 'Valor da coleta (R$)' com 10,00
    const pontoTexto = 'qualquer, 123 - salvador';
    cy.contains(pontoTexto, { timeout: 10000 })
      .should('be.visible')
      .closest('tr')
      .within(() => {
        // Encontrar o input correspondente ao valor da coleta e digitar 10,00
        cy.get('input').filter(':visible').first().clear().type('10,00');
        // Verificar que o valor foi preenchido
        cy.get('input').filter(':visible').first().should('have.value', '10,00');
      });

    // Clicar no botão Salvar no canto inferior do painel
    cy.contains('button', 'Salvar', { timeout: 5000 }).should('be.visible').click({ force: true });
    // Após salvar, um modal de confirmação é aberto — clicar em OK
    // Primeiro tentar clicar no OK dentro de um modal visível
    // Tentar clicar no OK dentro do modal, senão procurar um botão OK global como fallback
    cy.get('body').then($body => {
      const modal = $body.find('.modal, [role="dialog"]').first();
      if (modal && modal.length) {
        cy.wrap(modal).within(() => {
          cy.contains('button', /^ok$/i, { timeout: 3000 })
            .should('be.visible')
            .click({ force: true });
        });
        cy.log('✅ Modal de confirmação fechado (OK clicado)');
      } else {
        // Fallback global: procurar qualquer botão 'OK' e clicar
        cy.contains('button', /^ok$/i, { timeout: 3000 }).click({ force: true });
        cy.log('✅ OK global clicado como fallback');
      }
    });
  });

  // Add more tests for admin functionalities later
});
