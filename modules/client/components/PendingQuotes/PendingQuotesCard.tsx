import React, { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import './PendingQuotesCard.css';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Quote {
  id: string;
  status: string;
  total_value: number;
  service_order_id?: string;
  created_at: string;
  is_partial_approval: boolean;
  rejected_items: string[];
  rejection_reason?: string;
  admin_reviewed_at?: string;
}

interface PendingQuotesCardProps {
  onLoadingChange?: (loading: boolean) => void;
}

export default function PendingQuotesCard({ onLoadingChange }: PendingQuotesCardProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchPendingQuotes();
  }, []);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const fetchPendingQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Sessão não encontrada');
        return;
      }

      const response = await fetch('/api/client/quotes/pending', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar orçamentos');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch {
      setError('Erro ao carregar orçamentos pendentes');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteDetails = async (quoteId: string) => {
    try {
      setLoadingItems(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/client/quotes/${quoteId}/details`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar detalhes');

      const data = await response.json();
      setQuoteItems(data.items || []);
    } catch {
      // Error handled silently
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewDetails = async (quote: Quote) => {
    setSelectedQuote(quote);
    await fetchQuoteDetails(quote.id);
  };

  const handleApprove = async (quoteId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/client/quotes/${quoteId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setSelectedQuote(null);
        await fetchPendingQuotes();
      }
    } catch {
      // Error handled silently
    }
  };

  const handleReject = async (quoteId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/client/quotes/${quoteId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setSelectedQuote(null);
        await fetchPendingQuotes();
      }
    } catch {
      // Error handled silently
    }
  };

  if (loading) {
    return (
      <div className="pending-quotes-card">
        <h2 className="pending-quotes-title">Orçamentos Pendentes</h2>
        <div className="pending-quotes-loading">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-quotes-card">
        <h2 className="pending-quotes-title">Orçamentos Pendentes</h2>
        <div className="pending-quotes-error">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="pending-quotes-card">
        <div className="pending-quotes-header">
          <h2 className="pending-quotes-title">Orçamentos Pendentes para Aprovação</h2>
          <span className="pending-quotes-count">{quotes.length}</span>
        </div>

        {quotes.length === 0 ? (
          <p className="pending-quotes-empty">Nenhum orçamento aguardando sua aprovação</p>
        ) : (
          <div className="pending-quotes-list">
            {quotes.map(quote => (
              <div key={quote.id} className="pending-quote-item">
                <div className="pending-quote-info">
                  <div className="pending-quote-header">
                    <span className="pending-quote-os">OS: {quote.service_order_id || '-'}</span>
                    {quote.is_partial_approval && (
                      <span className="pending-quote-badge">Aprovação Parcial</span>
                    )}
                  </div>
                  <div className="pending-quote-value">
                    {quote.total_value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                  <div className="pending-quote-date">
                    Enviado em: {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  {quote.is_partial_approval && quote.rejection_reason && (
                    <div className="pending-quote-rejection">
                      <strong>Observação do Admin:</strong> {quote.rejection_reason}
                    </div>
                  )}
                </div>
                <button onClick={() => handleViewDetails(quote)} className="pending-quote-view-btn">
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedQuote && (
        <div className="quote-details-modal-overlay" onClick={() => setSelectedQuote(null)}>
          <div className="quote-details-modal" onClick={e => e.stopPropagation()}>
            <div className="quote-details-header">
              <h3>Detalhes do Orçamento</h3>
              <button onClick={() => setSelectedQuote(null)} className="quote-details-close">
                ×
              </button>
            </div>

            <div className="quote-details-body">
              <div className="quote-details-info">
                <div className="quote-detail-row">
                  <strong>OS:</strong> {selectedQuote.service_order_id || '-'}
                </div>
                <div className="quote-detail-row">
                  <strong>Valor Total:</strong>{' '}
                  {selectedQuote.total_value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                {selectedQuote.is_partial_approval && (
                  <div className="quote-detail-row quote-partial-info">
                    ⚠️ Este orçamento foi parcialmente aprovado pelo administrador. Alguns itens
                    foram rejeitados.
                  </div>
                )}
                {selectedQuote.rejection_reason && (
                  <div className="quote-detail-row quote-rejection-reason">
                    <strong>Observação do Administrador:</strong>
                    <p>{selectedQuote.rejection_reason}</p>
                  </div>
                )}
              </div>

              {loadingItems ? (
                <div className="quote-items-loading">Carregando itens...</div>
              ) : (
                <div className="quote-items">
                  <h4>Itens do Orçamento</h4>
                  <table className="quote-items-table">
                    <thead>
                      <tr>
                        <th>Descrição</th>
                        <th>Qtd</th>
                        <th>Valor Unit.</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteItems.map(item => {
                        const isRejected = selectedQuote.rejected_items.includes(item.id);
                        return (
                          <tr key={item.id} className={isRejected ? 'quote-item-rejected' : ''}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>
                              {item.unit_price.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>
                            <td>
                              {item.total_price.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>
                            <td>
                              {isRejected ? (
                                <span className="item-status-rejected">Rejeitado</span>
                              ) : (
                                <span className="item-status-approved">Aprovado</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="quote-details-actions">
              <button
                onClick={() => handleReject(selectedQuote.id)}
                className="quote-action-btn quote-reject-btn"
              >
                Rejeitar Orçamento
              </button>
              <button
                onClick={() => handleApprove(selectedQuote.id)}
                className="quote-action-btn quote-approve-btn"
              >
                Aprovar Orçamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
