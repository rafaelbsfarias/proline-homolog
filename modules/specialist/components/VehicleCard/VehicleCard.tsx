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

  console.log('vehicle.estimated_arrival_date', v.estimated_arrival_date);

  const getBorderColorClass = (estimatedArrivalDate?: string) => {
    console.log('ESTIMATED ARRIVAL DATE', estimatedArrivalDate);

    if (!estimatedArrivalDate) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const arrivalDate = new Date(estimatedArrivalDate);
    arrivalDate.setHours(0, 0, 0, 0); // Normalize arrivalDate to start of day

    const diffTime = arrivalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return styles.overdue; // Overdue or today
    } else if (diffDays <= 5) {
      return styles.nearExpiry; // Within 5 days
    }
    return '';
  };

  const borderColorClass = getBorderColorClass(v.estimated_arrival_date);
  const s = String(v.status || '').toUpperCase();
  const isChecklistEnabled =
    s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE;
  const isConfirmArrivalEnabled =
    s === VehicleStatus.AGUARDANDO_COLETA || s === VehicleStatus.AGUARDANDO_CHEGADA;

  const handleNavigateToDetails = () => {
    if (v && v.id) {
      if (onNavigateToDetails) onNavigateToDetails(v.id);
      else router.push(`/dashboard/vehicle/${v.id}`);
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
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
              disabled={!!confirming[v.id] || !isConfirmArrivalEnabled}
              className={`${styles.button} ${styles.confirmArrivalButton}`}
            >
              {confirming[v.id] ? 'Confirmando...' : 'Confirmar chegada'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleCard;
