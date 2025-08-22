import React from 'react';
import type { Vehicle, AddressItem } from '@/modules/client/types';
import { sanitizeStatus, statusLabel, canClientModify } from '@/modules/client/utils/status';
import { formatDateBR } from '@/modules/client/utils/date';

interface Props {
  vehicle: Vehicle;
  addresses: AddressItem[];
  onOpenDetails: (vehicle: Vehicle) => void;
  onOpenRowModal: (vehicle: Vehicle) => void;
}

export default function VehicleItemRow({ vehicle, addresses, onOpenDetails, onOpenRowModal }: Props) {
  const sClass = sanitizeStatus(vehicle.status);

  const extraLine = (() => {
    const s = String(vehicle.status || '').toUpperCase();
    if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') {
      const label = formatDateBR(vehicle.estimated_arrival_date || '');
      return (
        <span>
          Previsão de chegada: <b>{label}</b>
        </span>
      );
    }
    const selId = vehicle.pickup_address_id || '';
    const addr = addresses.find(a => a.id === selId);
    const label = addr ? `${addr.street || ''}${addr.number ? `, ${addr.number}` : ''}${addr.city ? ` - ${addr.city}` : ''}`.trim() : '';
    if (s === 'AGUARDANDO COLETA' || s === 'PONTO DE COLETA SELECIONADO') {
      return (
        <span>
          Ponto de coleta selecionado: <b>{label || 'Nenhum ponto selecionado'}</b>
        </span>
      );
    }
    // Para outros status, não exibir linha de ponto de coleta
    return null;
  })();

  return (
    <div
      className="vehicle-item vehicle-item--clickable"
      onClick={() => onOpenDetails(vehicle)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
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
      <div className="vehicle-row-controls" onClick={(e) => e.stopPropagation()}>
        <div className="vehicle-extra-line">{extraLine}</div>
        <div className="vehicle-row-actions">
          <button
            className="save-button"
            onClick={() => onOpenRowModal(vehicle)}
            disabled={!canClientModify(vehicle.status)}
            title={!canClientModify(vehicle.status) ? 'Não editável neste status' : 'Editar ponto de coleta'}
          >
            Editar ponto de coleta
          </button>
        </div>
      </div>
    </div>
  );
}
