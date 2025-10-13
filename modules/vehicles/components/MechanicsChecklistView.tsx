'use client';

import React from 'react';
import styles from './ChecklistViewer.module.css';

interface ChecklistItem {
  id: string;
  item_key: string;
  item_status: string;
  item_notes: string | null;
  evidences: Array<{
    id: string;
    media_url: string;
    description: string;
  }>;
}

interface MechanicsChecklistData {
  type: 'mechanics';
  checklist: {
    id: string;
    vehicle_id: string;
    partner: {
      id: string;
      name: string;
      type: string;
    };
    status: string;
    notes: string;
    created_at: string;
  };
  itemsByCategory: Record<string, ChecklistItem[]>;
  stats: {
    totalItems: number;
  };
}

interface MechanicsChecklistViewProps {
  data: MechanicsChecklistData;
}

// Helper para traduzir item_key para nome legível
const getItemName = (itemKey: string): string => {
  const names: Record<string, string> = {
    engineOil: 'Óleo do Motor',
    oilFilter: 'Filtro de Óleo',
    airFilter: 'Filtro de Ar',
    fuelFilter: 'Filtro de Combustível',
    sparkPlugs: 'Velas de Ignição',
    belts: 'Correias',
    radiator: 'Radiador',
    battery: 'Bateria',
    clutch: 'Embreagem',
    gearbox: 'Caixa de Câmbio',
    shockAbsorbers: 'Amortecedores',
    springs: 'Molas',
    ballJoints: 'Pivôs/Terminais',
    brakePads: 'Pastilhas de Freio',
    brakeDiscs: 'Discos de Freio',
    brakeFluid: 'Fluido de Freio',
    steeringWheel: 'Volante/Direção',
    powerSteering: 'Direção Hidráulica',
    tires: 'Pneus',
    tireAlignment: 'Alinhamento',
    lights: 'Iluminação',
    wipers: 'Limpadores de Parabrisa',
    horn: 'Buzina',
    exhaust: 'Escapamento',
    bodywork: 'Carroceria',
  };

  return names[itemKey] || itemKey;
};

export const MechanicsChecklistView: React.FC<MechanicsChecklistViewProps> = ({ data }) => {
  return (
    <>
      {/* Header com informações do checklist */}
      <div className={styles.summary}>
        <p>
          <strong>Parceiro:</strong> {data.checklist.partner?.name}
        </p>
        <p>
          <strong>Data:</strong> {new Date(data.checklist.created_at).toLocaleDateString('pt-BR')}
        </p>
        {data.checklist.notes && (
          <p>
            <strong>Observações Gerais:</strong> {data.checklist.notes}
          </p>
        )}
      </div>

      {/* Itens agrupados por categoria */}
      {Object.entries(data.itemsByCategory).map(([category, items]) => (
        <div key={category} className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>{category}</h3>

          {items.map(item => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{getItemName(item.item_key)}</span>
                <span
                  className={`${styles.itemStatus} ${item.item_status === 'ok' ? styles.ok : styles.nok}`}
                >
                  {item.item_status === 'ok' ? '✅ OK' : '❌ NOK'}
                </span>
              </div>

              {item.item_notes && <p className={styles.itemNotes}>{item.item_notes}</p>}

              {item.evidences.length > 0 && (
                <div className={styles.evidencesGrid}>
                  {item.evidences.map(evidence => (
                    <div key={evidence.id} className={styles.evidenceItem}>
                      <img
                        src={evidence.media_url}
                        alt={evidence.description || 'Evidência'}
                        className={styles.evidenceImage}
                        onClick={() => window.open(evidence.media_url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Stats */}
      <div className={styles.stats}>
        <p>Total de itens verificados: {data.stats.totalItems}</p>
      </div>
    </>
  );
};
