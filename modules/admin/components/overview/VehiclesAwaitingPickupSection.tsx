import React, { useState } from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { isoToBr } from '@/modules/common/components/date-picker/utils';

export type VehiclePickupRequest = {
  requestId: string;
  requestStatus: string;
  vehicleId: string;
  plate: string;
  brand: string;
  model: string;
  year?: string;
  requestedDate: string | null;
  proposedBy?: 'client' | 'admin';
  type: 'pickup' | 'delivery';
  addressId?: string | null;
  addressLabel?: string;
  feeAmount?: number | null;
};

interface Props {
  pickups: VehiclePickupRequest[];
  deliveries: VehiclePickupRequest[];
  onAcceptDate?: (requestId: string, vehicleId: string) => Promise<void>;
  onProposeNewDate?: (requestId: string, vehicleId: string, currentDate: string | null) => void;
  onUpdateDeliveryFee?: (requestId: string, addressId: string, fee: number) => Promise<void>;
  loading?: boolean;
}

const VehiclesAwaitingPickupSection: React.FC<Props> = ({
  pickups,
  deliveries,
  onAcceptDate,
  onProposeNewDate,
  onUpdateDeliveryFee,
  loading = false,
}) => {
  const [pickupsExpanded, setPickupsExpanded] = useState(true);
  const [deliveriesExpanded, setDeliveriesExpanded] = useState(true);
  const [deliveryFees, setDeliveryFees] = useState<Record<string, string>>({});
  const [savingFee, setSavingFee] = useState<string | null>(null);

  const totalCount = pickups.length + deliveries.length;

  if (totalCount === 0) return null;

  const handleAccept = async (requestId: string, vehicleId: string) => {
    if (onAcceptDate) await onAcceptDate(requestId, vehicleId);
  };

  const handleProposeNew = (requestId: string, vehicleId: string, currentDate: string | null) => {
    if (onProposeNewDate) onProposeNewDate(requestId, vehicleId, currentDate);
  };

  const handleFeeChange = (requestId: string, value: string) => {
    setDeliveryFees(prev => ({ ...prev, [requestId]: value }));
  };

  const handleSaveFee = async (requestId: string, addressId: string) => {
    const feeStr = deliveryFees[requestId];
    const fee = parseFloat(feeStr);

    if (!feeStr || isNaN(fee) || fee < 0) {
      return; // Validação silenciosa - o botão já está desabilitado quando o campo está vazio
    }

    if (onUpdateDeliveryFee) {
      setSavingFee(requestId);
      try {
        await onUpdateDeliveryFee(requestId, addressId, fee);
        // Limpar o campo após salvar
        setDeliveryFees(prev => {
          const newFees = { ...prev };
          delete newFees[requestId];
          return newFees;
        });
      } finally {
        setSavingFee(null);
      }
    }
  };

  const renderPickupTable = (vehicles: VehiclePickupRequest[]) => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.thLeft}>Placa</th>
          <th className={styles.thLeft}>Veículo</th>
          <th className={styles.thCenter}>Ano</th>
          <th className={styles.thCenter}>Data solicitada</th>
          <th className={styles.thCenter}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map(vehicle => (
          <tr key={vehicle.requestId}>
            <td>
              <strong>{vehicle.plate}</strong>
            </td>
            <td>
              {vehicle.brand} {vehicle.model}
            </td>
            <td className={styles.thCenter}>{vehicle.year || '-'}</td>
            <td className={styles.thCenter}>
              {vehicle.requestedDate ? isoToBr(vehicle.requestedDate) : '-'}
            </td>
            <td className={styles.thCenter}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {vehicle.proposedBy === 'client' && vehicle.requestedDate && (
                  <button
                    type="button"
                    disabled={loading || vehicle.requestStatus !== 'requested'}
                    onClick={() => handleAccept(vehicle.requestId, vehicle.vehicleId)}
                    title={
                      vehicle.requestStatus !== 'requested'
                        ? 'Ação indisponível: solicitação já processada'
                        : 'Aceitar a data solicitada pelo cliente'
                    }
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor:
                        loading || vehicle.requestStatus !== 'requested'
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Aceitar
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading || vehicle.requestStatus !== 'requested'}
                  onClick={() =>
                    handleProposeNew(vehicle.requestId, vehicle.vehicleId, vehicle.requestedDate)
                  }
                  title={
                    vehicle.requestStatus !== 'requested'
                      ? 'Ação indisponível: solicitação já processada'
                      : 'Propor uma nova data de retirada'
                  }
                  style={{
                    backgroundColor: '#002e4c',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor:
                      loading || vehicle.requestStatus !== 'requested' ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {vehicle.requestedDate ? 'Propor nova data' : 'Definir data'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderDeliveryTable = (vehicles: VehiclePickupRequest[]) => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.thLeft}>Placa</th>
          <th className={styles.thLeft}>Veículo</th>
          <th className={styles.thLeft}>Endereço</th>
          <th className={styles.thCenter}>Data solicitada</th>
          <th className={styles.thCenter}>Valor da entrega</th>
          <th className={styles.thCenter}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map(vehicle => {
          const currentFee =
            deliveryFees[vehicle.requestId] ??
            (vehicle.feeAmount != null ? String(vehicle.feeAmount) : '');
          const isSaving = savingFee === vehicle.requestId;

          return (
            <tr key={vehicle.requestId}>
              <td>
                <strong>{vehicle.plate}</strong>
              </td>
              <td>
                {vehicle.brand} {vehicle.model}
              </td>
              <td>
                <div style={{ fontSize: '13px' }}>{vehicle.addressLabel || '-'}</div>
              </td>
              <td className={styles.thCenter}>
                {vehicle.requestedDate ? isoToBr(vehicle.requestedDate) : '-'}
              </td>
              <td className={styles.thCenter}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: 'center',
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentFee}
                    onChange={e => handleFeeChange(vehicle.requestId, e.target.value)}
                    disabled={isSaving || vehicle.requestStatus !== 'requested'}
                    placeholder="R$ 0,00"
                    style={{
                      width: 100,
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  />
                  {vehicle.addressId && (
                    <button
                      type="button"
                      onClick={() => handleSaveFee(vehicle.requestId, vehicle.addressId!)}
                      disabled={isSaving || vehicle.requestStatus !== 'requested' || !currentFee}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: 4,
                        cursor: isSaving || !currentFee ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {isSaving ? '...' : 'Salvar'}
                    </button>
                  )}
                </div>
              </td>
              <td className={styles.thCenter}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {vehicle.proposedBy === 'client' && vehicle.requestedDate && (
                    <button
                      type="button"
                      disabled={loading || vehicle.requestStatus !== 'requested'}
                      onClick={() => handleAccept(vehicle.requestId, vehicle.vehicleId)}
                      title={
                        vehicle.requestStatus !== 'requested'
                          ? 'Ação indisponível: solicitação já processada'
                          : 'Aceitar a data solicitada pelo cliente'
                      }
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor:
                          loading || vehicle.requestStatus !== 'requested'
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      ✓ Aceitar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loading || vehicle.requestStatus !== 'requested'}
                    onClick={() =>
                      handleProposeNew(vehicle.requestId, vehicle.vehicleId, vehicle.requestedDate)
                    }
                    title={
                      vehicle.requestStatus !== 'requested'
                        ? 'Ação indisponível: solicitação já processada'
                        : 'Propor uma nova data de entrega'
                    }
                    style={{
                      backgroundColor: '#002e4c',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor:
                        loading || vehicle.requestStatus !== 'requested'
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    {vehicle.requestedDate ? 'Propor nova data' : 'Definir data'}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className={styles.tableWrap} style={{ marginBottom: 24 }}>
      <h3 className={styles.sectionTitle}>Solicitações de Retirada/Entrega ({totalCount})</h3>

      {/* Sub-card: Retiradas no Pátio */}
      {pickups.length > 0 && (
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => setPickupsExpanded(!pickupsExpanded)}
            style={{
              backgroundColor: '#f5f5f5',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#002e4c' }}>
              Retiradas no Pátio ({pickups.length})
            </h4>
            <span style={{ fontSize: 18, color: '#666' }}>{pickupsExpanded ? '▼' : '▶'}</span>
          </div>
          {pickupsExpanded && <div style={{ padding: 16 }}>{renderPickupTable(pickups)}</div>}
        </div>
      )}

      {/* Sub-card: Entregas em Endereço */}
      {deliveries.length > 0 && (
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => setDeliveriesExpanded(!deliveriesExpanded)}
            style={{
              backgroundColor: '#f5f5f5',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#002e4c' }}>
              Entregas em Endereço ({deliveries.length})
            </h4>
            <span style={{ fontSize: 18, color: '#666' }}>{deliveriesExpanded ? '▼' : '▶'}</span>
          </div>
          {deliveriesExpanded && (
            <div style={{ padding: 16 }}>{renderDeliveryTable(deliveries)}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehiclesAwaitingPickupSection;
