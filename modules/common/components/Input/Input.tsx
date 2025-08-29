import React, { useState } from 'react';
import { EyeIcon } from '../EyeIcon';
import styles from './Input.module.css';

interface InputProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'password' | 'email';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string; // Add className prop
}

const Input: React.FC<InputProps> = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  disabled = false,
  placeholder,
  className, // Destructure className
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={className} // Apply the className
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            onClick={() => setShowPassword(v => !v)}
            className={styles.eyeButton}
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
