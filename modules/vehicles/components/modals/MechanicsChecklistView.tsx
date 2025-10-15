'use client';

//import React, { useState } from 'react';
import React from 'react';
import { useLightbox } from '@/modules/vehicles/hooks/useLightbox';
import { ImageLightbox } from './ImageLightbox';
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
  part_request?: {
    partName: string;
    partDescription?: string;
    quantity: number;
    estimatedPrice?: number;
  };
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
    // Itens adicionais comuns reportados em inglês
    airConditioningCleaning: 'Higienização do Ar-Condicionado',
    airConditioningFilter: 'Filtro do Ar-Condicionado',
    airConditioningGas: 'Gás do Ar-Condicionado',
    airConditioningCompressor: 'Compressor do Ar-Condicionado',
    engine: 'Motor',
    transmission: 'Transmissão',
    brakes: 'Freios',
    suspension: 'Suspensão',
    steering: 'Direção',
    electrical: 'Elétrica',
    cooling: 'Arrefecimento',
    // Itens solicitados
    steeringBox: 'Caixa de Direção',
    SteeringBox: 'Caixa de Direção',
    electricSteeringBox: 'Caixa de Direção Elétrica',
    electricalActuationMirror: 'Acionamento Elétrico - Retrovisor',
    electricalActuationSocket: 'Acionamento Elétrico - Tomada',
    electricalActuationLock: 'Acionamento Elétrico - Trava',
    electricalActuationTrunk: 'Acionamento Elétrico - Porta-malas',
    electricalActuationWiper: 'Acionamento Elétrico - Limpador',
    electricalActuationKey: 'Acionamento Elétrico - Chave',
    electricalActuationAlarm: 'Acionamento Elétrico - Alarme',
    electricalActuation: 'Acionamento Elétrico',
    electricalActuationGlass: 'Acionamento Elétrico - Vidro',
    electricalActuationInteriorLight: 'Acionamento Elétrico - Luz Interna',
    InteriorLight: 'Luz Interna',
    frontShocks: 'Amortecedores Dianteiros',
    rearShockselectric: 'Amortecedores Traseiros (Elétrico)',
    rearShocks: 'Amortecedores Traseiros',
    fluids: 'Fluidos',
    airConditioning: 'Ar-Condicionado',
    dashboardPanel: 'Painel de Instrumentos',
  };
  return names[itemKey] || itemKey;
};

// Helper para traduzir categorias para português
const getCategoryLabel = (categoryKey: string): string => {
  const categories: Record<string, string> = {
    engine: 'Motor',
    transmission: 'Transmissão',
    brakes: 'Freios',
    suspension: 'Suspensão',
    steering: 'Direção',
    electrical: 'Elétrica',
    cooling: 'Arrefecimento',
    air_conditioning: 'Ar-Condicionado',
    airConditioning: 'Ar-Condicionado',
    bodywork: 'Carroceria',
    exhaust: 'Escapamento',
    tires: 'Pneus',
    alignment: 'Alinhamento',
    lighting: 'Iluminação',
    wipers: 'Limpadores',
  };
  return categories[categoryKey] || categoryKey;
};

export const MechanicsChecklistView: React.FC<MechanicsChecklistViewProps> = ({ data }) => {
  //const [lightboxOpen, setLightboxOpen] = useState(false);
  //const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  //const [lightboxIndex, setLightboxIndex] = useState(0);
  //
  //const openLightbox = (images: string[], index: number) => {
  //  setLightboxImages(images);
  //  setLightboxIndex(index);
  //  setLightboxOpen(true);
  //};
  const {
    lightboxOpen,
    lightboxImages,
    lightboxIndex,
    openLightbox,
    closeLightbox,
    setLightboxIndex,
  } = useLightbox();

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
          <h3 className={styles.categoryTitle}>{getCategoryLabel(category)}</h3>

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

              {/* Exibir evidências apenas para itens NOK */}
              {item.item_status === 'nok' &&
                item.evidences &&
                item.evidences.some(e => !!e.media_url) && (
                  <div className={styles.evidencesGrid}>
                    {item.evidences
                      .filter(e => !!e.media_url)
                      .map(evidence => {
                        const images = item.evidences
                          .map(e => e.media_url)
                          .filter((u): u is string => Boolean(u));
                        const imgIndex = images.indexOf(evidence.media_url);
                        return (
                          <div key={evidence.id} className={styles.evidenceItem}>
                            <img
                              src={evidence.media_url || undefined}
                              alt={evidence.description || 'Evidência'}
                              className={styles.evidenceImage}
                              onClick={() => openLightbox(images, imgIndex >= 0 ? imgIndex : 0)}
                            />
                            {evidence.description && (
                              <p className={styles.evidenceDescription}>{evidence.description}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

              {/* Mensagem se NOK mas sem evidências */}
              {item.item_status === 'nok' &&
                (!item.evidences || !item.evidences.some(e => !!e.media_url)) && (
                  <div
                    style={{
                      fontSize: '12px',
                      padding: '8px',
                      background: '#f8d7da',
                      border: '1px solid #f5c6cb',
                      borderRadius: '4px',
                      marginTop: '8px',
                      color: '#721c24',
                    }}
                  >
                    ⚠️ Item marcado como NOK mas sem evidências fotográficas
                  </div>
                )}

              {/* Solicitação de peça quando houver */}
              {item.item_status === 'nok' && item.part_request && (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '2px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '10px',
                  }}
                >
                  <strong style={{ display: 'block', color: '#1e40af', marginBottom: '8px' }}>
                    📦 Solicitação de Peça
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Peça: </span>
                      <span>{item.part_request.partName}</span>
                    </div>
                    {item.part_request.quantity != null && (
                      <div>
                        <span style={{ fontWeight: 600 }}>Quantidade: </span>
                        <span>{item.part_request.quantity}</span>
                      </div>
                    )}
                    {item.part_request.partDescription && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontWeight: 600 }}>Descrição: </span>
                        <span>{item.part_request.partDescription}</span>
                      </div>
                    )}
                    {item.part_request.estimatedPrice != null && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontWeight: 600 }}>Preço Estimado: </span>
                        <span>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.part_request.estimatedPrice)}
                        </span>
                      </div>
                    )}
                  </div>
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

      <ImageLightbox
        isOpen={lightboxOpen}
        images={lightboxImages}
        startIndex={lightboxIndex}
        onClose={closeLightbox}
      />
    </>
  );
};
