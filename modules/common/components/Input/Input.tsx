import React, { useState, forwardRef } from 'react';
import { IMaskInput } from 'react-imask';
import { LuEye } from 'react-icons/lu';
import { LuEyeOff } from 'react-icons/lu';
import styles from './Input.module.css';
import Label from '../Label/Label';

interface InputProps {
  id: string;
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'email' | 'tel' | 'number';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAccept?: (value: any, maskRef: any) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  mask?: any;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      name,
      label,
      type = 'text',
      value,
      onChange,
      onAccept,
      disabled = false,
      placeholder,
      className,
      mask,
      required,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const commonProps = {
      id,
      name,
      type: inputType,
      value,
      onChange,
      disabled,
      placeholder,
      className,
      required,
    };

    return (
      <div className={styles.formGroup}>
        <Label htmlFor={id}>{label}</Label>
        <div className={styles.inputWrapper}>
          {mask ? (
            <IMaskInput
              {...commonProps}
              mask={mask}
              inputRef={ref as React.Ref<HTMLInputElement>}
              onAccept={onAccept}
            />
          ) : (
            <input {...commonProps} ref={ref} />
          )}
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              onClick={() => setShowPassword(v => !v)}
              className={styles.eyeButton}
            >
              {/* <EyeIcon open={showPassword} /> */}
              {showPassword ? (
                <LuEye className={styles.icon} />
              ) : (
                <LuEyeOff className={styles.icon} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
