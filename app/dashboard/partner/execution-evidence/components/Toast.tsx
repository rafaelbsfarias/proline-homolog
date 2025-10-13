import React from 'react';
import { ToastState } from '../types';
import styles from './Toast.module.css';

interface ToastProps {
  toast: ToastState;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast.show) return null;

  return <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.message}</div>;
};
