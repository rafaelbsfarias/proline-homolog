import React, { useState, useCallback, useEffect } from 'react';
import { formatCurrencyBRL, parseCurrencyToNumber } from '../utils/maskers';
import styles from './Input/Input.module.css'; // Importa o mesmo style do Input
import Label from './Label/Label';

interface CurrencyInputProps {
  id?: string;
  name?: string;
  label?: string;
  value?: number; // valor numérico
  onChange: (value: number | undefined) => void; // callback com número
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = '0,00',
  disabled = false,
  className,
  required = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value !== undefined && value !== null ? formatCurrencyBRL(value) : ''
  );

  useEffect(() => {
    setDisplayValue(value !== undefined && value !== null ? formatCurrencyBRL(value) : '');
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digitsOnly = e.target.value.replace(/\D/g, '');
      if (digitsOnly.length === 0) {
        setDisplayValue('');
        onChange(undefined);
        return;
      }
      const numberValue = Number(digitsOnly) / 100;
      setDisplayValue(formatCurrencyBRL(numberValue));
      onChange(numberValue);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    const numeric = parseCurrencyToNumber(displayValue);
    setDisplayValue(formatCurrencyBRL(numeric));
    onChange(numeric);
  }, [displayValue, onChange]);

  return (
    <div className={styles.formGroup}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className={styles.inputWrapper}>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input} ${className || ''}`} // aplica mesma classe
          required={required}
          style={{ textAlign: 'right' }}
        />
      </div>
    </div>
  );
};

export default CurrencyInput;
