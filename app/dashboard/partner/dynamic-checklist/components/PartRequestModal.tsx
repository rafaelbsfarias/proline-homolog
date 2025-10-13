import React from 'react';
import { PartRequestModalState } from '../types';
import styles from './PartRequestModal.module.css';

interface PartRequestModalProps {
  modalState: PartRequestModalState;
  onClose: () => void;
  onSave: () => void;
  onUpdateField: (field: keyof PartRequestModalState, value: string | number) => void;
}

export const PartRequestModal: React.FC<PartRequestModalProps> = ({
  modalState,
  onClose,
  onSave,
  onUpdateField,
}) => {
  if (!modalState.isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Solicitar Compra de Peças</h3>

        <div className={styles.field}>
          <label className={styles.label}>Nome da Peça *</label>
          <input
            type="text"
            value={modalState.partName}
            onChange={e => onUpdateField('partName', e.target.value)}
            placeholder="Ex: Pastilha de freio dianteira"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descrição (opcional)</label>
          <textarea
            value={modalState.partDescription}
            onChange={e => onUpdateField('partDescription', e.target.value)}
            placeholder="Especificações, marca sugerida, etc."
            rows={3}
            className={styles.textarea}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Quantidade *</label>
          <input
            type="number"
            min="1"
            value={modalState.quantity}
            onChange={e => onUpdateField('quantity', parseInt(e.target.value) || 1)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Preço Estimado (opcional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={modalState.estimatedPrice}
            onChange={e => onUpdateField('estimatedPrice', e.target.value)}
            placeholder="0.00"
            className={styles.input}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!modalState.partName.trim()}
            className={styles.saveButton}
          >
            Salvar Solicitação
          </button>
        </div>
      </div>
    </div>
  );
};
