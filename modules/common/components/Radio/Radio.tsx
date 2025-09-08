import React from 'react';
import styles from './Radio.module.css';

interface RadioProps {
  name: string;
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const Radio: React.FC<RadioProps> = ({
  name,
  label,
  value,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label className={styles.label}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
      <span className={styles.radio}></span>
      {label}
    </label>
  );
};

export default Radio;
