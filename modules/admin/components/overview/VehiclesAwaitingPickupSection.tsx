import React from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { isoToBr } from '@/modules/common/components/date-picker/utils';

export type VehiclePickupRequest = {
  vehicleId: string;
  plate: string;
  brand: string;
  model: string;
  year?: string;
  requestedPickupDate: string | null;
  proposedBy?: 'client' | 'admin';
};

interface Props {
  vehicles: VehiclePickupRequest[];
  onAcceptDate?: (vehicleId: string) => Promise<void>;
  onProposeNewDate?: (vehicleId: string, currentDate: string | null) => void;
  loading?: boolean;
}

const VehiclesAwaitingPickupSection: React.FC<Props> = ({
  vehicles,
  onAcceptDate,
  onProposeNewDate,
  loading = false,
}) => {
  if (!vehicles || vehicles.length === 0) return null;

  const handleAccept = async (vehicleId: string) => {
    if (onAcceptDate) {
      await onAcceptDate(vehicleId);
    }
  };

  const handleProposeNew = (vehicleId: string, currentDate: string | null) => {
    if (onProposeNewDate) {
      onProposeNewDate(vehicleId, currentDate);
    }
  };

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Veículos aguardando retirada ({vehicles.length})</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thLeft}>Placa</th>
            <th className={styles.thLeft}>Veículo</th>
            <th className={styles.thCenter}>Ano</th>
            <th className={styles.thCenter}>Data solicitada</th>
            <th className={styles.thCenter}>Solicitado por</th>
            <th className={styles.thCenter}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(vehicle => (
            <tr key={vehicle.vehicleId}>
              <td>
                <strong>{vehicle.plate}</strong>
              </td>
              <td>
                {vehicle.brand} {vehicle.model}
              </td>
              <td className={styles.thCenter}>{vehicle.year || '-'}</td>
              <td className={styles.thCenter}>
                {vehicle.requestedPickupDate ? isoToBr(vehicle.requestedPickupDate) : '-'}
              </td>
              <td className={styles.thCenter}>
                {vehicle.proposedBy === 'client' ? (
                  <span style={{ color: '#0066cc' }}>Cliente</span>
                ) : (
                  <span style={{ color: '#666' }}>Admin</span>
                )}
              </td>
              <td className={styles.thCenter}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {vehicle.proposedBy === 'client' && vehicle.requestedPickupDate && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleAccept(vehicle.vehicleId)}
                      title="Aceitar a data solicitada pelo cliente"
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      ✓ Aceitar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleProposeNew(vehicle.vehicleId, vehicle.requestedPickupDate)}
                    title="Propor uma nova data de retirada"
                    style={{
                      backgroundColor: '#002e4c',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    {vehicle.requestedPickupDate ? '📅 Propor nova data' : '📅 Definir data'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VehiclesAwaitingPickupSection;
