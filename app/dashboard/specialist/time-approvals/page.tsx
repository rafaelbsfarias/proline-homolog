'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './TimeApprovalsPage.module.css';

interface QuoteItem {
  id: string;
  description: string;
  estimated_days: number;
}

interface PendingQuote {
  id: string;
  created_at: string;
  status: string;
  partners: {
    company_name: string;
  };
  vehicles: {
    plate: string;
    model: string;
    brand: string;
  };
  clients: {
    full_name: string;
  };
  items: QuoteItem[];
}

interface ReviewData {
  action: 'approved' | 'revision_requested';
  comments?: string;
  revision_requests?: Record<string, { suggested_days: number; reason: string }>;
}

interface TimeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: PendingQuote | null;
  onReview: (action: 'approved' | 'revision_requested', data: ReviewData) => Promise<void>;
}

function TimeReviewModal({ isOpen, onClose, quote, onReview }: TimeReviewModalProps) {
  const [action, setAction] = useState<'approved' | 'revision_requested'>('approved');
  const [comments, setComments] = useState('');
  const [revisionRequests, setRevisionRequests] = useState<
    Record<string, { suggested_days: number; reason: string }>
  >({});
  const [loading, setLoading] = useState(false);

  if (!isOpen || !quote) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data: ReviewData = {
        action,
        comments: comments.trim() || undefined,
        revision_requests: action === 'revision_requested' ? revisionRequests : undefined,
      };
      await onReview(action, data);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionChange = (
    itemId: string,
    field: 'suggested_days' | 'reason',
    value: string | number
  ) => {
    setRevisionRequests(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Avaliar Prazos do Orçamento</h2>

        <div className={styles.quoteInfo}>
          <p>
            <strong>Cliente:</strong> {quote.clients.full_name}
          </p>
          <p>
            <strong>Veículo:</strong> {quote.vehicles.brand} {quote.vehicles.model} -{' '}
            {quote.vehicles.plate}
          </p>
          <p>
            <strong>Parceiro:</strong> {quote.partners.company_name}
          </p>
        </div>

        <div className={styles.actionSelector}>
          <label>
            <input
              type="radio"
              value="approved"
              checked={action === 'approved'}
              onChange={e => setAction(e.target.value as 'approved')}
            />
            Aprovar todos os prazos
          </label>
          <label>
            <input
              type="radio"
              value="revision_requested"
              checked={action === 'revision_requested'}
              onChange={e => setAction(e.target.value as 'revision_requested')}
            />
            Solicitar revisão
          </label>
        </div>

        {action === 'revision_requested' && (
          <div className={styles.revisionSection}>
            <h3>Solicitar Revisões Específicas</h3>
            {quote.items.map(item => (
              <div key={item.id} className={styles.itemRevision}>
                <h4>{item.description}</h4>
                <p>Prazo atual: {item.estimated_days} dias</p>
                <div className={styles.revisionInputs}>
                  <label>
                    Prazo sugerido:
                    <input
                      type="number"
                      min="1"
                      value={revisionRequests[item.id]?.suggested_days || ''}
                      onChange={e =>
                        handleRevisionChange(item.id, 'suggested_days', parseInt(e.target.value))
                      }
                      placeholder="dias"
                    />
                  </label>
                  <label>
                    Motivo:
                    <textarea
                      value={revisionRequests[item.id]?.reason || ''}
                      onChange={e => handleRevisionChange(item.id, 'reason', e.target.value)}
                      placeholder="Explique por que o prazo precisa ser ajustado"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.commentsSection}>
          <label>
            Observações gerais:
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Comentários adicionais sobre a avaliação dos prazos"
            />
          </label>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PendingReview {
  quote_id: string;
  quote_number: string;
  client_name: string;
  partner_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  updated_at: string;
  partner_comments: string | null;
  items_count: number;
  waiting_days: number;
  revision_count: number;
}

export default function TimeApprovalsPage() {
  const router = useRouter();
  const { get, authenticatedFetch } = useAuthenticatedFetch();
  const [quotes, setQuotes] = useState<PendingQuote[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<PendingQuote | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'reviews'>('new');

  useEffect(() => {
    fetchPendingQuotes();
    fetchPendingReviews();
  }, []);

  const fetchPendingQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ data: PendingQuote[]; error?: string }>(
        '/api/specialist/quotes/pending-time-approval'
      );
      if (response.ok && response.data?.data) {
        setQuotes(response.data.data);
      } else {
        setError(response.data?.error || 'Erro ao buscar orçamentos pendentes');
      }
    } catch {
      setError('Erro ao buscar orçamentos pendentes');
    }
    setLoading(false);
  };

  const fetchPendingReviews = async () => {
    try {
      const response = await get<{ data: PendingReview[]; error?: string }>(
        '/api/specialist/quotes/pending-review'
      );
      if (response.ok && response.data?.data) {
        setPendingReviews(response.data.data);
      }
    } catch {
      // Silently fail - não queremos interromper o fluxo principal
    }
  };

  const handleReview = async (action: 'approved' | 'revision_requested', data: ReviewData) => {
    if (!selectedQuote) return;

    try {
      const response = await authenticatedFetch(
        `/api/specialist/quotes/${selectedQuote.id}/review-times`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        // Atualizar a lista removendo o orçamento revisado
        setQuotes(prev => prev.filter(q => q.id !== selectedQuote.id));
        setReviewModalOpen(false);
        setSelectedQuote(null);
      } else {
        setError('Erro ao enviar avaliação');
      }
    } catch {
      setError('Erro ao enviar avaliação');
    }
  };

  const openReviewModal = (quote: PendingQuote) => {
    setSelectedQuote(quote);
    setReviewModalOpen(true);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Erro</h1>
          <p>{error}</p>
          <button onClick={() => router.back()} className={styles.errorButton}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Voltar
          </button>
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Aprovação de Prazos</h1>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'new' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('new')}
            >
              Novas Aprovações ({quotes.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Revisões Pendentes ({pendingReviews.length})
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'new' ? (
          <>
            {quotes.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>Nenhum orçamento pendente</h2>
                <p>Não há orçamentos aguardando avaliação inicial de prazos no momento.</p>
              </div>
            ) : (
              <div className={styles.quotesList}>
                {quotes.map(quote => (
                  <div key={quote.id} className={styles.quoteCard}>
                    <div className={styles.quoteHeader}>
                      <div className={styles.quoteInfo}>
                        <h3>Orçamento #{quote.id.slice(0, 8)}</h3>
                        <p className={styles.clientInfo}>Cliente: {quote.clients.full_name}</p>
                        <p className={styles.vehicleInfo}>
                          Veículo: {quote.vehicles.brand} {quote.vehicles.model} -{' '}
                          {quote.vehicles.plate}
                        </p>
                        <p className={styles.partnerInfo}>
                          Parceiro: {quote.partners.company_name}
                        </p>
                      </div>
                      <div className={styles.quoteValue}>
                        <span className={styles.date}>
                          {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className={styles.itemsSummary}>
                      <h4>Itens ({quote.items.length})</h4>
                      <div className={styles.itemsList}>
                        {quote.items.map(item => (
                          <div key={item.id} className={styles.item}>
                            <span className={styles.itemDescription}>{item.description}</span>
                            <span className={styles.itemDays}>{item.estimated_days} dias</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button
                        onClick={() => openReviewModal(quote)}
                        className={styles.reviewButton}
                      >
                        Avaliar Prazos
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {pendingReviews.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>Nenhuma revisão pendente</h2>
                <p>Não há orçamentos aguardando sua re-análise após atualização do parceiro.</p>
              </div>
            ) : (
              <div className={styles.quotesList}>
                {pendingReviews.map(review => (
                  <div key={review.quote_id} className={styles.quoteCard}>
                    <div className={styles.quoteHeader}>
                      <div className={styles.quoteInfo}>
                        <h3>Orçamento #{review.quote_number}</h3>
                        <p className={styles.clientInfo}>Cliente: {review.client_name}</p>
                        <p className={styles.vehicleInfo}>
                          Veículo: {review.vehicle_model} - {review.vehicle_plate}
                        </p>
                        <p className={styles.partnerInfo}>Parceiro: {review.partner_name}</p>
                        <p className={styles.revisionInfo}>
                          🔄 Revisão #{review.revision_count} • Atualizado há {review.waiting_days}{' '}
                          {review.waiting_days === 1 ? 'dia' : 'dias'}
                        </p>
                        {review.partner_comments && (
                          <p className={styles.comments}>
                            💬 Parceiro: &quot;{review.partner_comments}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.itemsSummary}>
                      <h4>Itens atualizados: {review.items_count}</h4>
                    </div>

                    <div className={styles.actions}>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/specialist/time-approvals/${review.quote_id}`)
                        }
                        className={styles.reviewButton}
                      >
                        Revisar Prazos Atualizados
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <TimeReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        quote={selectedQuote}
        onReview={handleReview}
      />
    </div>
  );
}
