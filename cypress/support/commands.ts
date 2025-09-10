/// <reference types="cypress" />

// login usa a rota correta /login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login'); // Corrigido: a rota correta é /login, não /entrar
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('logout', () => {
  cy.get('button, a').contains(/sair/i).click({ force: true });
});

Cypress.Commands.add('apiLogin', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/login`,
    body: { email, password },
    failOnStatusCode: false,
  });
});
