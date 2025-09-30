import React from 'react';
import Checkbox from '@/modules/common/components/Checkbox/Checkbox';
import Textarea from '@/modules/common/components/Textarea/Textarea';
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
    <Checkbox
      id={`service-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      name={`service-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      label={label}
      checked={checked}
      onChange={onToggle}
      disabled={disabled}
    />
    {checked && (
      <Textarea
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
