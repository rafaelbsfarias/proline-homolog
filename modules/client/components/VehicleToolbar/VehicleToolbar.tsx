import React from 'react';
import FilterButton from '@/modules/common/components/FilterButton/FilterButton';
import Input from '@/modules/common/components/Input/Input';
import styles from './VehicleToolbar.module.css';

interface VehicleToolbarProps {
  filterPlate: string;
  setFilterPlate: (value: string) => void;
  activeFilterCount: number;
  onFilterButtonClick: () => void;
}

const VehicleToolbar: React.FC<VehicleToolbarProps> = ({
  filterPlate,
  setFilterPlate,
  activeFilterCount,
  onFilterButtonClick,
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.plateInput}>
        <Input
          id="plate-filter"
          name="plate-filter"
          type="text"
          placeholder="Filtrar por placa"
          value={filterPlate}
          onChange={e => setFilterPlate(e.target.value)}
        />
      </div>
      <div className={styles.filterButtonWrapper}>
        <FilterButton activeFilterCount={activeFilterCount} onClick={onFilterButtonClick} />
      </div>
    </div>
  );
};

export default VehicleToolbar;
