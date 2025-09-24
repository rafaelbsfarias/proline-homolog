'use client';

import React from 'react';
import type { VehicleData } from '../../hooks/useClientVehicles';
import VehicleCard from '../VehicleCard/VehicleCard';
import Pagination from '@/modules/common/components/Pagination/Pagination';
import Spinner from '@/modules/common/components/Spinner/Spinner';
import styles from './VehicleSection.module.css'; // importando CSS

interface VehicleSectionProps {
  clientName: string;
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  filterPlate: string;
  onFilterPlateChange: (value: string) => void;
  filterStatus: string[];
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
  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <h3 className={styles.title}>Veículos de {clientName}</h3>
        <button
          className={`${styles.button} ${styles.updateButton}`}
          onClick={onRefetch}
          disabled={loading}
        >
          Atualizar
        </button>
        <button
          className={`${styles.button} ${styles.clearButton}`}
          onClick={onClearFilters}
          disabled={loading}
        >
          Limpar filtros
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-plate">
            Filtrar por placa
          </label>
          <input
            id="filter-plate"
            type="text"
            placeholder="Ex: ABC1234"
            value={filterPlate}
            onChange={e => onFilterPlateChange(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {availableStatuses.map(status => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  id={`status-${status}`}
                  value={status}
                  checked={filterStatus.includes(status)}
                  onChange={() => onFilterStatusChange(status)}
                />
                <label htmlFor={`status-${status}`}>{status}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Erro, loading e listagem */}
      {error && <p style={{ color: 'red', marginTop: 8 }}>Erro: {error}</p>}
      {loading ? (
        <Spinner size={30} />
      ) : filteredVehicles.length === 0 ? (
        <p style={{ marginTop: 8 }}>Nenhum veículo cadastrado para este cliente.</p>
      ) : (
        <div className={styles.cardsContainer}>
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

      {/* Paginação */}
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
