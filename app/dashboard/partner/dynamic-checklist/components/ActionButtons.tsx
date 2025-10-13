import React from 'react';
import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onCancel, onSave, saving }) => {
  return (
    <div className={styles.card}>
      <div className={styles.actions}>
        <button type="button" onClick={onCancel} disabled={saving} className={styles.cancelButton}>
          Cancelar
        </button>

        <button type="button" onClick={onSave} disabled={saving} className={styles.saveButton}>
          {saving ? 'Salvando...' : 'Salvar Anomalias'}
        </button>
      </div>
    </div>
  );
};
