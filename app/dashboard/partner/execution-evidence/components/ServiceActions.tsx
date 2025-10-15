import React from 'react';
import { FaCamera, FaCheck, FaPlay } from 'react-icons/fa';
import styles from './ServiceActions.module.css';

interface ServiceActionsProps {
  serviceId: string;
  isStarted: boolean;
  onStart: () => void;
  onImageUpload: (file: File) => void;
  onComplete: () => void;
  starting: boolean;
  uploading: boolean;
  completing: boolean;
}

export const ServiceActions: React.FC<ServiceActionsProps> = ({
  serviceId,
  isStarted,
  onStart,
  onImageUpload,
  onComplete,
  starting,
  uploading,
  completing,
}) => {
  // Se não foi iniciado, mostra apenas o botão de iniciar
  if (!isStarted) {
    return (
      <div className={styles.actions}>
        <button onClick={onStart} disabled={starting} className={styles.startButton}>
          <FaPlay size={16} />
          {starting ? 'Iniciando...' : 'Iniciar Execução'}
        </button>
      </div>
    );
  }

  // Se foi iniciado, mostra botões de adicionar foto e concluir
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
