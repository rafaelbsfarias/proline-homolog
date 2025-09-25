import React from 'react';
import styles from '../VehicleChecklistModal/VehicleChecklistModal.module.css';

interface Props {
  label: string;
  checked: boolean;
  notes: string;
  onToggle: (checked: boolean) => void;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

const ServiceCategoryField: React.FC<Props> = ({
  label,
  checked,
  notes,
  onToggle,
  onNotesChange,
  disabled = false,
}) => (
  <div className={styles.field}>
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onToggle(e.target.checked)}
        disabled={disabled}
      />
      {label}
    </label>
    {checked && (
      <textarea
        placeholder="Observações (opcional)"
        rows={3}
        value={notes}
        onChange={e => onNotesChange(e.target.value)}
        disabled={disabled}
      />
    )}
  </div>
);

export default ServiceCategoryField;
