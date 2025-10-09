import React, { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import ApprovedQuoteDetailsModal from './ApprovedQuoteDetailsModal';
import './ApprovedQuotesCard.css';

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

interface ApprovedQuotesCardProps {
  onLoadingChange?: (loading: boolean) => void;
}

export default function ApprovedQuotesCard({ onLoadingChange }: ApprovedQuotesCardProps) {
  const [quotes, setQuotes] = useState<ApprovedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<ApprovedQuote | null>(null);

  useEffect(() => {
    fetchApprovedQuotes();
  }, []);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const fetchApprovedQuotes = async () => {
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

      const response = await fetch('/api/client/quotes/approved', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar orçamentos aprovados');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch {
      setError('Erro ao carregar orçamentos em execução');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="approved-quotes-card">
        <h2 className="approved-quotes-title">Orçamentos Em Execução</h2>
        <div className="approved-quotes-loading">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="approved-quotes-card">
        <h2 className="approved-quotes-title">Orçamentos Em Execução</h2>
        <div className="approved-quotes-error">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="approved-quotes-card">
        <div className="approved-quotes-header">
          <h2 className="approved-quotes-title">Orçamentos Em Execução</h2>
          <span className="approved-quotes-count">{quotes.length}</span>
        </div>

        {quotes.length === 0 ? (
          <p className="approved-quotes-empty">Nenhum orçamento em execução no momento</p>
        ) : (
          <div className="approved-quotes-list">
            {quotes.map(quote => (
              <div key={quote.id} className="approved-quote-item">
                <div className="approved-quote-info">
                  <div className="approved-quote-header">
                    <span className="approved-quote-os">OS: {quote.service_order_id || '-'}</span>
                    <span className="approved-quote-status-badge">Em Execução</span>
                  </div>
                  {quote.vehicle_plate && (
                    <div className="approved-quote-vehicle">
                      {quote.vehicle_plate} - {quote.vehicle_model || 'Veículo'}
                    </div>
                  )}
                  <div className="approved-quote-value">
                    {quote.total_value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                  <div className="approved-quote-date">
                    Aprovado em:{' '}
                    {new Date(quote.approved_at || quote.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <button onClick={() => setSelectedQuote(quote)} className="approved-quote-view-btn">
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ApprovedQuoteDetailsModal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        quote={selectedQuote}
      />
    </>
  );
}
