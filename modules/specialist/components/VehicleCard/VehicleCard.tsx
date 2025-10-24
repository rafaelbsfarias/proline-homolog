'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // ✅ App Router
import type { VehicleData } from '../../hooks/useClientVehicles';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import styles from './VehicleCard.module.css';

interface VehicleCardProps {
  vehicle: VehicleData;
  onOpenChecklist: (vehicle: VehicleData) => void;
  onConfirmArrival: (vehicle: VehicleData) => void;
  confirming: Record<string, boolean>;
  renderActions?: (vehicle: VehicleData) => React.ReactNode;
  onNavigateToDetails?: (id: string) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle: v,
  onOpenChecklist,
  onConfirmArrival,
  confirming,
  renderActions,
  onNavigateToDetails,
}) => {
  const router = useRouter();

  const getBorderColorClass = (
    estimatedArrivalDate?: string | null,
    endDate?: string | null,
    status?: string | null
  ) => {
    const s = String(status || '').toUpperCase();
    if (
      s === VehicleStatus.CHEGADA_CONFIRMADA ||
      s === VehicleStatus.ANALISE_FINALIZADA ||
      s === VehicleStatus.EM_ANALISE
    ) {
      return styles.card;
    }

    if (endDate) {
      return styles.card;
    }

    if (!estimatedArrivalDate) {
      return '';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const arrivalDate = new Date(estimatedArrivalDate);
    arrivalDate.setHours(0, 0, 0, 0); // Normalize arrivalDate to start of day

    const diffTime = arrivalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return styles.overdue; // After prevision_date (Red)
    } else if (diffDays <= 5) {
      return styles.nearExpiry; // 5 days before or on prevision_date (Yellow)
    }
    return '';
  };

  const borderColorClass = getBorderColorClass(
    v.estimated_arrival_date,
    (v as any).end_date,
    v.status
  );
  const s = String(v.status || '').toUpperCase();
  const isChecklistEnabled =
    s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE;

  // Detectar status de entrega/retirada
  const isAwaitingDelivery = v.status?.includes('Finalizado: Aguardando Entrega');
  const isAwaitingPickup = v.status?.includes('Finalizado: Aguardando Retirada');
  const isConfirmDeliveryEnabled = isAwaitingDelivery || isAwaitingPickup;

  const isConfirmArrivalEnabled =
    s === VehicleStatus.AGUARDANDO_COLETA || s === VehicleStatus.AGUARDANDO_CHEGADA;

  // Determinar texto do botão
  let confirmButtonText = 'Confirmar chegada';
  if (isAwaitingDelivery) {
    confirmButtonText = 'Confirmar entrega';
  } else if (isAwaitingPickup) {
    confirmButtonText = 'Confirmar retirada';
  }

  if (confirming[v.id]) {
    confirmButtonText = 'Confirmando...';
  }

  const handleNavigateToDetails = () => {
    if (v && v.id) {
      if (onNavigateToDetails) onNavigateToDetails(v.id);
      else router.push(`/dashboard/vehicle/${v.id}`);
    }
  };

  return (
    <div
      className={`${styles.card} ${borderColorClass}`}
      role="button"
      tabIndex={0}
      onClick={handleNavigateToDetails}
      onKeyDown={e => e.key === 'Enter' && handleNavigateToDetails()}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <h4 className={styles.cardTitle}>
          {v.brand} {v.model}
        </h4>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardDetail}>
          <span className={styles.label}>Placa:</span>
          <span>{v.plate}</span>
        </div>
        <div className={styles.cardDetail}>
          <span className={styles.label}>Ano:</span>
          <span>{v.year}</span>
        </div>
        <div className={styles.cardDetail}>
          <span className={styles.label}>Cor:</span>
          <span>{v.color}</span>
        </div>
        {v.status && (
          <div className={styles.cardDetail}>
            <span className={styles.label}>Status:</span>
            <span className={styles.statusBadge}>{v.status}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
        {renderActions ? (
          renderActions(v)
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenChecklist(v)}
              disabled={!isChecklistEnabled}
              className={`${styles.button} ${styles.checklistButton}`}
            >
              Checklist
            </button>

            <button
              type="button"
              onClick={() => onConfirmArrival(v)}
              disabled={
                !!confirming[v.id] || (!isConfirmArrivalEnabled && !isConfirmDeliveryEnabled)
              }
              className={`${styles.button} ${styles.confirmArrivalButton}`}
            >
              {confirmButtonText}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleCard;
