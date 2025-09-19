import React from 'react';
import type { VehicleData } from '../hooks/useClientVehicles';
import VehicleCard from './VehicleCard/VehicleCard';
import Pagination from '@/modules/common/components/Pagination/Pagination';
import Spinner from '@/modules/common/components/Spinner/Spinner';

interface VehicleSectionProps {
  clientName: string;
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
  // Optional render actions override (composition-friendly)
  renderActions?: (vehicle: VehicleData) => React.ReactNode;
}

const VehicleSection: React.FC<VehicleSectionProps> = ({
  clientName,
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
  renderActions,
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
        <button
          type="button"
          onClick={onClearFilters}
          disabled={loading}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Limpar filtros
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: 8 }}>Erro: {error}</p>}
      {loading ? (
        <Spinner size={30} />
      ) : filteredVehicles.length === 0 ? (
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
            <VehicleCard
              key={v.id}
              vehicle={v}
              onOpenChecklist={onOpenChecklist}
              onConfirmArrival={onConfirmArrival}
              confirming={confirming}
              renderActions={renderActions}
            />
          ))}
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        currentItemsCount={filteredVehicles.length}
      />
    </div>
  );
};

export default VehicleSection;
