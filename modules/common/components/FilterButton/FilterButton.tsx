import React from 'react';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import styles from './FilterButton.module.css'; // novo arquivo CSS

interface FilterButtonProps {
  activeFilterCount: number;
  onClick: () => void;
  className?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({ activeFilterCount, onClick, className }) => {
  const filterButtonText =
    activeFilterCount > 0 ? `Filtros de status (${activeFilterCount})` : 'Filtrar por status';

  const ButtonComponent = activeFilterCount > 0 ? SolidButton : OutlineButton;

  return (
    <ButtonComponent
      type="button"
      onClick={onClick}
      className={`${styles.filterButtonThin} ${className || ''}`} // aplica padding
    >
      {filterButtonText}
    </ButtonComponent>
  );
};

export default FilterButton;
