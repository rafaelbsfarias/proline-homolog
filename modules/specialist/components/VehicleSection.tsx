'use client';

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
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
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
  const [maxStatusWidth, setMaxStatusWidth] = React.useState(0);

  React.useEffect(() => {
    if (!filteredVehicles.length) return;

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.fontSize = '0.8rem';
    tempDiv.style.fontWeight = '500';
    tempDiv.style.padding = '2px 8px';
    document.body.appendChild(tempDiv);

    let maxWidth = 0;
    filteredVehicles.forEach(v => {
      tempDiv.innerText = v.status || '';
      if (tempDiv.offsetWidth > maxWidth) maxWidth = tempDiv.offsetWidth;
    });

    document.body.removeChild(tempDiv);
    setMaxStatusWidth(maxWidth + 40); // Ajuste de padding e label
  }, [filteredVehicles]);

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#333' }}>Veículos de {clientName}</h3>
        <button
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
        <p>Nenhum veículo cadastrado para este cliente.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${maxStatusWidth}px, 1fr))`,
            gap: 12,
            marginTop: 12,
          }}
        >
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
