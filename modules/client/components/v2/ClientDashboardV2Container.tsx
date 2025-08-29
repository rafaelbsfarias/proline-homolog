import React from 'react';
import Header from '@/modules/admin/components/Header';
import { useClientOverview } from '@/modules/client/hooks/useClientOverview';

const ClientDashboardV2Container: React.FC = () => {
  const { collections, approvals } = useClientOverview();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 12px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>
          Painel do Cliente (V2)
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Este painel está ativado via flag para validação incremental.
        </p>

        <section style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Resumo de Coletas</h2>
          {collections.loading ? (
            <div>Carregando resumo...</div>
          ) : (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <b>Grupos:</b> {collections.groups.length}
              </div>
              <div>
                <b>Veículos:</b> {collections.count}
              </div>
              <div>
                <b>Total aprovação:</b> R$ {collections.approvalTotal.toFixed(2)}
              </div>
            </div>
          )}
        </section>

        <section style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Aguardando Aprovação</h2>
          {approvals.loading ? (
            <div>Carregando propostas...</div>
          ) : approvals.error ? (
            <div style={{ color: '#b00' }}>{approvals.error}</div>
          ) : approvals.groups?.length ? (
            <ul>
              {approvals.groups.map(g => (
                <li key={g.addressId}>
                  {g.address} — {g.vehicle_count} veículos — R${' '}
                  {typeof g.collection_fee === 'number' ? g.collection_fee.toFixed(2) : '—'} —{' '}
                  {g.collection_date || 'sem data'}
                </li>
              ))}
            </ul>
          ) : (
            <div>Nenhuma proposta pendente.</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ClientDashboardV2Container;
