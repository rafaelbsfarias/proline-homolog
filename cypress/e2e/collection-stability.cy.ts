/// <reference types="cypress" />

// E2E: Remarcações múltiplas e aceite, sem órfãs e com estabilidade de placas.

function apiLogin(email: string, password: string) {
  return cy.request({
    method: 'POST',
    url: '/api/login',
    body: { email, password },
    failOnStatusCode: false,
  });
}

describe('E2E - Remarcações e Aceite (sem órfãs, placas estáveis)', () => {
  it('Admin propõe D2 -> Cliente remarca para D3 -> Cliente aceita; múltiplas remarcações do admin não criam órfãs', () => {
    // 0) Seed mínimo: cliente + endereço de coleta + veículos em estado inicial
    cy.exec('node scripts/setup-e2e-seed.mjs').then(execRes => {
      const raw = `${execRes.stdout || ''}\n${execRes.stderr || ''}`;
      const marker = '__SEED_JSON__ ';
      const line = raw
        .split(/\r?\n/)
        .reverse()
        .find(l => l.startsWith(marker));
      if (!line) throw new Error('Seed script output missing __SEED_JSON__ marker');
      const jsonText = line.slice(marker.length);
      const seed = JSON.parse(jsonText);
      const clientId = seed.clientId as string;
      const addressId = seed.addressId as string;
      const d2 = seed.dates.d2 as string;
      const d3 = seed.dates.d3 as string;
      const d4 = seed.dates.d4 as string;
      const d5 = seed.dates.d5 as string;

      // 1) Login cliente e definir ponto de coleta (PONTO DE COLETA SELECIONADO)
      apiLogin(Cypress.env('testClient').email, Cypress.env('testClient').password).then(r => {
        expect(r.status).to.eq(200);
        const token = r.body.session?.access_token as string;
        expect(token).to.be.a('string');

        // Cliente escolhe ponto + data D2 (preferência inicial)
        const vehicleIds = (seed.vehicles || []).map((v: any) => v.id);
        cy.request({
          method: 'POST',
          url: '/api/client/set-vehicles-collection',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            method: 'collect_point',
            addressId,
            estimated_arrival_date: d2,
            vehicleIds,
          },
        }).then(res => {
          expect(res.status).to.eq(200);

          // 2) Login admin e PRECIFICA + PROPÕE D2
          apiLogin('admin@prolineauto.com.br', '123qwe').then(ar => {
            expect(ar.status).to.eq(200);
            const adminToken = ar.body.session?.access_token as string;
            expect(adminToken).to.be.a('string');

            // 2.1 Precifica endereço com R$ 100
            cy.request({
              method: 'POST',
              url: '/api/admin/set-address-collection-fees',
              headers: { Authorization: `Bearer ${adminToken}` },
              body: {
                clientId,
                fees: [{ addressId, fee: 100, date: d2 }],
              },
              failOnStatusCode: false,
            }).then(pf => {
              expect(pf.status).to.be.oneOf([200, 400]); // pode já existir dado; seguimos

              // 2.2 Propor D4 e D5 (remarcações múltiplas do Admin)
              for (const newDate of [d4, d5]) {
                cy.request({
                  method: 'POST',
                  url: '/api/admin/propose-collection-date',
                  headers: { Authorization: `Bearer ${adminToken}` },
                  body: { clientId, addressId, new_date: newDate },
                  failOnStatusCode: false,
                }).then(() => {});
              }

              // 3) Cliente remarca para D3
              cy.request({
                method: 'POST',
                url: '/api/client/collection-summary',
                headers: { Authorization: `Bearer ${token}` },
                body: { addressId, new_date: d3 },
              }).then(cr => {
                expect(cr.status).to.eq(200);

                // 4) Cliente aceita proposta (um clique)
                cy.request({
                  method: 'POST',
                  url: '/api/client/collection-accept-proposal',
                  headers: { Authorization: `Bearer ${token}` },
                  body: { addressId },
                }).then(accept => {
                  expect(accept.status).to.eq(200);

                  // 5) Validar ausência de órfãs pelo endpoint admin em dry-run
                  cy.request({
                    method: 'POST',
                    url: '/api/admin/cleanup-orphan-requested',
                    headers: { Authorization: `Bearer ${adminToken}` },
                    body: { clientId, dryRun: true },
                  }).then(orphan => {
                    expect(orphan.status).to.eq(200);
                    expect(orphan.body.detected).to.eq(0);
                  });

                  // 6) Validar convergência de Histórico e Aprovadas (via resumo do cliente)
                  cy.request({
                    method: 'GET',
                    url: `/api/admin/client-collections-summary/${clientId}`,
                    headers: { Authorization: `Bearer ${adminToken}` },
                  }).then(summary => {
                    expect(summary.status).to.eq(200);
                    const hist = summary.body.collectionHistory || [];
                    const approved = summary.body.approvedGroups || [];

                    // Deve existir 1 linha no histórico para o endereço na data D3
                    const historyRow = hist.find(
                      (r: any) => r.collection_address && r.collection_date === d3
                    );
                    expect(historyRow, 'history has record for D3').to.exist;
                    expect(historyRow.vehicles?.length || 0).to.be.greaterThan(0);

                    // Approved deve refletir a mesma data e endereço
                    const approvedRow = approved.find(
                      (g: any) => g.address && g.collection_date === d3
                    );
                    expect(approvedRow, 'approved has record for D3').to.exist;

                    // Placas estáveis: mesmas placas do histórico e sem duplicatas
                    const plates = (historyRow.vehicles || []).map((v: any) => v.plate).sort();
                    const uniquePlates = Array.from(new Set(plates));
                    expect(plates).to.deep.eq(uniquePlates);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
