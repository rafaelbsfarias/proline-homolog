import React, { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import './ApprovedQuoteDetailsModal.css';

interface QuoteItem {
  id: string;
  description: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface ApprovedQuote {
  id: string;
  status: string;
  total_value: number;
  service_order_id?: string;
  created_at: string;
  approved_at?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
}

interface ApprovedQuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: ApprovedQuote | null;
}

export default function ApprovedQuoteDetailsModal({
  isOpen,
  onClose,
  quote,
}: ApprovedQuoteDetailsModalProps) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && quote) {
      fetchQuoteDetails();
    }
  }, [isOpen, quote]);

  const fetchQuoteDetails = async () => {
    if (!quote) return;

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

      const response = await fetch(`/api/client/quotes/${quote.id}/details`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do orçamento');
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch {
      setError('Erro ao carregar detalhes do orçamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="approved-quote-modal" onClick={e => e.stopPropagation()}>
        <div className="approved-quote-modal-header">
          <div>
            <h2 className="approved-quote-modal-title">Detalhes do Orçamento Em Execução</h2>
            <p className="approved-quote-modal-os">OS: {quote.service_order_id || '-'}</p>
            {quote.vehicle_plate && (
              <p className="approved-quote-modal-vehicle">
                {quote.vehicle_plate} - {quote.vehicle_model || 'Veículo'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="approved-quote-modal-close">
            ✕
          </button>
        </div>

        <div className="approved-quote-modal-content">
          {loading ? (
            <div className="approved-quote-modal-loading">Carregando detalhes...</div>
          ) : error ? (
            <div className="approved-quote-modal-error">{error}</div>
          ) : (
            <>
              <div className="approved-quote-items-section">
                <h3 className="approved-quote-section-title">Serviços Aprovados</h3>
                <div className="approved-quote-items-list">
                  {items.map(item => (
                    <div key={item.id} className="approved-quote-item-row">
                      <div className="approved-quote-item-description">{item.description}</div>
                      <div className="approved-quote-item-details">
                        <span className="approved-quote-item-quantity">
                          {item.quantity}x R${' '}
                          {item.unit_price.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="approved-quote-item-total">
                          {item.total_price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="approved-quote-total-section">
                <div className="approved-quote-total-row">
                  <span className="approved-quote-total-label">Valor Total</span>
                  <span className="approved-quote-total-value">
                    {quote.total_value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </div>

              <div className="approved-quote-info-section">
                <div className="approved-quote-info-item">
                  <span className="approved-quote-info-label">Status:</span>
                  <span className="approved-quote-info-value-success">Em Execução</span>
                </div>
                <div className="approved-quote-info-item">
                  <span className="approved-quote-info-label">Data de Aprovação:</span>
                  <span className="approved-quote-info-value">
                    {new Date(quote.approved_at || quote.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="approved-quote-modal-footer">
          <button onClick={onClose} className="approved-quote-modal-close-btn">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
