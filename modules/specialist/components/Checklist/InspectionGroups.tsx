import React from 'react';
import styles from '../VehicleChecklistModal.module.css';
import type { ChecklistForm, ChecklistStatus } from '@/modules/specialist/checklist/types';

interface Props {
  values: Pick<
    ChecklistForm,
    | 'exterior'
    | 'interior'
    | 'tires'
    | 'brakes'
    | 'lights'
    | 'fluids'
    | 'engine'
    | 'suspension'
    | 'battery'
  >;
  onChange: (
    name: keyof Pick<
      ChecklistForm,
      | 'exterior'
      | 'interior'
      | 'tires'
      | 'brakes'
      | 'lights'
      | 'fluids'
      | 'engine'
      | 'suspension'
      | 'battery'
    >,
    value: ChecklistStatus
  ) => void;
}

const items = [
  { key: 'exterior', label: 'Exterior' },
  { key: 'interior', label: 'Interior' },
  { key: 'tires', label: 'Pneus' },
  { key: 'brakes', label: 'Freios' },
  { key: 'lights', label: 'Iluminação' },
  { key: 'fluids', label: 'Fluidos' },
  { key: 'engine', label: 'Motor' },
  { key: 'suspension', label: 'Suspensão' },
  { key: 'battery', label: 'Bateria' },
] as const;

const InspectionGroups: React.FC<Props> = ({ values, onChange }) => (
  <>
    {items.map(item => (
      <div key={item.key} className={styles.group}>
        <h4 className={styles.groupTitle}>{item.label}</h4>
        <div className={styles.options}>
          <label>
            <input
              type="radio"
              name={item.key}
              value="ok"
              checked={values[item.key] === 'ok'}
              onChange={() => onChange(item.key, 'ok')}
            />
            Em ordem
          </label>
          <label>
            <input
              type="radio"
              name={item.key}
              value="attention"
              checked={values[item.key] === 'attention'}
              onChange={() => onChange(item.key, 'attention')}
            />
            Atenção breve
          </label>
          <label>
            <input
              type="radio"
              name={item.key}
              value="critical"
              checked={values[item.key] === 'critical'}
              onChange={() => onChange(item.key, 'critical')}
            />
            Crítico/Imediato
          </label>
        </div>
      </div>
    ))}
  </>
);

export default InspectionGroups;
