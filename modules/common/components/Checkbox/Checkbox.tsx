import React from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className={styles.checkmark}></span>
      {label}
    </label>
  );
};

export default Checkbox;
