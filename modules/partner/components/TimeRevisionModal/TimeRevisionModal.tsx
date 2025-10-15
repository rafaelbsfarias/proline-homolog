'use client';

import React, { useEffect, useState } from 'react';
import styles from './TimeRevisionModal.module.css';
import type { RevisionDetails } from '../../hooks/usePartnerTimeRevisions';

interface TimeRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string | null;
  onSuccess: () => void;
  fetchRevisionDetails: (quoteId: string) => Promise<RevisionDetails | null>;
  updateTimes: (
    quoteId: string,
    request: {
      items: Array<{ item_id: string; estimated_days: number }>;
      comments?: string;
    }
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
}

interface ItemUpdate {
  item_id: string;
  estimated_days: number;
}

export default function TimeRevisionModal(props: TimeRevisionModalProps) {
  const { isOpen, onClose, quoteId, onSuccess, fetchRevisionDetails, updateTimes } = props;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<RevisionDetails | null>(null);
  const [itemUpdates, setItemUpdates] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen && quoteId) {
      loadDetails();
    } else {
      setDetails(null);
      setItemUpdates({});
      setComments('');
      setError(null);
      setLoading(true);
    }
  }, [isOpen, quoteId, fetchRevisionDetails]);

  const loadDetails = async () => {
    if (!quoteId) return;
    setLoading(true);
    setError(null);
    const data = await fetchRevisionDetails(quoteId);
    if (data) {
      setDetails(data);
      const initial: Record<string, number> = {};
      data.items.forEach(i => (initial[i.id] = i.estimated_days));
      setItemUpdates(initial);
    } else {
      setError('Erro ao carregar detalhes da revisão');
    }
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  };

  const handleInputChange = (itemId: string, value: string) => {
    const days = parseInt(value, 10);
    if (!Number.isNaN(days) && days > 0) {
      setItemUpdates(prev => ({ ...prev, [itemId]: days }));
    }
  };

  const handleApplySuggestion = (itemId: string, suggestedDays?: number) => {
    if (typeof suggestedDays === 'number' && suggestedDays > 0) {
      setItemUpdates(prev => ({ ...prev, [itemId]: suggestedDays }));
    }
  };

  const hasChanges = () => {
    if (!details) return false;
    return details.items.some(it => itemUpdates[it.id] !== it.estimated_days);
  };

  const handleSave = async () => {
    if (!details || !quoteId) return;
    if (!hasChanges()) {
      setError('Nenhuma alteração foi feita nos prazos.');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!details || !quoteId) return;

    setShowConfirmation(false);
    setSaving(true);
    setError(null);

    const items: ItemUpdate[] = details.items.map(it => ({
      item_id: it.id,
      estimated_days: itemUpdates[it.id],
    }));

    const res = await updateTimes(quoteId, { items, comments: comments.trim() || undefined });

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Erro ao salvar alterações');
    }

    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Revisar Prazos - Orçamento #{details?.quote.quote_number || '...'}
          </h2>
          <button className={styles.closeButton} onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Carregando detalhes...</p>
            </div>
          )}

          {error && !loading && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {!loading && details && (
            <>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>ℹ️ Informações do Orçamento</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Cliente:</span>
                    <span className={styles.infoValue}>{details.quote.client_name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Veículo:</span>
                    <span className={styles.infoValue}>
                      {details.quote.vehicle_model} - {details.quote.vehicle_plate}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Data de Envio Original:</span>
                    <span className={styles.infoValue}>{formatDate(details.quote.created_at)}</span>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>📝 Solicitação do Especialista</h3>
                <div className={styles.revisionInfo}>
                  <div className={styles.revisionHeader}>
                    <div className={styles.revisionDetail}>
                      <span className={styles.icon}>👤</span>
                      <span>{details.revision.specialist_name}</span>
                    </div>
                    <div className={styles.revisionDetail}>
                      <span className={styles.icon}>📅</span>
                      <span>{formatDate(details.revision.requested_at)}</span>
                    </div>
                  </div>
                  {details.revision.comments && (
                    <div className={styles.specialistComments}>
                      <span className={styles.commentIcon}>💬</span>
                      <div className={styles.commentText}>{details.revision.comments}</div>
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>✏️ Editar Prazos dos Itens</h3>
                <div className={styles.itemsList}>
                  {details.items.map((item, index) => (
                    <div key={item.id} className={styles.itemCard}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemNumber}>{index + 1}.</span>
                        <span className={styles.itemDescription}>{item.description}</span>
                      </div>
                      <div className={styles.itemContent}>
                        <div className={styles.currentTime}>
                          <span className={styles.timeLabel}>Prazo Atual:</span>
                          <span className={styles.timeValue}>{item.estimated_days} dias</span>
                        </div>
                        {item.has_suggestion && (
                          <div className={styles.suggestion}>
                            <div className={styles.suggestionHeader}>
                              <span className={styles.bulbIcon}>💡</span>
                              <span className={styles.suggestionLabel}>
                                Sugestão: {item.suggested_days} dias
                              </span>
                            </div>
                            {item.suggestion_reason && (
                              <div className={styles.suggestionReason}>
                                📝 {item.suggestion_reason}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={styles.inputRow}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Novo Prazo:</label>
                            <input
                              type="number"
                              min={1}
                              className={styles.input}
                              value={itemUpdates[item.id] ?? item.estimated_days}
                              onChange={e => handleInputChange(item.id, e.target.value)}
                              disabled={saving}
                            />
                            <span className={styles.inputUnit}>dias</span>
                          </div>
                          {item.has_suggestion && (
                            <button
                              className={styles.applySuggestionButton}
                              onClick={() => handleApplySuggestion(item.id, item.suggested_days)}
                              disabled={saving || itemUpdates[item.id] === item.suggested_days}
                            >
                              Aplicar Sugestão
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>💬 Comentário da Revisão (opcional)</h3>
                <textarea
                  className={styles.textarea}
                  placeholder="Explique as alterações feitas nos prazos..."
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  disabled={saving}
                  rows={3}
                />
              </section>
            </>
          )}
        </div>

        {!loading && details && (
          <div className={styles.footer}>
            <button className={styles.cancelButton} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving || !hasChanges()}
            >
              {saving ? 'Salvando...' : 'Salvar e Reenviar'}
            </button>
          </div>
        )}

        {/* Modal de Confirmação */}
        {showConfirmation && (
          <div className={styles.confirmationOverlay} onClick={() => setShowConfirmation(false)}>
            <div className={styles.confirmationModal} onClick={e => e.stopPropagation()}>
              <h3 className={styles.confirmationTitle}>Confirmar Alterações</h3>
              <p className={styles.confirmationText}>
                Tem certeza que deseja salvar as alterações? O orçamento será reenviado para revisão
                do admin.
              </p>
              <div className={styles.confirmationButtons}>
                <button
                  className={styles.confirmationCancel}
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancelar
                </button>
                <button className={styles.confirmationConfirm} onClick={handleConfirmSave}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
