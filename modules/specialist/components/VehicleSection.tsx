import React from 'react';
import type { VehicleData } from '../hooks/useClientVehicles';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import Pagination from '@/modules/common/components/Pagination';

interface VehicleSectionProps {
  clientName: string;
  vehicles: VehicleData[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  filterPlate: string;
  onFilterPlateChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  availableStatuses: string[];
  onClearFilters: () => void;
  filteredVehicles: VehicleData[];
  onOpenChecklist: (vehicle: VehicleData) => void;
  onConfirmArrival: (vehicle: VehicleData) => void;
  confirming: Record<string, boolean>;
  // Pagination props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const VehicleSection: React.FC<VehicleSectionProps> = ({
  clientName,
  vehicles,
  loading,
  error,
  onRefetch,
  filterPlate,
  onFilterPlateChange,
  filterStatus,
  onFilterStatusChange,
  availableStatuses,
  onClearFilters,
  filteredVehicles,
  onOpenChecklist,
  onConfirmArrival,
  confirming,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#333' }}>Veículos de {clientName}</h3>
        <button
          type="button"
          onClick={onRefetch}
          disabled={loading}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: '#fafafa',
            cursor: 'pointer',
          }}
        >
          Atualizar
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: 8 }}>Erro: {error}</p>}
      {loading ? (
        <p style={{ marginTop: 8 }}>veículos...</p>
      ) : vehicles.length === 0 ? (
        <p style={{ marginTop: 8 }}>Nenhum veículo cadastrado para este cliente.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
            marginTop: 12,
          }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <label htmlFor="filter-plate" style={{ display: 'block', color: '#333' }}>
                  Filtrar por placa
                </label>
                <input
                  id="filter-plate"
                  type="text"
                  placeholder="Ex: ABC1234"
                  value={filterPlate}
                  onChange={e => onFilterPlateChange(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                  }}
                />
              </div>
              <div>
                <label htmlFor="filter-status" style={{ display: 'block', color: '#333' }}>
                  Status
                </label>
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={e => onFilterStatusChange(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                  }}
                >
                  <option value="">Todos</option>
                  {availableStatuses.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {(filterPlate || filterStatus) && (
                <div>
                  <button
                    type="button"
                    onClick={onClearFilters}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #ccc',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </div>

          {filteredVehicles.map(v => (
            <div
              key={v.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 12,
                background: '#fafafa',
              }}
            >
              <div style={{ fontWeight: 600, color: '#333' }}>
                {v.brand} {v.model}
              </div>
              <div style={{ color: '#555' }}>Placa: {v.plate}</div>
              <div style={{ color: '#555' }}>Ano: {v.year}</div>
              <div style={{ color: '#555' }}>Cor: {v.color}</div>
              {v.status && <div style={{ color: '#555' }}>Status: {v.status}</div>}
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onOpenChecklist(v)}
                  disabled={
                    !(() => {
                      const s = String(v.status || '').toUpperCase();
                      return (
                        s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE
                      );
                    })()
                  }
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    background: (() => {
                      const s = String(v.status || '').toUpperCase();
                      return s === VehicleStatus.CHEGADA_CONFIRMADA ||
                        s === VehicleStatus.EM_ANALISE
                        ? '#fff'
                        : '#f0f0f0';
                    })(),
                    cursor: (() => {
                      const s = String(v.status || '').toUpperCase();
                      return s === VehicleStatus.CHEGADA_CONFIRMADA ||
                        s === VehicleStatus.EM_ANALISE
                        ? 'pointer'
                        : 'not-allowed';
                    })(),
                  }}
                  aria-label={`Abrir checklist para o veículo ${v.plate}`}
                  title={(s =>
                    s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE
                      ? 'Abrir checklist'
                      : 'Disponível após confirmar chegada')(String(v.status || '').toUpperCase())}
                >
                  Checklist
                </button>

                <button
                  type="button"
                  onClick={() => onConfirmArrival(v)}
                  disabled={
                    !!confirming[v.id] ||
                    !(() => {
                      const s = String(v.status || '').toUpperCase();
                      return (
                        s === VehicleStatus.AGUARDANDO_COLETA ||
                        s === VehicleStatus.AGUARDANDO_CHEGADA
                      );
                    })()
                  }
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    background: (() => {
                      const s = String(v.status || '').toUpperCase();
                      return s === VehicleStatus.AGUARDANDO_COLETA ||
                        s === VehicleStatus.AGUARDANDO_CHEGADA
                        ? '#e8f5e9'
                        : '#f0f0f0';
                    })(),
                    cursor: (() => {
                      const s = String(v.status || '').toUpperCase();
                      return s === VehicleStatus.AGUARDANDO_COLETA ||
                        s === VehicleStatus.AGUARDANDO_CHEGADA
                        ? 'pointer'
                        : 'not-allowed';
                    })(),
                  }}
                  aria-label={`Confirmar chegada do veículo ${v.plate}`}
                  title={(s =>
                    s === VehicleStatus.AGUARDANDO_COLETA || s === VehicleStatus.AGUARDANDO_CHEGADA
                      ? 'Confirmar chegada'
                      : `Disponível quando status for ${VehicleStatus.AGUARDANDO_COLETA} ou ${VehicleStatus.AGUARDANDO_CHEGADA}`)(
                    String(v.status || '').toUpperCase()
                  )}
                >
                  {confirming[v.id] ? 'Confirmando...' : 'Confirmar chegada'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
};

export default VehicleSection;
