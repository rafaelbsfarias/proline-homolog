'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Header from '@/modules/admin/components/Header';
import Link from 'next/link';
import { supabase } from '@/modules/common/services/supabaseClient';

type QuotesByStatus = {
  finalized: number;
  in_execution: number;
  pending: number;
  total: number;
};

type Totals = {
  collections_total: number;
  parking_total_today: number;
  quotes_by_status: QuotesByStatus;
  purchased_parts_total: number;
  by_vehicle?: VehicleRevenue[];
  by_client?: ClientRevenue[];
  by_partner?: PartnerRevenue[];
};

type VehicleRevenue = {
  vehicle_id: string;
  plate: string;
  brand: string;
  model: string;
  total_revenue: number;
};

type ClientRevenue = {
  client_id: string;
  client_name: string;
  total_revenue: number;
  vehicle_count: number;
};

type PartnerRevenue = {
  partner_id: string;
  company_name: string;
  total_revenue: number;
  quote_count: number;
};

function formatBRL(v: number) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinancialOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'vehicles' | 'clients' | 'partners'>(
    'summary'
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const resp = await fetch('/api/admin/financial-overview', {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const data = await resp.json();
        if (!mounted) return;
        if (!resp.ok) {
          setError(data?.error || 'Erro ao carregar resumo financeiro');
          setTotals(null);
        } else {
          setTotals(data as Totals);
        }
      } catch {
        if (!mounted) return;
        setError('Erro ao carregar resumo financeiro');
        setTotals(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const projectedRevenue = useMemo(() => {
    if (!totals) return 0;
    return (totals.quotes_by_status?.in_execution || 0) + (totals.quotes_by_status?.pending || 0);
  }, [totals]);

  const renderTabContent = () => {
    if (loading) {
      return (
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            padding: 16,
          }}
        >
          Carregando...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 16, borderRadius: 8 }}>
          {error}
        </div>
      );
    }

    if (!totals) return null;

    switch (activeTab) {
      case 'vehicles':
        return (
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Faturamento por Veículo</h3>
            {totals.by_vehicle && totals.by_vehicle.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Placa</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Veículo</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Receita Total</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.by_vehicle.map(v => (
                    <tr key={v.vehicle_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 8 }}>{v.plate}</td>
                      <td style={{ padding: 8 }}>
                        {v.brand} {v.model}
                      </td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>
                        {formatBRL(v.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666' }}>Nenhum dado de veículo disponível.</p>
            )}
          </div>
        );

      case 'clients':
        return (
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Faturamento por Cliente</h3>
            {totals.by_client && totals.by_client.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Cliente</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Veículos</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Receita Total</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.by_client.map(c => (
                    <tr key={c.client_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 8 }}>{c.client_name}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{c.vehicle_count}</td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>
                        {formatBRL(c.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666' }}>Nenhum dado de cliente disponível.</p>
            )}
          </div>
        );

      case 'partners':
        return (
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Faturamento por Parceiro</h3>
            {totals.by_partner && totals.by_partner.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Parceiro</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Orçamentos</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Receita Total</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.by_partner.map(p => (
                    <tr key={p.partner_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 8 }}>{p.company_name}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{p.quote_count}</td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>
                        {formatBRL(p.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666' }}>Nenhum dado de parceiro disponível.</p>
            )}
          </div>
        );

      default: // summary
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#666', fontSize: 12 }}>Coletas (aprovadas)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0d9488' }}>
                {formatBRL(totals.collections_total)}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#666', fontSize: 12 }}>Parqueamento (dia)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#7c3aed' }}>
                {formatBRL(totals.parking_total_today)}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#666', fontSize: 12 }}>Orçamentos Finalizados</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>
                {formatBRL(totals.quotes_by_status?.finalized || 0)}
              </div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>Base de faturamento</div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#666', fontSize: 12 }}>Em Execução</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
                {formatBRL(totals.quotes_by_status?.in_execution || 0)}
              </div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>Projeção</div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#666', fontSize: 12 }}>Pendentes</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6b7280' }}>
                {formatBRL(totals.quotes_by_status?.pending || 0)}
              </div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>Projeção</div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#666', fontSize: 12 }}>Peças compradas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#dc2626' }}>
                {formatBRL(totals.purchased_parts_total)}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#666', fontSize: 12 }}>Total Geral (Orçamentos)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>
                {formatBRL(totals.quotes_by_status?.total || 0)}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '2px solid #16a34a',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                Projeção de Receita
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>
                {formatBRL(projectedRevenue)}
              </div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                Em execução + Pendentes
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: '#002E4C',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Voltar
        </Link>

        <h1 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Resumo Financeiro Geral</h1>

        {/* Tabs */}
        <div
          style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}
        >
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'summary' ? '#002E4C' : 'transparent',
              color: activeTab === 'summary' ? '#fff' : '#666',
              border: 'none',
              borderBottom: activeTab === 'summary' ? '2px solid #002E4C' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'summary' ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            Resumo
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'vehicles' ? '#002E4C' : 'transparent',
              color: activeTab === 'vehicles' ? '#fff' : '#666',
              border: 'none',
              borderBottom: activeTab === 'vehicles' ? '2px solid #002E4C' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'vehicles' ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            Por Veículo
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'clients' ? '#002E4C' : 'transparent',
              color: activeTab === 'clients' ? '#fff' : '#666',
              border: 'none',
              borderBottom: activeTab === 'clients' ? '2px solid #002E4C' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'clients' ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            Por Cliente
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'partners' ? '#002E4C' : 'transparent',
              color: activeTab === 'partners' ? '#fff' : '#666',
              border: 'none',
              borderBottom: activeTab === 'partners' ? '2px solid #002E4C' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'partners' ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            Por Parceiro
          </button>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </main>
    </div>
  );
}
