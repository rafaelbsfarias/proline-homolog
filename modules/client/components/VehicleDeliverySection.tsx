'use client';

import React from 'react';
import { useDeliveriesPending, useDeliveryApproval } from '../hooks/delivery';
import { isoToBr } from '@/modules/common/components/date-picker/utils';
import styles from './VehicleDeliverySection.module.css';

interface VehicleDeliverySectionProps {
  onLoadingChange?: (loading: boolean) => void;
}

const VehicleDeliverySection: React.FC<VehicleDeliverySectionProps> = ({ onLoadingChange }) => {
  const { deliveries, loading, error: fetchError, refetch } = useDeliveriesPending(onLoadingChange);
  const { approveDelivery, rejectDelivery, processing, error: actionError } = useDeliveryApproval();

  const handleApprove = async (requestId: string) => {
    const success = await approveDelivery(requestId);
    if (success) {
      await refetch();
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await rejectDelivery(requestId);
    if (success) {
      await refetch();
    }
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className={styles.deliverySection}>
        <h3 className={styles.title}>Entregas Aguardando Aprovação</h3>
        <p className={styles.loading}>Carregando...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.deliverySection}>
        <h3 className={styles.title}>Entregas Aguardando Aprovação</h3>
        <p className={styles.error}>{fetchError}</p>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return null; // Não exibir o card se não houver entregas pendentes
  }

  return (
    <div className={styles.deliverySection}>
      <div className={styles.header}>
        <h3 className={styles.title}>Entregas Aguardando Aprovação ({deliveries.length})</h3>
        <p className={styles.subtitle}>Revise e aprove as propostas de entrega dos seus veículos</p>
      </div>

      {actionError && <div className={styles.errorBanner}>{actionError}</div>}

      <div className={styles.deliveryList}>
        {deliveries.map(delivery => (
          <div key={delivery.requestId} className={styles.deliveryCard}>
            <div className={styles.cardHeader}>
              <div className={styles.vehicleInfo}>
                <span className={styles.plate}>{delivery.vehicle.plate}</span>
                <span className={styles.vehicleDetails}>
                  {delivery.vehicle.brand} {delivery.vehicle.model} ({delivery.vehicle.year})
                </span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Endereço de entrega:</span>
                <span className={styles.value}>{delivery.address.label}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Data prevista:</span>
                <span className={styles.value}>{isoToBr(delivery.deliveryDate)}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Valor da entrega:</span>
                <span className={styles.valueHighlight}>
                  R$ {delivery.deliveryFee.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                onClick={() => handleApprove(delivery.requestId)}
                disabled={processing}
                className={styles.approveButton}
              >
                ✓ Aprovar Entrega
              </button>
              <button
                onClick={() => handleReject(delivery.requestId)}
                disabled={processing}
                className={styles.rejectButton}
              >
                ✗ Rejeitar Proposta
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleDeliverySection;
