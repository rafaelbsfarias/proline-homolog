'use client';

import React, { useState } from 'react';
import DataTable from '@/modules/common/components/shared/DataTable';
import Modal from '@/modules/common/components/Modal/Modal';
import { formatCurrency } from '@/modules/common/utils/format';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import styles from './ServicesContent.module.css';

interface ServicesContentProps {
  services: PartnerService[];
  loading: boolean;
  error: string | null;
  onEdit: (service: PartnerService) => void;
  onDelete: (service: PartnerService) => Promise<void>;
}

const ServicesContent: React.FC<ServicesContentProps> = ({
  services,
  loading,
  error,
  onEdit,
  onDelete,
}) => {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PartnerService | null>(null);

  // Separar serviços pendentes de revisão
  const pendingReviewServices = services.filter(s => s.reviewStatus === 'pending_review');

  const handleViewReview = (service: PartnerService) => {
    setSelectedService(service);
    setReviewModalOpen(true);
  };

  const handleResolveReview = () => {
    if (selectedService) {
      onEdit(selectedService);
      setReviewModalOpen(false);
    }
  };

  const columns: { key: keyof PartnerService | 'formatted_price' | 'actions'; header: string }[] = [
    { key: 'name', header: 'Nome' },
    { key: 'description', header: 'Descrição' },
    { key: 'formatted_price', header: 'Preço (R$)' },
    { key: 'category', header: 'Categoria' },
  ];

  // Formata os dados antes de passá-los para a tabela
  const formattedServices = services.map(service => ({
    ...service,
    formatted_price: formatCurrency(service.price),
  }));

  return (
    <>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 24, color: '#333' }}>
        Meus Serviços Cadastrados
      </h1>

      {loading && <p>Carregando serviços...</p>}
      {error && <p style={{ color: 'red' }}>Erro ao carregar serviços: {error}</p>}

      {/* Seção de Serviços Pendentes de Revisão */}
      {!loading && !error && pendingReviewServices.length > 0 && (
        <div className={styles.reviewSection}>
          <div className={styles.reviewHeader}>
            <h2 className={styles.reviewTitle}>
              ⚠️ Serviços Pendentes de Revisão ({pendingReviewServices.length})
            </h2>
            <p className={styles.reviewSubtitle}>
              O administrador solicitou ajustes nos seguintes serviços
            </p>
          </div>

          <div className={styles.reviewList}>
            {pendingReviewServices.map(service => (
              <div key={service.id} className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <h3 className={styles.serviceName}>{service.name}</h3>
                  <span className={styles.reviewBadge}>Precisa Revisão</span>
                </div>

                <div className={styles.reviewCardBody}>
                  <div className={styles.serviceInfo}>
                    <p>
                      <strong>Descrição:</strong> {service.description || 'Sem descrição'}
                    </p>
                    <p>
                      <strong>Preço:</strong> {formatCurrency(service.price)}
                    </p>
                    <p>
                      <strong>Categoria:</strong> {service.category || 'Sem categoria'}
                    </p>
                  </div>

                  <div className={styles.feedbackSection}>
                    <strong className={styles.feedbackLabel}>📝 Feedback do Administrador:</strong>
                    <p className={styles.feedbackText}>{service.reviewFeedback}</p>
                    {service.reviewRequestedAt && (
                      <p className={styles.feedbackDate}>
                        Solicitado em: {new Date(service.reviewRequestedAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.reviewCardActions}>
                  <button onClick={() => handleViewReview(service)} className={styles.btnView}>
                    Ver Detalhes
                  </button>
                  <button onClick={() => onEdit(service)} className={styles.btnEdit}>
                    Ajustar Serviço
                  </button>
                  <button onClick={() => onDelete(service)} className={styles.btnDelete}>
                    Remover do Portfólio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Outros Serviços */}
      {!loading && !error && (
        <>
          {pendingReviewServices.length > 0 && (
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginTop: 40,
                marginBottom: 16,
                color: '#333',
              }}
            >
              Outros Serviços
            </h2>
          )}
          <DataTable
            title={pendingReviewServices.length > 0 ? '' : 'Serviços'}
            data={formattedServices as PartnerService[]}
            columns={columns}
            emptyMessage="Nenhum serviço cadastrado."
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={true}
            useConfirmDialog={false}
          />
        </>
      )}

      {/* Modal de Detalhes da Revisão */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Detalhes da Revisão Solicitada"
      >
        {selectedService && (
          <div className={styles.modalContent}>
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Informações do Serviço</h3>
              <p>
                <strong>Nome:</strong> {selectedService.name}
              </p>
              <p>
                <strong>Descrição:</strong> {selectedService.description || 'Sem descrição'}
              </p>
              <p>
                <strong>Preço:</strong> {formatCurrency(selectedService.price)}
              </p>
              <p>
                <strong>Categoria:</strong> {selectedService.category || 'Sem categoria'}
              </p>
            </div>

            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Feedback do Administrador</h3>
              <div className={styles.feedbackBox}>{selectedService.reviewFeedback}</div>
              {selectedService.reviewRequestedAt && (
                <p className={styles.modalDate}>
                  Solicitado em:{' '}
                  {new Date(selectedService.reviewRequestedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setReviewModalOpen(false)} className={styles.btnSecondary}>
                Fechar
              </button>
              <button onClick={handleResolveReview} className={styles.btnPrimary}>
                Ajustar Serviço
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ServicesContent;
