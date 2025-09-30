'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { useSearchParams } from 'next/navigation';
import Modal from '@/modules/common/components/Modal/Modal';

type PartnerSummary = {
  id: string;
  company_name: string;
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
  is_active?: boolean;
  quotes?: {
    pending_admin_approval: any[];
    pending_client_approval: any[];
    approved: any[];
    rejected: any[];
    executing: any[];
  };
};

export default function PartnerOverviewPage() {
  const params = useSearchParams();
  const partnerId = params.get('partnerId') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerSummary | null>(null);
  const [quotes, setQuotes] = useState<{
    pending_admin_approval: any[];
    pending_client_approval: any[];
    approved: any[];
    rejected: any[];
    executing: any[];
  } | null>(null);
  const [services, setServices] = useState<
    {
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      is_active: boolean;
      created_at: string;
    }[]
  >([]);

  // Filters
  const [quoteQuery, setQuoteQuery] = useState('');
  const [quoteStatus, setQuoteStatus] = useState<
    | 'all'
    | 'pending_admin_approval'
    | 'pending_client_approval'
    | 'approved'
    | 'rejected'
    | 'executing'
  >('pending_admin_approval');
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceStatus, setServiceStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<null | { quote: any; items: any[] }>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!partnerId) {
          setError('Parâmetro partnerId ausente');
          setPartner(null);
          return;
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const resp = await fetch(`/api/admin/partners/${partnerId}/overview`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const data = await resp.json();
        if (!mounted) return;
        if (!resp.ok) {
          setError(data?.error || 'Erro ao carregar parceiro');
          setPartner(null);
          return;
        }
        setPartner(data.partner as PartnerSummary);
        // Normalizar estrutura de quotes para evitar chaves ausentes
        const q = (data.partner?.quotes || {}) as any;
        const normalized = {
          pending_admin_approval: Array.isArray(q.pending_admin_approval)
            ? q.pending_admin_approval
            : [],
          pending_client_approval: Array.isArray(q.pending_client_approval)
            ? q.pending_client_approval
            : [],
          approved: Array.isArray(q.approved) ? q.approved : [],
          rejected: Array.isArray(q.rejected) ? q.rejected : [],
          executing: Array.isArray(q.executing) ? q.executing : [],
        };
        setQuotes(normalized);

        // Load services
        const respServices = await fetch(`/api/admin/partners/${partnerId}/services`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const dataServices = await respServices.json();
        setServices(
          respServices.ok && Array.isArray(dataServices.services) ? dataServices.services : []
        );
      } catch (e) {
        if (!mounted) return;
        setError('Erro de rede ao carregar parceiro');
        setPartner(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [partnerId]);

  const filteredQuotes = useMemo(() => {
    const q = quoteQuery.trim().toLowerCase();
    const flatten: any[] = [];
    if (quotes) {
      const keys: (keyof NonNullable<typeof quotes>)[] = [
        'pending_admin_approval',
        'pending_client_approval',
        'approved',
        'rejected',
        'executing',
      ];
      keys.forEach(k => {
        if (quoteStatus === 'all' || quoteStatus === k) {
          (quotes[k] || []).forEach(item => flatten.push({ ...item, _group: k }));
        }
      });
    }
    return flatten.filter(item => {
      if (!q) return true;
      return (
        String(item.id).toLowerCase().includes(q) ||
        String(item.service_order_id || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [quotes, quoteQuery, quoteStatus]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    return services.filter(s => {
      const byName = !q || s.name.toLowerCase().includes(q);
      if (!byName) return false;
      switch (serviceStatus) {
        case 'active':
          return s.is_active;
        case 'inactive':
          return !s.is_active;
        default:
          return true;
      }
    });
  }, [services, serviceQuery, serviceStatus]);

  const toggleService = async (serviceId: string, nextActive: boolean) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resp = await fetch(`/api/admin/partners/${partnerId}/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (resp.ok) {
        setServices(prev =>
          prev.map(s => (s.id === serviceId ? { ...s, is_active: nextActive } : s))
        );
      }
    } catch {}
  };

  const openQuoteDetails = async (quoteId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resp = await fetch(`/api/admin/quotes/${quoteId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const data = await resp.json();
      if (resp.ok) {
        setQuoteDetails({ quote: data.quote, items: data.items || [] });
        setDetailsOpen(true);
      }
    } catch {}
  };

  const approveQuote = async (quoteId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resp = await fetch(`/api/admin/quotes/${quoteId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      if (resp.ok) {
        // Refresh overview data quickly
        setQuotes(prev => {
          if (!prev) return prev;
          // Move quote from pending_admin_approval -> pending_client_approval
          const all = { ...prev } as any;
          const from = all['pending_admin_approval'] as any[];
          const idx = from?.findIndex((q: any) => q.id === quoteId) ?? -1;
          if (idx >= 0) {
            const [moved] = from.splice(idx, 1);
            moved.status = 'pending_client_approval';
            (all['pending_client_approval'] as any[]).unshift(moved);
          }
          return { ...all };
        });
        // If details modal is open for this quote, update it too
        setQuoteDetails(d =>
          d && d.quote?.id === quoteId
            ? { ...d, quote: { ...d.quote, status: 'pending_client_approval' } }
            : d
        );
      }
    } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
          }}
        >
          <Loading />
        </div>
      ) : (
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
          {/* Destaque: Orçamentos pendentes para aprovação (admin) */}
          {quotes?.pending_admin_approval && quotes.pending_admin_approval.length > 0 && (
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                marginBottom: 20,
                borderLeft: '4px solid #f59e0b',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.2rem', marginBottom: 12 }}>
                Orçamentos pendentes para aprovação ({quotes.pending_admin_approval.length})
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {quotes.pending_admin_approval.map((q: any) => (
                  <div
                    key={q.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                      gap: 8,
                      alignItems: 'center',
                      borderTop: '1px solid #eee',
                      paddingTop: 8,
                    }}
                  >
                    <div>
                      <strong>ID:</strong> {q.id}
                    </div>
                    <div>
                      <strong>Data:</strong>{' '}
                      {q.created_at ? new Date(q.created_at).toLocaleDateString('pt-BR') : '-'}
                    </div>
                    <div>
                      <strong>Valor:</strong>{' '}
                      {typeof q.total_value === 'number'
                        ? q.total_value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-'}
                    </div>
                    <div>
                      <strong>OS:</strong> {q.service_order_id || '-'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openQuoteDetails(q.id)}
                        style={{
                          background: '#072e4c',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        Detalhes
                      </button>
                      <button
                        onClick={() => approveQuote(q.id)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        Aprovar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <a href="/dashboard" style={{ color: '#072e4c', textDecoration: 'none' }}>
              &larr; Voltar
            </a>
          </div>
          {error ? (
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, color: '#b91c1c' }}>
              {error}
            </div>
          ) : partner ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#072e4c' }}>
                  {partner.company_name}
                </h1>
                <div style={{ marginTop: 8, color: '#555' }}>Parceiro ID: {partner.id}</div>
                <div style={{ marginTop: 4, color: partner.is_active ? '#16a34a' : '#9ca3af' }}>
                  {partner.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Serviços Cadastrados</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{partner.services_count}</div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Orçamentos Pendentes</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                    {partner.pending_budgets}
                  </div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Em Execução</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                    {partner.executing_budgets}
                  </div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Para Aprovação</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>
                    {partner.approval_budgets}
                  </div>
                </div>
              </div>

              {/* Orçamentos por status */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Orçamentos</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="Buscar por ID ou OS..."
                      value={quoteQuery}
                      onChange={e => setQuoteQuery(e.target.value)}
                      style={{ border: '1px solid #e3e3e3', borderRadius: 6, padding: '6px 10px' }}
                    />
                    <select
                      value={quoteStatus}
                      onChange={e => setQuoteStatus(e.target.value as any)}
                      style={{ border: '1px solid #e3e3e3', borderRadius: 6, padding: '6px 10px' }}
                    >
                      <option value="all">Todos</option>
                      <option value="pending_admin_approval">Aguardando Admin</option>
                      <option value="pending_client_approval">Aguardando Cliente</option>
                      <option value="approved">Aprovados</option>
                      <option value="rejected">Rejeitados</option>
                      <option value="executing">Em Execução</option>
                    </select>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Valor</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Data</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Ordem Serviço</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotes.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 12, color: '#666' }}>
                            Nenhum orçamento encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredQuotes.map(item => (
                          <tr key={item.id}>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{item.id}</td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              {item._group || item.status}
                            </td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              {typeof item.total_value === 'number'
                                ? item.total_value.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })
                                : '-'}
                            </td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString('pt-BR')
                                : '-'}
                            </td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              {item.service_order_id || '-'}
                            </td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              <button
                                onClick={() => openQuoteDetails(item.id)}
                                style={{
                                  background: '#072e4c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  marginRight: 8,
                                }}
                              >
                                Detalhes
                              </button>
                              {(item._group === 'pending_admin_approval' ||
                                item.status === 'pending_admin_approval') && (
                                <button
                                  onClick={() => approveQuote(item.id)}
                                  style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Aprovar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Serviços do parceiro */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Serviços do Parceiro</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="Buscar por nome do serviço..."
                      value={serviceQuery}
                      onChange={e => setServiceQuery(e.target.value)}
                      style={{ border: '1px solid #e3e3e3', borderRadius: 6, padding: '6px 10px' }}
                    />
                    <select
                      value={serviceStatus}
                      onChange={e => setServiceStatus(e.target.value as any)}
                      style={{ border: '1px solid #e3e3e3', borderRadius: 6, padding: '6px 10px' }}
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativos</option>
                      <option value="inactive">Inativos</option>
                    </select>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>Serviço</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Descrição</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Preço</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, color: '#666' }}>
                            Nenhum serviço encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredServices.map(s => (
                          <tr key={s.id}>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{s.name}</td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              {s.description || '-'}
                            </td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              {typeof s.price === 'number'
                                ? s.price.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })
                                : '-'}
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderTop: '1px solid #eee',
                                color: s.is_active ? '#16a34a' : '#9ca3af',
                              }}
                            >
                              {s.is_active ? 'Ativo' : 'Inativo'}
                            </td>
                            <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                              {s.is_active ? (
                                <button
                                  onClick={() => toggleService(s.id, false)}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reprovar
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleService(s.id, true)}
                                  style={{
                                    background: '#072e4c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Aprovar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      )}
      {/* Quote Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Detalhes do Orçamento"
      >
        {!quoteDetails ? (
          <div style={{ padding: 12 }}>Carregando...</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ color: '#374151' }}>
              <div>
                <strong>ID:</strong> {quoteDetails.quote.id}
              </div>
              <div>
                <strong>Status:</strong> {quoteDetails.quote.status}
              </div>
              <div>
                <strong>Valor Total:</strong>{' '}
                {typeof quoteDetails.quote.total_value === 'number'
                  ? quoteDetails.quote.total_value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : '-'}
              </div>
              <div>
                <strong>OS:</strong> {quoteDetails.quote.service_order_id || '-'}
              </div>
              <div>
                <strong>Data:</strong>{' '}
                {quoteDetails.quote.created_at
                  ? new Date(quoteDetails.quote.created_at).toLocaleDateString('pt-BR')
                  : '-'}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Descrição</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Qtd</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Valor Unitário</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteDetails.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 12, color: '#666' }}>
                        Nenhum item.
                      </td>
                    </tr>
                  ) : (
                    quoteDetails.items.map((it: any) => (
                      <tr key={it.id}>
                        <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                          {it.description || '-'}
                        </td>
                        <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                          {it.quantity ?? '-'}
                        </td>
                        <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                          {typeof it.unit_price === 'number'
                            ? it.unit_price.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })
                            : '-'}
                        </td>
                        <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                          {typeof it.total_price === 'number'
                            ? it.total_price.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {quoteDetails.quote.status === 'pending_admin_approval' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => approveQuote(quoteDetails.quote.id)}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Aprovar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
