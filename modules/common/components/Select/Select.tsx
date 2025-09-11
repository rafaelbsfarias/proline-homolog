import React, { forwardRef } from 'react';
import styles from './Select.module.css';
import { LuChevronDown } from 'react-icons/lu';

interface SelectProps {
  id: string;
  name: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      name,
      label,
      value,
      onChange,
      options,
      disabled = false,
      required = false,
      placeholder,
      className,
    },
    ref
  ) => {
    return (
      <div className={styles.formGroup}>
        <label htmlFor={id}>{label}</label>
        <div className={styles.inputWrapper}>
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={className}
            ref={ref}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <LuChevronDown className={styles.icon} />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
