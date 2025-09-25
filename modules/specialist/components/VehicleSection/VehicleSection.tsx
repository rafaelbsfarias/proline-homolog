'use client';

import React, { useState } from 'react';
import type { VehicleData } from '../../hooks/useClientVehicles';
import VehicleCard from '../VehicleCard/VehicleCard';
import Pagination from '@/modules/common/components/Pagination/Pagination';
import Spinner from '@/modules/common/components/Spinner/Spinner';
import styles from './VehicleSection.module.css'; // importando CSS
import VehicleCheckboxFiltersModal from '../../../common/components/VehicleCheckboxFiltersModal/VehicleCheckboxFiltersModal';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import FilterButton from '../../../common/components/FilterButton/FilterButton';
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import Input from '@/modules/common/components/Input/Input';

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

        <div className={styles.filtersWrapper}>
          <Input
            id="filter-plate"
            className={styles.filterPlate}
            name="filter-plate"
            placeholder="Filtrar por placa"
            value={filterPlate}
            onChange={e => onFilterPlateChange(e.target.value)}
          />

          <div className={styles.filterButtonWrapper}>
            <FilterButton
              activeFilterCount={activeFilterCount}
              onClick={() => setIsFilterModalOpen(true)}
            />
          </div>

          <div className={styles.updateButtonWrapper}>
            <OutlineButton onClick={onRefetch} disabled={loading}>
              Atualizar
            </OutlineButton>
          </div>
        </div>
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
