import React from 'react';
import type { SpecialistChecklistForm } from '../../hooks/useSpecialistChecklist';
import styles from './SpecialistInspectionGroups.module.css';

type InspectionStatus = 'ok' | 'attention' | 'critical';

interface InspectionItem {
  key: keyof Pick<
    SpecialistChecklistForm,
    | 'clutch'
    | 'sparkPlugs'
    | 'belts'
    | 'radiator'
    | 'frontShocks'
    | 'rearShocks'
    | 'suspension'
    | 'tires'
    | 'brakePads'
    | 'brakeDiscs'
    | 'engine'
    | 'steeringBox'
    | 'electricSteeringBox'
    | 'exhaust'
    | 'fluids'
    | 'airConditioning'
    | 'airConditioningCompressor'
    | 'airConditioningCleaning'
    | 'electricalActuationGlass'
    | 'electricalActuationMirror'
    | 'electricalActuationSocket'
    | 'electricalActuationLock'
    | 'electricalActuationTrunk'
    | 'electricalActuationWiper'
    | 'electricalActuationKey'
    | 'electricalActuationAlarm'
    | 'electricalActuationInteriorLight'
    | 'dashboardPanel'
    | 'lights'
    | 'battery'
  >;
  notesKey: keyof Pick<
    SpecialistChecklistForm,
    | 'clutchNotes'
    | 'sparkPlugsNotes'
    | 'beltsNotes'
    | 'radiatorNotes'
    | 'frontShocksNotes'
    | 'rearShocksNotes'
    | 'suspensionNotes'
    | 'tiresNotes'
    | 'brakePadsNotes'
    | 'brakeDiscsNotes'
    | 'engineNotes'
    | 'steeringBoxNotes'
    | 'electricSteeringBoxNotes'
    | 'exhaustNotes'
    | 'fluidsNotes'
    | 'airConditioningNotes'
    | 'airConditioningCompressorNotes'
    | 'airConditioningCleaningNotes'
    | 'electricalActuationGlassNotes'
    | 'electricalActuationMirrorNotes'
    | 'electricalActuationSocketNotes'
    | 'electricalActuationLockNotes'
    | 'electricalActuationTrunkNotes'
    | 'electricalActuationWiperNotes'
    | 'electricalActuationKeyNotes'
    | 'electricalActuationAlarmNotes'
    | 'electricalActuationInteriorLightNotes'
    | 'dashboardPanelNotes'
    | 'lightsNotes'
    | 'batteryNotes'
  >;
  label: string;
  category: string;
  description?: string;
}

