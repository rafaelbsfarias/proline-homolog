'use client';

import React, { useState } from 'react';
import type { VehicleData } from '../../hooks/useClientVehicles';
import VehicleCard from '../VehicleCard/VehicleCard';
import Pagination from '@/modules/common/components/Pagination/Pagination';
import Spinner from '@/modules/common/components/Spinner/Spinner';
import styles from './VehicleSection.module.css'; // importando CSS
import VehicleCheckboxFiltersModal from '../../../common/components/VehicleCheckboxFiltersModal/VehicleCheckboxFiltersModal';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import FilterButton from '../../../common/components/FilterButton/FilterButton';

interface VehicleSectionProps {
  clientName: string;
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  filterPlate: string;
  onFilterPlateChange: (value: string) => void;
  filterStatus: string[];
  onFilterStatusChange: (newStatus: string[]) => void;
  availableStatuses: string[];
  dateFilter: string[];
  onDateFilterChange: (newDateFilter: string[]) => void;
  onClearFilters: () => void;
  onClearCheckboxFilters: () => void;
  filteredVehicles: VehicleData[];
  onOpenChecklist: (vehicle: VehicleData) => void;
  onConfirmArrival: (vehicle: VehicleData) => void;
  confirming: Record<string, boolean>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  renderActions?: (vehicle: VehicleData) => React.ReactNode;
}

const AVAILABLE_DATE_FILTERS = ['Atrasado', 'Próximo (5 dias)', 'No Prazo'];

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
  dateFilter,
  onDateFilterChange,
  onClearFilters,
  onClearCheckboxFilters,
  filteredVehicles,
  onOpenChecklist,
  onConfirmArrival,
  confirming,
  currentPage,
  totalPages,
  onPageChange,
  renderActions,
}) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount = filterStatus.length + dateFilter.length + (filterPlate ? 1 : 0);

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

        <FilterButton
          activeFilterCount={activeFilterCount}
          onClick={() => setIsFilterModalOpen(true)}
        />
      </div>

      <VehicleCheckboxFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterStatus={filterStatus}
        onFilterStatusChange={onFilterStatusChange}
        availableStatuses={availableStatuses}
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
        onClearCheckboxFilters={onClearCheckboxFilters}
        onApplyFilters={() => setIsFilterModalOpen(false)}
      />

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
