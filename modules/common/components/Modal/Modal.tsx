'use client';

import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  height?: string;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'sm',
  height,
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const contentStyle = {
    height: height || 'auto',
  };

  const sizeClass = styles[size] || styles.sm;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${sizeClass}`}
        style={contentStyle}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
          {showCloseButton && (
            <button className={styles.modalClose} onClick={onClose}>
              &times;
            </button>
          )}
        </div>
        <div className={styles.form}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
