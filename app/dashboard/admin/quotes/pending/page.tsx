'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { supabase } from '@/modules/common/services/supabaseClient';
import { formatCurrencyBR, formatDate, formatQuoteStatus } from '@/modules/common/utils/format';
import QuoteReviewModal from '@/modules/admin/components/QuoteReviewModal';

type PendingQuote = {
  id: string;
  created_at: string;
  status: string;
  total_value: number | null;
  partner_id: string | null;
  partner_name: string;
  service_order_id: string | null;
  vehicle_id: string | null;
  vehicle_plate: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
};

type QuoteItem = {
  id: string;
  service_id: string | null;
  description: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  created_at?: string;
};

export default function PendingQuotesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<PendingQuote[]>([]);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<{
    quote: any;
    items: QuoteItem[];
  } | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedQuoteForReview, setSelectedQuoteForReview] = useState<{
    quote: any;
    items: QuoteItem[];
  } | null>(null);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resp = await fetch('/api/admin/quotes/pending', {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Erro ao carregar orçamentos pendentes');
        setQuotes([]);
        return;
      }
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch {
      setError('Erro de rede ao carregar orçamentos pendentes');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleOpenDetails = useCallback(async (quoteId: string) => {
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
    } catch {
      // Silenciar
    }
  }, []);

  const handleOpenReview = useCallback(async (quoteId: string) => {
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
        setSelectedQuoteForReview({ quote: data.quote, items: data.items || [] });
        setReviewModalOpen(true);
      }
    } catch {
      // Silenciar
    }
  }, []);

  const handleReviewSubmit = useCallback(
    async (
      action: 'approve_full' | 'reject_full' | 'approve_partial',
      data: {
        rejectedItemIds?: string[];
        rejectionReason?: string;
      }
    ) => {
      if (!selectedQuoteForReview) return;
      const quoteId = selectedQuoteForReview.quote.id;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const payload = {
          action,
          rejectedItemIds: data.rejectedItemIds || [],
          rejectionReason: data.rejectionReason,
        };

        const resp = await fetch(`/api/admin/quotes/${quoteId}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          setReviewModalOpen(false);
          setSelectedQuoteForReview(null);
          await loadQuotes();
        }
      } catch {
        // Silenciar
      }
    },
    [selectedQuoteForReview, loadQuotes]
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: '#3498db',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Voltar
        </Link>

        <h1 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Orçamentos pendentes (Admin)</h1>

        {loading ? (
          <Loading />
        ) : error ? (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8 }}>
            {error}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontSize: 14, color: '#374151' }}>
                {quotes.length} orçamento(s) pendente(s)
              </div>
            </div>

            {quotes.length === 0 ? (
              <div style={{ padding: 16, color: '#6b7280' }}>
                Nenhum orçamento pendente encontrado.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        ID
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        Parceiro
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        Veículo
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          textAlign: 'right',
                          padding: 10,
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        Valor
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        Criado em
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map(q => (
                      <tr key={q.id}>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: '1px solid #f3f4f6',
                            fontFamily: 'ui-monospace, SFMono-Regular',
                          }}
                        >
                          {q.id.slice(0, 8)}...
                        </td>
                        <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                          {q.partner_name || '—'}
                        </td>
                        <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                          {q.vehicle_plate
                            ? `${q.vehicle_plate}${q.vehicle_brand && q.vehicle_model ? ` (${q.vehicle_brand} ${q.vehicle_model})` : ''}`
                            : '—'}
                        </td>
                        <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                          {formatQuoteStatus(q.status)}
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: '1px solid #f3f4f6',
                            textAlign: 'right',
                          }}
                        >
                          {formatCurrencyBR(q.total_value)}
                        </td>
                        <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                          {formatDate(q.created_at)}
                        </td>
                        <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleOpenDetails(q.id)}
                              style={{
                                padding: '6px 10px',
                                background: '#e5e7eb',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                              }}
                            >
                              Detalhes
                            </button>
                            <button
                              onClick={() => handleOpenReview(q.id)}
                              style={{
                                padding: '6px 10px',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                              }}
                            >
                              Revisar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quote Details Modal */}
        {detailsOpen && quoteDetails && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 50,
            }}
            onClick={() => setDetailsOpen(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                width: '100%',
                maxWidth: 720,
                padding: 16,
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>Detalhes do Orçamento</h2>
              <div style={{ marginBottom: 16 }}>
                <strong>ID:</strong> {quoteDetails.quote.id}
                <br />
                <strong>Status:</strong> {formatQuoteStatus(quoteDetails.quote.status)}
                <br />
                <strong>Valor Total:</strong> {formatCurrencyBR(quoteDetails.quote.total_value)}
                <br />
                <strong>Criado em:</strong> {formatDate(quoteDetails.quote.created_at)}
              </div>

              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Itens do Orçamento</h3>
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Descrição</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Qtd</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Preço Unit.</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteDetails.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>{item.description}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {formatCurrencyBR(item.unit_price)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {formatCurrencyBR(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDetailsOpen(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quote Review Modal */}
        {reviewModalOpen && selectedQuoteForReview && (
          <QuoteReviewModal
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setSelectedQuoteForReview(null);
            }}
            quote={selectedQuoteForReview.quote}
            items={selectedQuoteForReview.items}
            onReview={handleReviewSubmit}
          />
        )}
      </main>
    </div>
  );
}
