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
  deliveries_total: number;
  by_vehicle?: VehicleRevenue[];
  by_client?: ClientRevenue[];
  by_partner?: PartnerRevenue[];
};

type VehicleRevenueItem = {
  id: string;
  type: 'collection' | 'parking' | 'quote' | 'delivery';
  description: string;
  amount: number;
  status?: string;
};

type VehicleRevenue = {
  vehicle_id: string;
  plate: string;
  brand: string;
  model: string;
  client_name?: string;
  total_revenue: number;
  items?: VehicleRevenueItem[];
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

type QuoteDetails = {
  id: string;
  total_value: number;
  status: string;
  services: {
    id: string;
    description: string;
    value: number;
    estimated_days: number | null;
    actual_days: number | null;
  }[];
  vehicle: {
    plate: string;
    brand: string;
    model: string;
  };
};

export default function FinancialOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'vehicles' | 'clients' | 'partners'>(
    'summary'
  );
  const [plateFilter, setPlateFilter] = useState<string>('');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const filteredVehicles = useMemo(() => {
    if (!totals?.by_vehicle) return [];
    if (!plateFilter.trim()) return totals.by_vehicle;

    const searchTerm = plateFilter.toLowerCase().trim();
    return totals.by_vehicle.filter(v => v.plate.toLowerCase().includes(searchTerm));
  }, [totals?.by_vehicle, plateFilter]);

  const fetchQuoteDetails = async (quoteId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/details`);
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do orçamento');
      }
      const data = await response.json();
      setQuoteDetails(data);
      setSelectedQuoteId(quoteId);
    } catch {
      setError('Erro ao carregar detalhes do orçamento');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedQuoteId(null);
    setQuoteDetails(null);
  };

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                Faturamento por Veículo
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    color: '#666',
                    background: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {filteredVehicles.length} {filteredVehicles.length === 1 ? 'veículo' : 'veículos'}
                </span>
              </h3>
              <input
                type="text"
                placeholder="Buscar por placa..."
                value={plateFilter}
                onChange={e => setPlateFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  width: 250,
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = '#002E4C')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map(v => (
                <div
                  key={v.vehicle_id}
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    padding: 16,
                  }}
                >
                  {/* Vehicle Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 12,
                      borderBottom: '2px solid #e5e7eb',
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#072e4c' }}>
                        Placa: {v.plate}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>
                        {v.brand} {v.model}
                        {v.client_name && (
                          <span style={{ marginLeft: 8 }}>• Cliente: {v.client_name}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e67e22' }}>
                      {formatBRL(v.total_revenue)}
                    </div>
                  </div>

                  {/* Vehicle Items */}
                  {v.items && v.items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {v.items.map(item => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid #f3f4f6',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: item.type === 'quote' ? '#002E4C' : '#333',
                                fontSize: '0.95rem',
                                cursor: item.type === 'quote' ? 'pointer' : 'default',
                                textDecoration: item.type === 'quote' ? 'underline' : 'none',
                              }}
                              onClick={() => {
                                if (item.type === 'quote' && item.id) {
                                  fetchQuoteDetails(item.id);
                                }
                              }}
                            >
                              {item.type === 'collection'
                                ? 'Coleta de Veículo'
                                : item.type === 'delivery'
                                  ? 'Entrega de Veículo'
                                  : item.type === 'parking'
                                    ? 'Parqueamento'
                                    : 'Serviços Executados'}
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                            {formatBRL(item.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
                      Nenhum item detalhado disponível.
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#666', margin: 0 }}>
                  {plateFilter.trim()
                    ? `Nenhum veículo encontrado com a placa "${plateFilter}"`
                    : 'Nenhum dado de veículo disponível.'}
                </p>
              </div>
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
              <div style={{ color: '#666', fontSize: 12 }}>Entregas (agendadas/entregues)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0891b2' }}>
                {formatBRL(totals.deliveries_total)}
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

      {/* Modal de Detalhes do Orçamento */}
      {selectedQuoteId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div
              style={{
                padding: 24,
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#002E4C' }}>
                  Detalhes do Orçamento
                </h2>
                {quoteDetails?.vehicle && (
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>
                    {quoteDetails.vehicle.brand} {quoteDetails.vehicle.model} -{' '}
                    {quoteDetails.vehicle.plate}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666',
                  padding: 8,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div style={{ padding: 24 }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  Carregando detalhes...
                </div>
              ) : quoteDetails ? (
                <>
                  {/* Resumo do Orçamento */}
                  <div
                    style={{
                      background: '#f9fafb',
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
                    >
                      <span style={{ color: '#666' }}>Valor Total:</span>
                      <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#002E4C' }}>
                        {formatBRL(quoteDetails.total_value)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Status:</span>
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>
                        {quoteDetails.status === 'finalized'
                          ? 'Finalizado'
                          : quoteDetails.status === 'in_execution'
                            ? 'Em Execução'
                            : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Serviços */}
                  <h3 style={{ marginBottom: 16, color: '#002E4C' }}>Serviços</h3>

                  {quoteDetails.services.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>
                      Nenhum serviço encontrado neste orçamento.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {quoteDetails.services.map(service => (
                        <div
                          key={service.id}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: 16,
                            background: '#fff',
                          }}
                        >
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, color: '#002E4C', marginBottom: 4 }}>
                              {service.description}
                            </div>
                            <div style={{ color: '#16a34a', fontSize: '1.1rem', fontWeight: 600 }}>
                              {formatBRL(service.value)}
                            </div>
                          </div>

                          {/* Prazos */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 12,
                              paddingTop: 12,
                              borderTop: '1px solid #f3f4f6',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                Prazo Planejado
                              </div>
                              <div style={{ fontWeight: 600, color: '#002E4C' }}>
                                {service.estimated_days !== null
                                  ? `${service.estimated_days} ${service.estimated_days === 1 ? 'dia' : 'dias'}`
                                  : 'Não definido'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                Prazo Realizado
                              </div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color:
                                    service.actual_days !== null
                                      ? service.actual_days <= (service.estimated_days || 0)
                                        ? '#16a34a'
                                        : '#dc2626'
                                      : '#6b7280',
                                }}
                              >
                                {service.actual_days !== null
                                  ? `${service.actual_days} ${service.actual_days === 1 ? 'dia' : 'dias'}`
                                  : 'Em execução'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  Erro ao carregar detalhes do orçamento.
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div
              style={{
                padding: 16,
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 24px',
                  background: '#002E4C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
