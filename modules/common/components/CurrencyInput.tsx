import React, { useState, useCallback, useEffect } from 'react';
import { formatCurrencyBRL, parseCurrencyToNumber } from '../utils/maskers';

interface CurrencyInputProps {
  value?: number; // The numeric value (e.g., 0.54)
  onChange: (value: number | undefined) => void; // Callback for numeric value change
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0,00',
  disabled = false,
  className,
  id,
  name,
}) => {
  // displayValue holds the string shown in the input field (e.g., "0,54" or "1.234,56")
  const [displayValue, setDisplayValue] = useState<string>(() => {
    // Initialize displayValue from the numeric value prop
    return value !== undefined && value !== null ? formatCurrencyBRL(value) : '';
  });

  // This useEffect will format the initial value and any external changes to the value prop
  useEffect(() => {
    if (value !== undefined && value !== null) {
      // Format the number to a currency string for display
      setDisplayValue(formatCurrencyBRL(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value; // e.g., "5", "0,05", "0,054"

      // 1. Clean input: allow only digits
      const digitsOnly = rawInput.replace(/\D/g, '');

      // Handle empty input
      if (digitsOnly.length === 0) {
        setDisplayValue('');
        onChange(undefined); // Or 0, depending on desired behavior for empty
        return;
      }

      // Convert digits to a number, assuming last two are cents
      // e.g., "5" -> 0.05, "54" -> 0.54, "123" -> 1.23
      const numberValue = Number(digitsOnly) / 100;

      // Format this number for display
      const formattedDisplay = formatCurrencyBRL(numberValue);

      setDisplayValue(formattedDisplay);
      onChange(numberValue); // Call onChange immediately with the numeric value
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    // When the input loses focus, parse the displayValue and format it
    const parsedNumber = parseCurrencyToNumber(displayValue);
    const formattedDisplay = formatCurrencyBRL(parsedNumber);

    setDisplayValue(formattedDisplay); // Update display to formatted string (e.g., "R$ 0,54")
    onChange(parsedNumber); // Pass the final numeric value to the parent component
  }, [displayValue, onChange]);

  return (
    <input
      id={id}
      name={name}
      type="text" // Use text type to allow custom formatting
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
      style={{ textAlign: 'right' }} // Align text to the right for currency
    />
  );
};

export default CurrencyInput;