interface Props {
  values: Pick<
    SpecialistChecklistForm,
    | 'clutch'
    | 'sparkPlugs'
    | 'belts'
    | 'radiator'
    | 'frontShocks'
    | 'rearShocks'
    | 'suspension'
    | 'tires'
    | 'brakePads'
    | 'brakeDiscs'
    | 'engine'
    | 'steeringBox'
    | 'electricSteeringBox'
    | 'exhaust'
    | 'fluids'
    | 'airConditioning'
    | 'airConditioningCompressor'
    | 'airConditioningCleaning'
    | 'electricalActuationGlass'
    | 'electricalActuationMirror'
    | 'electricalActuationSocket'
    | 'electricalActuationLock'
    | 'electricalActuationTrunk'
    | 'electricalActuationWiper'
    | 'electricalActuationKey'
    | 'electricalActuationAlarm'
    | 'electricalActuationInteriorLight'
    | 'dashboardPanel'
    | 'lights'
    | 'battery'
    | 'clutchNotes'
    | 'sparkPlugsNotes'
    | 'beltsNotes'
    | 'radiatorNotes'
    | 'frontShocksNotes'
    | 'rearShocksNotes'
    | 'suspensionNotes'
    | 'tiresNotes'
    | 'brakePadsNotes'
    | 'brakeDiscsNotes'
    | 'engineNotes'
    | 'steeringBoxNotes'
    | 'electricSteeringBoxNotes'
    | 'exhaustNotes'
    | 'fluidsNotes'
    | 'airConditioningNotes'
    | 'airConditioningCompressorNotes'
    | 'airConditioningCleaningNotes'
    | 'electricalActuationGlassNotes'
    | 'electricalActuationMirrorNotes'
    | 'electricalActuationSocketNotes'
    | 'electricalActuationLockNotes'
    | 'electricalActuationTrunkNotes'
    | 'electricalActuationWiperNotes'
    | 'electricalActuationKeyNotes'
    | 'electricalActuationAlarmNotes'
    | 'electricalActuationInteriorLightNotes'
    | 'dashboardPanelNotes'
    | 'lightsNotes'
    | 'batteryNotes'
  >;
  onChange: (
    name: keyof Pick<
      SpecialistChecklistForm,
      | 'clutch'
      | 'sparkPlugs'
      | 'belts'
      | 'radiator'
      | 'frontShocks'
      | 'rearShocks'
      | 'suspension'
      | 'tires'
      | 'brakePads'
      | 'brakeDiscs'
      | 'engine'
      | 'steeringBox'
      | 'electricSteeringBox'
      | 'exhaust'
      | 'fluids'
      | 'airConditioning'
      | 'airConditioningCompressor'
      | 'airConditioningCleaning'
      | 'electricalActuationGlass'
      | 'electricalActuationMirror'
      | 'electricalActuationSocket'
      | 'electricalActuationLock'
      | 'electricalActuationTrunk'
      | 'electricalActuationWiper'
      | 'electricalActuationKey'
      | 'electricalActuationAlarm'
      | 'electricalActuationInteriorLight'
      | 'dashboardPanel'
      | 'lights'
      | 'battery'
      | 'clutchNotes'
      | 'sparkPlugsNotes'
      | 'beltsNotes'
      | 'radiatorNotes'
      | 'frontShocksNotes'
      | 'rearShocksNotes'
      | 'suspensionNotes'
      | 'tiresNotes'
      | 'brakePadsNotes'
      | 'brakeDiscsNotes'
      | 'engineNotes'
      | 'steeringBoxNotes'
      | 'electricSteeringBoxNotes'
      | 'exhaustNotes'
      | 'fluidsNotes'
      | 'airConditioningNotes'
      | 'airConditioningCompressorNotes'
      | 'airConditioningCleaningNotes'
      | 'electricalActuationGlassNotes'
      | 'electricalActuationMirrorNotes'
      | 'electricalActuationSocketNotes'
      | 'electricalActuationLockNotes'
      | 'electricalActuationTrunkNotes'
      | 'electricalActuationWiperNotes'
      | 'electricalActuationKeyNotes'
      | 'electricalActuationAlarmNotes'
      | 'electricalActuationInteriorLightNotes'
      | 'dashboardPanelNotes'
      | 'lightsNotes'
      | 'batteryNotes'
    >,
    value: string | InspectionStatus
  ) => void;
}

