/// <reference types="cypress" />

/**
 * Teste de consistência do histórico de coletas (Admin API)
 * - Requer um token de admin válido (CYPRESS_ADMIN_TOKEN)
 * - Requer um clientId alvo (CYPRESS_TEST_CLIENT_ID)
 * - Valida que o histórico retorna entradas com campos obrigatórios
 * - Valida que a lista de placas (vehicles) é estável entre duas leituras para o mesmo collection_id
 */

describe('Histórico de coletas (Admin API)', () => {
  const baseUrl = Cypress.env('baseUrl') || 'http://localhost:3000';
  const adminToken = Cypress.env('ADMIN_TOKEN');
  const clientId = Cypress.env('TEST_CLIENT_ID');

  const skipMsg = 'ADMIN_TOKEN/TEST_CLIENT_ID ausentes. Teste ignorado.';

  function fetchSummary() {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/api/admin/client-collections-summary/${clientId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false,
    });
  }

  it('lista histórico com campos obrigatórios e placas estáveis', function () {
    if (!adminToken || !clientId) {
      cy.log(skipMsg);
      this.skip();
      return;
    }

    fetchSummary().then(first => {
      expect(first.status).to.eq(200);
      expect(first.body?.success).to.eq(true);
      const history = first.body?.collectionHistory || [];
      expect(history, 'history array').to.be.an('array');
      if (!history.length) {
        cy.log('Sem histórico para este cliente.');
        return;
      }

      // Pega o primeiro registro (mais recente)
      const h = history[0];
      expect(h).to.have.property('collection_address').that.is.a('string').and.is.not.empty;
      expect(h).to.have.property('collection_fee_per_vehicle');
      expect(h.collection_fee_per_vehicle).to.satisfy(
        (v: any) => v === null || typeof v === 'number'
      );
      expect(h).to.have.property('collection_date').that.is.a('string');
      expect(h).to.have.property('status').that.is.a('string');
      expect(h).to.have.property('vehicles');

      const cid = h.collection_id;
      const plates = (h.vehicles || []).map((v: any) => v.plate).sort();

      // Nova leitura para verificar estabilidade das placas
      fetchSummary().then(second => {
        expect(second.status).to.eq(200);
        expect(second.body?.success).to.eq(true);
        const history2 = second.body?.collectionHistory || [];
        const h2 = history2.find((x: any) => x.collection_id === cid) || history2[0];
        const plates2 = (h2?.vehicles || []).map((v: any) => v.plate).sort();

        // As placas não devem "mudar de linha" entre leituras
        expect(plates2, 'placas estáveis').to.deep.eq(plates);
      });
    });
  });
});
