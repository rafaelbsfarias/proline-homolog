import React from 'react';
import styles from './MessageModal.module.css';

type ModalVariant = 'error' | 'success' | 'info';

interface MessageModalProps {
  message: string;
  onClose: () => void;
  title?: string; // optional to allow reuse for success/info
  variant?: ModalVariant; // styles title based on semantic type
}

export const MessageModal: React.FC<MessageModalProps> = ({
  message,
  onClose,
  title = 'Erro',
  variant = 'error',
}) => {
  const titleClass = [
    styles.title,
    variant === 'success' ? styles.titleSuccess : styles.titleError,
  ].join(' ');
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={titleClass}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default MessageModal;
