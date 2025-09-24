import React, { useState, useEffect } from 'react';
import Modal from '@/modules/common/components/Modal/Modal';
import Checkbox from '@/modules/common/components/Checkbox/Checkbox';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import styles from './VehicleCheckboxFiltersModal.module.css';

interface VehicleCheckboxFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterStatus: string[];
  onFilterStatusChange: (newStatus: string[]) => void; // Now expects an array
  availableStatuses: string[];
  dateFilter: string[];
  onDateFilterChange: (newDateFilter: string[]) => void; // Now expects an array
  onClearCheckboxFilters: () => void;
  onApplyFilters: () => void;
}

const AVAILABLE_DATE_FILTERS = ['Atrasado', 'Próximo (5 dias)', 'No Prazo'];

const VehicleCheckboxFiltersModal: React.FC<VehicleCheckboxFiltersModalProps> = ({
  isOpen,
  onClose,
  filterStatus,
  onFilterStatusChange,
  availableStatuses,
  dateFilter,
  onDateFilterChange,
  onClearCheckboxFilters,
  onApplyFilters,
}) => {
  const [localFilterStatus, setLocalFilterStatus] = useState<string[]>(filterStatus);
  const [localDateFilter, setLocalDateFilter] = useState<string[]>(dateFilter);

  // Sync local state with props when modal opens or external filters change
  useEffect(() => {
    setLocalFilterStatus(filterStatus);
    setLocalDateFilter(dateFilter);
  }, [isOpen, filterStatus, dateFilter]);

  const handleLocalStatusChange = (status: string) => {
    setLocalFilterStatus(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
  };

  const handleLocalDateChange = (dFilter: string) => {
    setLocalDateFilter(prev => {
      if (prev.includes(dFilter)) {
        return prev.filter(d => d !== dFilter);
      }
      return [...prev, dFilter];
    });
  };

  const handleClear = () => {
    setLocalFilterStatus([]);
    setLocalDateFilter([]);
    onClearCheckboxFilters(); // Call parent's clear function
  };

  const handleApply = () => {
    // Pass local state up to parent
    onFilterStatusChange(localFilterStatus);
    onDateFilterChange(localDateFilter);
    onApplyFilters(); // This will trigger the refetch in parent
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtrar Veículos" size="lg">
      <div className={styles.filterGroup}>
        <label className={styles.label}>Status</label>
        <div className={styles.checkboxGrid}>
          {availableStatuses.map(status => (
            <div key={status} className={styles.checkboxRow}>
              <Checkbox
                id={`modal-status-${status}`}
                name={`modal-status-${status}`}
                label={status}
                checked={localFilterStatus.includes(status)}
                onChange={() => handleLocalStatusChange(status)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Status da Data</label>
        <div className={styles.checkboxGrid}>
          {AVAILABLE_DATE_FILTERS.map(dFilter => (
            <div key={dFilter} className={styles.checkboxRow}>
              <Checkbox
                id={`modal-date-filter-${dFilter}`}
                name={`modal-date-filter-${dFilter}`}
                label={dFilter}
                checked={localDateFilter.includes(dFilter)}
                onChange={() => handleLocalDateChange(dFilter)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <OutlineButton type="button" onClick={handleClear}>
          Limpar Filtros
        </OutlineButton>
        <SolidButton type="button" onClick={handleApply}>
          Aplicar Filtros
        </SolidButton>
      </div>
    </Modal>
  );
};

export default VehicleCheckboxFiltersModal;
