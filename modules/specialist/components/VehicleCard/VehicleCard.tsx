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
      className={styles.card}
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
