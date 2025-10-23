import React from 'react';
import type { Vehicle, AddressItem } from '@/modules/client/types';
import { sanitizeStatus, statusLabel, canClientModify } from '@/modules/client/utils/status';
import { formatDateBR } from '@/modules/client/utils/date';
import { formatAddressLabel } from '@/modules/common/utils/address';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';

interface Props {
  vehicle: Vehicle;
  addresses: AddressItem[];
  collectionFee?: number; // Optional: fee for this vehicle's collection
  onOpenDetails: (vehicle: Vehicle) => void;
  onOpenRowModal: (vehicle: Vehicle) => void;
  pickupRequested?: boolean; // se o cliente já solicitou retirada no pátio (pendente)
}

function getDateStatusClass(status: string, dateStr?: string) {
  if (!dateStr) return '';

  const today = new Date();
  const targetDate = new Date(dateStr);
  const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (status === 'AGUARDANDO CHEGADA DO VEÍCULO' || status === 'AGUARDANDO COLETA') {
    if (diffDays < 0) return 'status-expired'; // ultrapassou data
    if (diffDays <= 5) return 'status-near-expiry'; // até 5 dias antes
    return '';
  }
  return '';
}

export default function VehicleItemRow(props: Props) {
  const { vehicle, addresses, collectionFee, onOpenDetails, onOpenRowModal, pickupRequested } =
    props;

  const sClass = sanitizeStatus(vehicle.status);
  const statusUpper = (vehicle.status || '').toUpperCase();

  // Obter a classe para cor e borda baseada na data e status
  const dateStatusClass =
    statusUpper === 'AGUARDANDO CHEGADA DO VEÍCULO'
      ? getDateStatusClass(statusUpper, vehicle.estimated_arrival_date ?? undefined)
      : statusUpper === 'AGUARDANDO COLETA'
        ? getDateStatusClass(statusUpper, vehicle.estimated_arrival_date ?? undefined)
        : '';

  const extraLine = (() => {
    const s = String(vehicle.status || '').toUpperCase();

    // NEW: Display collection fee if pending approval
    if (s === 'AGUARDANDO APROVAÇÃO DA COLETA' && typeof collectionFee === 'number') {
      return (
        <span>
          Valor da coleta: <b>R$ {collectionFee.toFixed(2)}</b> - Aguardando sua aprovação.
        </span>
      );
    }

    if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') {
      const label = formatDateBR(vehicle.estimated_arrival_date || '');
      return (
        <span className={`date-label ${dateStatusClass}`}>
          Previsão de chegada: <b>{label}</b>
        </span>
      );
    }
    const selId = vehicle.pickup_address_id || '';
    const addr = addresses.find(a => a.id === selId);
    const label = addr ? formatAddressLabel(addr) : '';
    const labelDate = formatDateBR(vehicle.estimated_arrival_date || '');
    if (s === 'AGUARDANDO COLETA' || s === 'PONTO DE COLETA SELECIONADO') {
      return (
        <span>
          Ponto de coleta selecionado: <b>{label || 'Nenhum ponto selecionado'}</b> -{' '}
          <b className={`date-label ${dateStatusClass}`}>{labelDate}</b>
        </span>
      );
    }
    if (
      vehicle.collection_value_status === 'pending' &&
      typeof vehicle.collection_value === 'number'
    ) {
      return (
        <span>
          Valor da coleta: <b>R$ {vehicle.collection_value.toFixed(2)}</b> - Aguardando sua
          aprovação.
        </span>
      );
    }
    // Para outros status, não exibir linha de ponto de coleta
    return null;
  })();

  const isFinalized = statusUpper === 'FINALIZADO';
  const isPickupRequested =
    pickupRequested === true || statusUpper === 'RETIRADA' || statusUpper === 'AGUARDANDO RETIRADA';

  return (
    <div
      className={`vehicle-item ${dateStatusClass}`}
      onClick={() => onOpenDetails(vehicle)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpenDetails(vehicle);
        }
      }}
    >
      <div className="vehicle-info">
        <span className="vehicle-plate">{vehicle.plate}</span>
        <span className="vehicle-model">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </span>
      </div>
      <div className="vehicle-meta">
        <span className="vehicle-date">Cadastrado em {formatDateBR(vehicle.created_at)}</span>
        <span className={`vehicle-status ${sClass}`}>{statusLabel(vehicle.status)}</span>
      </div>
      <div className="vehicle-row-controls" onClick={e => e.stopPropagation()}>
        <div className="vehicle-extra-line">{extraLine}</div>
        <div className="vehicle-row-actions">
          {vehicle.collection_value_status === 'pending' &&
            typeof vehicle.collection_value === 'number' && (
              <>
                <button
                  className="approve-button"
                  onClick={e => {
                    e.stopPropagation();
                    console.log(
                      'Aprovar coleta para veículo:',
                      vehicle.id,
                      'Valor:',
                      vehicle.collection_value
                    ); /* Call API to approve */
                  }}
                  title="Aprovar valor da coleta"
                >
                  Aprovar
                </button>
                <button
                  className="reject-button"
                  onClick={e => {
                    e.stopPropagation();
                    console.log(
                      'Rejeitar coleta para veículo:',
                      vehicle.id,
                      'Valor:',
                      vehicle.collection_value
                    ); /* Call API to reject */
                  }}
                  title="Rejeitar valor da coleta"
                >
                  Rejeitar
                </button>
              </>
            )}
          <SolidButton
            className="buttonVehicleCustom"
            onClick={() => onOpenRowModal(vehicle)}
            disabled={
              isPickupRequested ? true : isFinalized ? false : !canClientModify(vehicle.status)
            }
            title={
              isPickupRequested
                ? 'Retirada já solicitada'
                : isFinalized
                  ? 'Solicitar entrega do veículo'
                  : !canClientModify(vehicle.status)
                    ? 'Não editável neste status'
                    : 'Adicionar ponto de coleta'
            }
          >
            {isPickupRequested
              ? 'Retirada solicitada'
              : isFinalized
                ? 'Solicitar entrega do veículo'
                : 'Adicionar ponto de coleta'}
          </SolidButton>
        </div>
      </div>
    </div>
  );
}
