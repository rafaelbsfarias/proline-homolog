import React from 'react';
import type { ChecklistForm } from '../../checklist/types';
import styles from './SpecialistInspectionGroups.module.css';

interface Props {
  values: ChecklistForm['services'];
  onChange: (
    service: keyof ChecklistForm['services'],
    field: 'required' | 'notes',
    value: boolean | string
  ) => void;
}

const serviceLabels = {
  mechanics: 'Mecânica',
  bodyPaint: 'Pintura',
  washing: 'Lavagem',
  tires: 'Pneus',
  loja: 'Loja',
  patioAtacado: 'Pátio Atacado',
} as const;

const SpecialistInspectionGroups: React.FC<Props> = ({ values, onChange }) => {
  return (
    <div className={styles.container}>
      <div className={styles.categoryCard}>
        <h3 className={styles.categoryTitle}>Serviços Necessários</h3>
        <div className={styles.itemsGrid}>
          {Object.entries(serviceLabels).map(([key, label]) => {
            const serviceKey = key as keyof ChecklistForm['services'];
            const service = values[serviceKey];

            return (
              <div key={key} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemTitle}>{label}</h4>
                  </div>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={service.required}
                      onChange={e => onChange(serviceKey, 'required', e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span className={styles.checkboxText}>Necessário</span>
                  </label>
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.notesSection}>
                    <label className={styles.notesLabel}>Observações</label>
                    <textarea
                      value={service.notes}
                      onChange={e => onChange(serviceKey, 'notes', e.target.value)}
                      placeholder="Digite observações (opcional)"
                      className={styles.notesTextarea}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpecialistInspectionGroups;
