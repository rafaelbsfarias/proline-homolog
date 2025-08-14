'use client';

import React, { useEffect } from 'react';
import styles from './Toast.module.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const handleClose = () => {
    onRemove(id);
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert" aria-live="polite">
      <div className={styles.content}>
        <span className={styles.icon}>
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Fechar notificação"
        type="button"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
