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
      else router.push(`/dashboard/client/vehicle/${v.id}`);
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
      <div className={styles.cardTitle}>
        {v.brand} {v.model}
      </div>
      <div className={styles.cardInfo}>Placa: {v.plate}</div>
      <div className={styles.cardInfo}>Ano: {v.year}</div>
      <div className={styles.cardInfo}>Cor: {v.color}</div>
      {v.status && <div className={styles.cardInfo}>Status: {v.status}</div>}

      <div className={styles.cardActions}>
        {renderActions ? (
          renderActions(v)
        ) : (
          <>
            <button
              type="button"
              onClick={e => {
                stopPropagation(e);
                onOpenChecklist(v);
              }}
              disabled={!isChecklistEnabled}
              className={`${styles.button} ${styles.checklistButton}`}
            >
              Checklist
            </button>

            <button
              type="button"
              onClick={e => {
                stopPropagation(e);
                onConfirmArrival(v);
              }}
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