const inspectionItems: InspectionItem[] = [
  // MECÂNICA
  {
    key: 'clutch',
    notesKey: 'clutchNotes',
    label: 'Embreagem - Conjunto',
    category: 'MECÂNICA',
    description: 'Acionamento',
  },
  {
    key: 'sparkPlugs',
    notesKey: 'sparkPlugsNotes',
    label: 'Vela de Ignição',
    category: 'MECÂNICA',
    description: 'Conferir com 40.000 km (ajustar 0,7mm)',
  },
  {
    key: 'belts',
    notesKey: 'beltsNotes',
    label: 'Correia Dentada/Auxiliar',
    category: 'MECÂNICA',
    description: 'Conferir com 60.000 km (contaminação)',
  },
  {
    key: 'frontShocks',
    notesKey: 'frontShocksNotes',
    label: 'Amortecedor Dianteiro',
    category: 'MECÂNICA',
    description: 'Checar se há vazamento',
  },
  {
    key: 'rearShocks',
    notesKey: 'rearShocksNotes',
    label: 'Amortecedor Traseiro',
    category: 'MECÂNICA',
    description: 'Checar se há vazamento',
  },
  {
    key: 'suspension',
    notesKey: 'suspensionNotes',
    label: 'Suspensão',
    category: 'MECÂNICA',
    description: 'Checar terminal/articulação/bucha/rolamento',
  },

  // FLUIDOS
  {
    key: 'fluids',
    notesKey: 'fluidsNotes',
    label: 'Fluidos',
    category: 'FLUIDOS',
    description: 'Verificar níveis',
  },

  // PNEU/FREIOS
  {
    key: 'tires',
    notesKey: 'tiresNotes',
    label: 'Pneus',
    category: 'PNEU/FREIOS',
    description: 'Calibragem',
  },
  {
    key: 'brakePads',
    notesKey: 'brakePadsNotes',
    label: 'Pastilha de Freio',
    category: 'PNEU/FREIOS',
    description: 'Medir com calabre de inspeção (4mm)',
  },
  {
    key: 'brakeDiscs',
    notesKey: 'brakeDiscsNotes',
    label: 'Disco de Freio',
    category: 'PNEU/FREIOS',
    description: 'Medir com paquímetro o desgaste',
  },

  // MOTOR
  {
    key: 'engine',
    notesKey: 'engineNotes',
    label: 'Motor',
    category: 'MOTOR',
    description: 'Checar funcionamento/vazamento (carter)',
  },
  {
    key: 'radiator',
    notesKey: 'radiatorNotes',
    label: 'Radiador (Arrefecimento)',
    category: 'MOTOR',
    description: 'Verificar vazamentos inferiores',
  },
  {
    key: 'steeringBox',
    notesKey: 'steeringBoxNotes',
    label: 'Caixa de Direção',
    category: 'MOTOR',
    description: 'Verificar folga e vazamento',
  },
  {
    key: 'electricSteeringBox',
    notesKey: 'electricSteeringBoxNotes',
    label: 'Caixa Direção Elétrica',
    category: 'MOTOR',
    description: 'Verificar folga',
  },
  {
    key: 'exhaust',
    notesKey: 'exhaustNotes',
    label: 'Sistema de Escape',
    category: 'MOTOR',
    description: 'Checar vazamento/sinistros/alinhamento',
  },

  // AR CONDICIONADO
  {
    key: 'airConditioning',
    notesKey: 'airConditioningNotes',
    label: 'Ar Condicionado',
    category: 'AR CONDICIONADO',
    description: 'Checar se está congelando',
  },
  {
    key: 'airConditioningCompressor',
    notesKey: 'airConditioningCompressorNotes',
    label: 'Compressor Ar Condicionado',
    category: 'AR CONDICIONADO',
    description: 'Checar se está atracando',
  },
  {
    key: 'airConditioningCleaning',
    notesKey: 'airConditioningCleaningNotes',
    label: 'Limpeza Ar Condicionado',
    category: 'AR CONDICIONADO',
    description: 'Checar fluxo de ar (filtro de cabine)',
  },

  // ELÉTRICA
  {
    key: 'electricalActuationGlass',
    notesKey: 'electricalActuationGlassNotes',
    label: 'VIDRO',
    category: 'ELÉTRICA',
    description: 'Acionamento elétrico dos vidros',
  },
  {
    key: 'electricalActuationMirror',
    notesKey: 'electricalActuationMirrorNotes',
    label: 'RETROVISOR',
    category: 'ELÉTRICA',
    description: 'Acionamento elétrico dos retrovisores',
  },
  {
    key: 'electricalActuationSocket',
    notesKey: 'electricalActuationSocketNotes',
    label: 'TOMADA 12V',
    category: 'ELÉTRICA',
    description: 'Funcionamento da tomada 12V',
  },
  {
    key: 'electricalActuationLock',
    notesKey: 'electricalActuationLockNotes',
    label: 'TRAVA',
    category: 'ELÉTRICA',
    description: 'Sistema de travamento elétrico',
  },
  {
    key: 'electricalActuationTrunk',
    notesKey: 'electricalActuationTrunkNotes',
    label: 'PORTA MALA',
    category: 'ELÉTRICA',
    description: 'Acionamento elétrico do porta malas',
  },
  {
    key: 'electricalActuationWiper',
    notesKey: 'electricalActuationWiperNotes',
    label: 'LIMPADOR',
    category: 'ELÉTRICA',
    description: 'Sistema de limpadores de para-brisa',
  },
  {
    key: 'electricalActuationKey',
    notesKey: 'electricalActuationKeyNotes',
    label: 'CHAVE',
    category: 'ELÉTRICA',
    description: 'Funcionamento da chave/canivete',
  },
  {
    key: 'electricalActuationAlarm',
    notesKey: 'electricalActuationAlarmNotes',
    label: 'ALARME',
    category: 'ELÉTRICA',
    description: 'Sistema de alarme',
  },
  {
    key: 'electricalActuationInteriorLight',
    notesKey: 'electricalActuationInteriorLightNotes',
    label: 'LUZ INTERNA',
    category: 'ELÉTRICA',
    description: 'Iluminação interna do veículo',
  },
  {
    key: 'dashboardPanel',
    notesKey: 'dashboardPanelNotes',
    label: 'Painel de Instrumentos',
    category: 'ELÉTRICA',
    description: 'Checar luzes do painel',
  },
  {
    key: 'lights',
    notesKey: 'lightsNotes',
    label: 'Lâmpadas',
    category: 'ELÉTRICA',
    description: 'Checar funcionamento',
  },

  // BATERIA
  {
    key: 'battery',
    notesKey: 'batteryNotes',
    label: 'Bateria',
    category: 'BATERIA',
    description: 'Verificar carga e estado',
  },
];

