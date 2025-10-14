'use client';

import React, { useState } from 'react';
import { formatDateBR } from '@/modules/client/utils/date';
import { ImageLightbox } from './ImageLightbox';
import styles from './ChecklistReadOnlyViewer.module.css';

interface AnomalyEvidence {
  id: string;
  description: string;
  photos: string[];
  partRequest?: {
    partName: string;
    partDescription?: string;
    quantity: number;
    estimatedPrice?: number;
  };
}

interface ChecklistItem {
  key: string;
  label: string;
  type: 'checkbox' | 'text' | 'number' | 'photo';
  value?: string | boolean | number;
  photoUrls?: string[];
  category?: string;
}

interface ChecklistData {
  items: ChecklistItem[];
  anomalies?: AnomalyEvidence[];
  category?: string;
  savedAt?: string;
}

interface ChecklistReadOnlyViewerProps {
  data: ChecklistData;
  onClose: () => void;
  partnerCategory?: string;
}

const ChecklistReadOnlyViewer: React.FC<ChecklistReadOnlyViewerProps> = ({
  data,
  onClose,
  partnerCategory,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxStartIndex(startIndex);
    setLightboxOpen(true);
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              Vistoria {partnerCategory && `- ${partnerCategory}`}
            </h2>
            {data.savedAt && (
              <p className={styles.modalSubtitle}>Salvo em: {formatDateBR(data.savedAt)}</p>
            )}
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Itens do Checklist */}
          {data.items && data.items.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Itens Verificados</h3>
              <div className={styles.itemsGrid}>
                {data.items.map(item => (
                  <div key={item.key} className={styles.checklistItem}>
                    <div className={styles.itemLabel}>{item.label}</div>

                    {item.type === 'checkbox' && (
                      <div className={styles.itemValue}>
                        {item.value ? (
                          <span className={styles.checkboxChecked}>✓ Verificado</span>
                        ) : (
                          <span className={styles.checkboxUnchecked}>✗ Não verificado</span>
                        )}
                      </div>
                    )}

                    {item.type === 'text' && (
                      <div className={styles.itemValue}>{item.value || 'N/A'}</div>
                    )}

                    {item.type === 'number' && (
                      <div className={styles.itemValue}>{item.value || 'N/A'}</div>
                    )}

                    {item.type === 'photo' && item.photoUrls && item.photoUrls.length > 0 && (
                      <div className={styles.photosGrid}>
                        {item.photoUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`${item.label} - Foto ${idx + 1}`}
                            className={styles.photoThumbnail}
                            onClick={() => openLightbox(item.photoUrls || [], idx)}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomalias Encontradas */}
          {data.anomalies && data.anomalies.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Anomalias Encontradas</h3>
              <div className={styles.anomaliesContainer}>
                {data.anomalies.map((anomaly, index) => (
                  <div key={anomaly.id} className={styles.anomalyCard}>
                    <div className={styles.anomalyHeader}>
                      <span className={styles.anomalyNumber}>Anomalia #{index + 1}</span>
                    </div>

                    <div className={styles.anomalyDescription}>
                      <strong>Descrição:</strong>
                      <p>{anomaly.description || 'Sem descrição'}</p>
                    </div>

                    {anomaly.photos && anomaly.photos.length > 0 && (
                      <div className={styles.anomalyPhotos}>
                        <strong>Evidências ({anomaly.photos.length}):</strong>
                        <div className={styles.photosGrid}>
                          {anomaly.photos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Anomalia ${index + 1} - Foto ${idx + 1}`}
                              className={styles.photoThumbnail}
                              onClick={() => openLightbox(anomaly.photos, idx)}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {anomaly.partRequest && (
                      <div className={styles.partRequest}>
                        <strong>📦 Solicitação de Peça:</strong>
                        <div className={styles.partRequestDetails}>
                          <div className={styles.partRequestRow}>
                            <span>Peça:</span>
                            <span className={styles.partRequestValue}>
                              {anomaly.partRequest.partName}
                            </span>
                          </div>
                          {anomaly.partRequest.partDescription && (
                            <div className={styles.partRequestRow}>
                              <span>Descrição:</span>
                              <span className={styles.partRequestValue}>
                                {anomaly.partRequest.partDescription}
                              </span>
                            </div>
                          )}
                          <div className={styles.partRequestRow}>
                            <span>Quantidade:</span>
                            <span className={styles.partRequestValue}>
                              {anomaly.partRequest.quantity}
                            </span>
                          </div>
                          {anomaly.partRequest.estimatedPrice && (
                            <div className={styles.partRequestRow}>
                              <span>Preço Estimado:</span>
                              <span className={styles.partRequestValue}>
                                {formatCurrency(anomaly.partRequest.estimatedPrice)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeFooterButton}>
            Fechar
          </button>
        </div>
      </div>

      {/* Lightbox para visualizar imagens em tamanho grande */}
      {lightboxOpen && (
        <ImageLightbox
          isOpen={lightboxOpen}
          images={lightboxImages}
          startIndex={lightboxStartIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default ChecklistReadOnlyViewer;
