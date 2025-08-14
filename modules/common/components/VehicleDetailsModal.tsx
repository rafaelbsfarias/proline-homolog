import React from 'react';

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    year: number;
    color?: string;
    status: string;
    created_at: string;
    fipe_value?: number;
    client_name?: string;
    analyst?: string;
    arrival_forecast?: string;
    current_km?: number;
    params?: string;
    notes?: string;
    retirada_na_proline?: boolean;
  } | null;
}

const statusLabels: Record<string, string> = {
  aguardando_chegada: 'Aguardando Chegada',
  active: 'Ativo',
  inativo: 'Inativo',
};

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ isOpen, onClose, vehicle }) => {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2>Detalhes do Veículo: {vehicle.plate}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 16 }}>
          <div style={{ minWidth: 220 }}>
            <strong>Placa:</strong> {vehicle.plate}
            <br />
            <strong>Marca:</strong> {vehicle.brand}
            <br />
            <strong>Modelo:</strong> {vehicle.model} ({vehicle.year})<br />
            <strong>Cor:</strong> {vehicle.color || 'N/A'}
            <br />
            <strong>KM Atual:</strong> {vehicle.current_km ?? 'N/A'}
            <br />
            <strong>Valor FIPE:</strong>{' '}
            {vehicle.fipe_value
              ? `R$ ${vehicle.fipe_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'N/A'}
            <br />
            <strong>Cliente:</strong> {vehicle.client_name || 'N/A'}
            <br />
            <strong>Status:</strong>{' '}
            <span className="vehicle-status-badge">
              {statusLabels[vehicle.status] || vehicle.status}
            </span>
            <br />
            <strong>Previsão Chegada (Cliente):</strong> {vehicle.arrival_forecast || 'N/A'}
            <br />
          </div>
          <div style={{ minWidth: 220 }}>
            <strong>Analista Responsável:</strong> {vehicle.analyst || 'N/A'}
            <br />
            <strong>Params Cliente Varejo:</strong> {vehicle.params || 'N/A'}
            <br />
            <strong>Obs. Iniciais Pro Line:</strong> {vehicle.notes || 'Nenhuma.'}
            <br />
            <strong>Retirada na Pro Line:</strong> {vehicle.retirada_na_proline ? 'Sim' : 'Não'}
            <br />
            <strong>Cadastrado em:</strong>{' '}
            {new Date(vehicle.created_at).toLocaleDateString('pt-BR')}
            <br />
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #fff;
          border-radius: 10px;
          padding: 32px 28px 24px 28px;
          min-width: 340px;
          max-width: 600px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 12px;
          right: 16px;
          background: none;
          border: none;
          font-size: 1.6rem;
          color: #888;
          cursor: pointer;
        }
        .vehicle-status-badge {
          background: #e0f7fa;
          color: #0097a7;
          border-radius: 6px;
          padding: 2px 10px;
          font-size: 0.98rem;
          font-weight: 500;
          margin-left: 6px;
        }
      `}</style>
    </div>
  );
};

export default VehicleDetailsModal;
