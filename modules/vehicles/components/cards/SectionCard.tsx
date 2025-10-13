import React from 'react';
import styles from './SectionCard.module.css';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  fullWidth?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  headerAction,
  fullWidth = false,
}) => {
  return (
    <div className={`${styles.card} ${fullWidth ? styles.fullWidth : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {headerAction && <div className={styles.action}>{headerAction}</div>}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
