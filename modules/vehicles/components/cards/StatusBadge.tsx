import React from 'react';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'info' | 'error';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'info' }) => {
  return <span className={`${styles.badge} ${styles[variant]}`}>{status}</span>;
};
