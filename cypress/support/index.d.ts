/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Login personalizado
     * @param email - Email do usuário
     * @param password - Senha do usuário
     */
    login(email: string, password: string): Chainable<void>;

    /**
     * Logout personalizado
     */
    logout(): Chainable<void>;
  }
}
