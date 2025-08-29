import React, { useState } from 'react';
import { EyeIcon } from '../EyeIcon';
import styles from './Input.module.css';
import ErrorMessage from '../ErroMessage/ErrorMessage';

interface InputProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'password' | 'email'; // tipos suportados
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
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