const SpecialistInspectionGroups: React.FC<Props> = ({ values, onChange }) => {
  const getStatusLabel = (status: InspectionStatus) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'attention':
        return 'NOK';
      case 'critical':
        return 'NOK';
      default:
        return '';
    }
  };

  // Agrupar itens por categoria
  const groupedItems = inspectionItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, InspectionItem[]>
  );

  return (
    <div className={styles.container}>
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className={styles.categoryCard}>
          <h3 className={styles.categoryTitle}>{category}</h3>

          <div className={styles.itemsGrid}>
            {items.map(item => (
              <div key={item.key} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemTitle}>{item.label}</h4>
                    {item.description && (
                      <p className={styles.itemDescription}>{item.description}</p>
                    )}
                  </div>

                  <span
                    className={`${styles.statusBadge} ${styles[`status${values[item.key].charAt(0).toUpperCase() + values[item.key].slice(1)}`]}`}
                  >
                    {getStatusLabel(values[item.key])}
                  </span>
                </div>

                <div className={styles.itemContent}>
                  <div className={styles.radioGroup}>
                    <label
                      className={`${styles.radioLabel} ${values[item.key] === 'ok' ? styles.radioLabelOk : ''}`}
                    >
                      <input
                        type="radio"
                        name={item.key}
                        value="ok"
                        checked={values[item.key] === 'ok'}
                        onChange={() => onChange(item.key, 'ok')}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioText}>OK</span>
                    </label>

                    <label
                      className={`${styles.radioLabel} ${values[item.key] === 'attention' || values[item.key] === 'critical' ? styles.radioLabelNok : ''}`}
                    >
                      <input
                        type="radio"
                        name={`${item.key}_nok`}
                        value="nok"
                        checked={
                          values[item.key] === 'attention' || values[item.key] === 'critical'
                        }
                        onChange={() => onChange(item.key, 'attention')}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioText}>NOK</span>
                    </label>
                  </div>

                  <div className={styles.notesSection}>
                    <label className={styles.notesLabel}>Observações</label>
                    <textarea
                      value={values[item.notesKey]}
                      onChange={e => onChange(item.notesKey, e.target.value)}
                      placeholder="Digite observações (opcional)"
                      className={styles.notesTextarea}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpecialistInspectionGroups;
