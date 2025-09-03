'use client';

import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentStyle = {
    height: height || 'auto',
  };

  const sizeClass = styles[size] || styles.sm;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} ${sizeClass}`} style={contentStyle}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
          {showCloseButton && (
            <button className={styles.modalClose} onClick={onClose}>
              &times;
            </button>
          )}
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
