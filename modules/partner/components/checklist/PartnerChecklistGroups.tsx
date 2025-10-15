import React, { useMemo, useState } from 'react';
import type { PartnerChecklistForm } from '../../hooks/usePartnerChecklist';
import styles from './PartnerChecklistGroups.module.css';
import { EVIDENCE_KEYS, EvidenceKey } from '../../hooks/usePartnerChecklist';
import Lightbox from '@/modules/common/components/Lightbox/Lightbox';
import { PartRequest } from '@/app/dashboard/partner/dynamic-checklist/types';
import { PartRequestCard } from '@/app/dashboard/partner/dynamic-checklist/components/PartRequestCard';

type InspectionStatus = 'ok' | 'nok';

interface InspectionItem {
  key: keyof Pick<
    PartnerChecklistForm,
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
    PartnerChecklistForm,
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
    PartnerChecklistForm,
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
      PartnerChecklistForm,
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
  evidences: Record<
    EvidenceKey,
    Array<{ file?: File; url?: string | null; id?: string }> | undefined
  >;
  setEvidence: (key: EvidenceKey, file: File) => void;
  removeEvidence: (key: EvidenceKey, evidenceId: string) => void;
  // Solicitação de peça por item (opcional)
  partRequests?: Partial<Record<EvidenceKey, PartRequest | undefined>>;
  onOpenPartRequestModal?: (itemKey: EvidenceKey, existing?: PartRequest) => void;
  onRemovePartRequest?: (itemKey: EvidenceKey) => void;
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

const PartnerChecklistGroups: React.FC<Props> = ({
  values,
  onChange,
  evidences,
  setEvidence,
  removeEvidence,
  partRequests,
  onOpenPartRequestModal,
  onRemovePartRequest,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const evidenceUrls = useMemo(() => {
    const urls: string[] = [];
    EVIDENCE_KEYS.forEach(k => {
      const items = evidences[k] || [];
      items.forEach(item => {
        if (item.url) urls.push(item.url);
      });
    });
    return urls;
  }, [evidences]);

  const openLightboxAt = (url?: string) => {
    if (!evidenceUrls.length) return;
    if (url) {
      const idx = evidenceUrls.indexOf(url);
      setLightboxIndex(idx >= 0 ? idx : 0);
    } else {
      setLightboxIndex(0);
    }
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevLightbox = () =>
    setLightboxIndex(i => (i - 1 + evidenceUrls.length) % evidenceUrls.length);
  const nextLightbox = () => setLightboxIndex(i => (i + 1) % evidenceUrls.length);
  const getStatusLabel = (status: InspectionStatus) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'nok':
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
      {/* Botão geral para visualizar evidências já salvas */}
      {evidenceUrls.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => openLightboxAt()}
            style={{
              padding: '10px 14px',
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Visualizar evidências ({evidenceUrls.length})
          </button>
        </div>
      )}

      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className={styles.categoryCard}>
          <h3 className={styles.categoryTitle}>{category}</h3>
          <div className={styles.itemsGrid}>
            {items.map(item => {
              const evidenceKey = item.key as EvidenceKey;
              return (
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
                        className={`${styles.radioLabel} ${values[item.key] === 'nok' ? styles.radioLabelNok : ''}`}
                      >
                        <input
                          type="radio"
                          name={`${item.key}_nok`}
                          value="nok"
                          checked={values[item.key] === 'nok'}
                          onChange={() => onChange(item.key, 'nok')}
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

                    {/* Solicitação de Peças */}
                    <div style={{ marginTop: 12 }}>
                      <PartRequestCard
                        partRequest={partRequests?.[evidenceKey]}
                        onAdd={() =>
                          onOpenPartRequestModal?.(evidenceKey, partRequests?.[evidenceKey])
                        }
                        onEdit={() =>
                          onOpenPartRequestModal?.(evidenceKey, partRequests?.[evidenceKey])
                        }
                        onRemove={() => onRemovePartRequest?.(evidenceKey)}
                      />
                    </div>
                    {/* Campo de evidências (múltiplas imagens) */}
                    <div className={styles.evidenceSection} style={{ marginTop: 12 }}>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Evidências (imagens)
                      </label>

                      {/* Grid de thumbnails existentes */}
                      {evidences[evidenceKey] && evidences[evidenceKey]!.length > 0 && (
                        <div className={styles.evidenceGrid}>
                          {evidences[evidenceKey]!.map(ev => (
                            <div key={ev.id} className={styles.evidenceItem}>
                              <div className={styles.thumbnailWrapper}>
                                <img
                                  src={ev.url || (ev.file ? URL.createObjectURL(ev.file) : '')}
                                  alt="Evidência"
                                  className={styles.thumbnail}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeEvidence(evidenceKey, ev.id!)}
                                  className={styles.removeButton}
                                  aria-label="Remover evidência"
                                >
                                  ×
                                </button>
                              </div>
                              <span className={styles.fileName}>
                                {ev.file?.name || 'evidencia.jpg'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input para adicionar nova imagem */}
                      <input
                        id={`evidence-${item.key}`}
                        type="file"
                        accept="image/*"
                        {...({
                          capture: 'environment',
                        } as React.InputHTMLAttributes<HTMLInputElement>)}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEvidence(evidenceKey, file);
                            e.target.value = ''; // Reset para permitir adicionar a mesma imagem novamente
                          }
                        }}
                        disabled={false}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {/* Lightbox com navegação */}
      {lightboxOpen && (
        <Lightbox
          urls={evidenceUrls}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevLightbox}
          onNext={nextLightbox}
        />
      )}
    </div>
  );
};

export default PartnerChecklistGroups;
