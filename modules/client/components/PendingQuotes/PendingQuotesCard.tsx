import React, { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import ClientQuoteReviewModal from './ClientQuoteReviewModal';
import './PendingQuotesCard.css';

interface Quote {
  id: string;
  status: string;
  total_value: number;
  service_order_id?: string;
  created_at: string;
}

interface PendingQuotesCardProps {
  onLoadingChange?: (loading: boolean) => void;
}

export default function PendingQuotesCard({ onLoadingChange }: PendingQuotesCardProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

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

  const handleSuccess = () => {
    fetchPendingQuotes();
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
                </div>
                <button onClick={() => setSelectedQuote(quote)} className="pending-quote-view-btn">
                  Revisar Orçamento
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientQuoteReviewModal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        quote={selectedQuote}
        onSuccess={handleSuccess}
      />
    </>
  );
}
