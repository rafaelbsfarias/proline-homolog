import React from 'react';
import { PartRequest } from '../types';
import styles from './PartRequestCard.module.css';

interface PartRequestCardProps {
  partRequest?: PartRequest;
  onEdit: () => void;
  onRemove: () => void;
  onAdd: () => void;
}

export const PartRequestCard: React.FC<PartRequestCardProps> = ({
  partRequest,
  onEdit,
  onRemove,
  onAdd,
}) => {
  if (!partRequest) {
    return (
      <button type="button" onClick={onAdd} className={styles.addButton}>
        🛒 Solicitar Compra de Peças
      </button>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>🔧 Solicitação de Peça</h4>
        <button type="button" onClick={onRemove} className={styles.removeButton}>
          Remover
        </button>
      </div>
      <div className={styles.content}>
        <p className={styles.item}>
          <strong>Peça:</strong> {partRequest.partName}
        </p>
        {partRequest.partDescription && (
          <p className={styles.item}>
            <strong>Descrição:</strong> {partRequest.partDescription}
          </p>
        )}
        <p className={styles.item}>
          <strong>Quantidade:</strong> {partRequest.quantity}
        </p>
        {partRequest.estimatedPrice && (
          <p className={styles.item}>
            <strong>Preço Estimado:</strong> R$ {partRequest.estimatedPrice.toFixed(2)}
          </p>
        )}
      </div>
      <button type="button" onClick={onEdit} className={styles.editButton}>
        Editar Solicitação
      </button>
    </div>
  );
};
