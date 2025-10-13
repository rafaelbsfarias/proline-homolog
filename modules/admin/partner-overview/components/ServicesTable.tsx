/**
 * Services Table Component
 *
 * Displays services in a table format with:
 * - Search filter (by name)
 * - Status filter (active/inactive/all)
 * - Request review button with feedback modal
 * - Review status badges
 */

import React, { useState } from 'react';
import type { Service, ServiceFilterStatus } from '../types';
import styles from './ServicesTable.module.css';
import Modal from '@/modules/common/components/Modal/Modal';

interface ServicesTableProps {
  services: Service[];
  query: string;
  status: ServiceFilterStatus;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ServiceFilterStatus) => void;
  onRequestReview: (serviceId: string, feedback: string) => Promise<void>;
}

const STATUS_LABELS: Record<ServiceFilterStatus, string> = {
  all: 'Todos',
  active: 'Ativos',
  inactive: 'Inativos',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  pending_review: 'Aguardando Revisão',
  in_revision: 'Em Revisão',
};

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onRequestReview,
}) => {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenReviewModal = (service: Service) => {
    setSelectedService(service);
    setReviewFeedback('');
    setError(null);
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedService(null);
    setReviewFeedback('');
    setError(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedService || !reviewFeedback.trim()) {
      setError('Por favor, informe o que deve ser revisado.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onRequestReview(selectedService.id, reviewFeedback);
      handleCloseReviewModal();
    } catch {
      setError('Erro ao solicitar revisão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Serviços</h2>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={status}
          onChange={e => onStatusChange(e.target.value as ServiceFilterStatus)}
          className={styles.statusSelect}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {services.length === 0 ? (
        <div className={styles.emptyState}>Nenhum serviço encontrado.</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Status</th>
                <th>Revisão</th>
                <th>Cadastrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td className={styles.cellName}>{service.name}</td>
                  <td className={styles.cellDescription}>
                    {service.description || <span className={styles.textMuted}>Sem descrição</span>}
                  </td>
                  <td>
                    {service.price != null
                      ? `R$ ${Number(service.price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}`
                      : '—'}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        service.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {service.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.reviewBadge} ${
                        service.review_status === 'approved'
                          ? styles.reviewApproved
                          : service.review_status === 'pending_review'
                            ? styles.reviewPending
                            : styles.reviewInRevision
                      }`}
                      title={service.review_feedback || undefined}
                    >
                      {REVIEW_STATUS_LABELS[service.review_status]}
                    </span>
                  </td>
                  <td>{new Date(service.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleOpenReviewModal(service)}
                        className={`${styles.btn} ${styles.btnWarning}`}
                        title="Solicitar revisão do serviço"
                      >
                        Revisão
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={handleCloseReviewModal}
        title="Solicitar Revisão de Serviço"
      >
        {selectedService && (
          <div className={styles.reviewModal}>
            <div className={styles.serviceInfo}>
              <h3>{selectedService.name}</h3>
              <p className={styles.serviceDescription}>
                {selectedService.description || 'Sem descrição'}
              </p>
              <p className={styles.servicePrice}>
                Preço atual:{' '}
                {selectedService.price != null
                  ? `R$ ${Number(selectedService.price).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`
                  : 'Não informado'}
              </p>
            </div>

            <div className={styles.feedbackSection}>
              <label htmlFor="reviewFeedback" className={styles.label}>
                <strong>O que deve ser revisado?</strong>
                <span className={styles.helperText}>
                  Informe o que o parceiro deve ajustar (Nome, Descrição, Preço, etc.)
                </span>
              </label>
              <textarea
                id="reviewFeedback"
                value={reviewFeedback}
                onChange={e => setReviewFeedback(e.target.value)}
                placeholder="Ex: O preço está acima do mercado. Revisar para aproximadamente R$ 200,00"
                className={styles.textarea}
                rows={4}
                disabled={submitting}
              />
              {error && <div className={styles.errorMessage}>{error}</div>}
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={handleCloseReviewModal}
                className={`${styles.btn} ${styles.btnSecondary}`}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReview}
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={submitting || !reviewFeedback.trim()}
              >
                {submitting ? 'Enviando...' : 'Solicitar Revisão'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
