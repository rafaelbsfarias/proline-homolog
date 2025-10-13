import React from 'react';
import { FaCamera, FaCheck } from 'react-icons/fa';
import styles from './ServiceActions.module.css';

interface ServiceActionsProps {
  serviceId: string;
  onImageUpload: (file: File) => void;
  onComplete: () => void;
  uploading: boolean;
  completing: boolean;
}

export const ServiceActions: React.FC<ServiceActionsProps> = ({
  serviceId,
  onImageUpload,
  onComplete,
  uploading,
  completing,
}) => {
  return (
    <div className={styles.actions}>
      <label htmlFor={`upload-${serviceId}`} className={styles.uploadButton}>
        <FaCamera size={16} />
        {uploading ? 'Enviando...' : 'Adicionar Foto'}
      </label>
      <input
        id={`upload-${serviceId}`}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onImageUpload(file);
        }}
        disabled={uploading}
      />

      <button onClick={onComplete} disabled={completing} className={styles.completeButton}>
        <FaCheck size={16} />
        {completing ? 'Processando...' : 'Marcar como Concluído'}
      </button>
    </div>
  );
};
