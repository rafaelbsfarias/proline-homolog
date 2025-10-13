'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePartnerChecklist } from '@/modules/partner/hooks/usePartnerChecklist';
import { Loading } from '@/modules/common/components/Loading/Loading';
import InspectionData from '@/modules/partner/components/InspectionData';
import { getLogger } from '@/modules/logger';

const logger = getLogger('partner:dynamic-checklist');

interface AnomalyEvidence {
  id: string;
  description: string;
  photos: (File | string)[]; // Pode ser File (novo upload) ou string (URL do banco)
  partRequest?: {
    partName: string;
    partDescription?: string;
    quantity: number;
    estimatedPrice?: number;
  };
}

const DynamicChecklistPage = () => {
  const router = useRouter();
  const {
    form,
    vehicle,
    loading,
    error,
    success,
    saving,
    saveChecklist,
    anomalies,
    saveAnomalies,
  } = usePartnerChecklist();

  // Estado local para edição das anomalias
  const [localAnomalies, setLocalAnomalies] = useState<AnomalyEvidence[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Estado para modal de solicitação de peças
  const [partRequestModal, setPartRequestModal] = useState<{
    isOpen: boolean;
    anomalyId: string | null;
    partName: string;
    partDescription: string;
    quantity: number;
    estimatedPrice: string;
  }>({
    isOpen: false,
    anomalyId: null,
    partName: '',
    partDescription: '',
    quantity: 1,
    estimatedPrice: '',
  });

  // Atualizar estado local quando as anomalias do hook mudarem (somente na primeira carga)
  useEffect(() => {
    // Sincronizar apenas quando carregar pela primeira vez
    if (!hasInitialized && !loading) {
      logger.debug('initializing_anomalies', {
        anomalies_count: anomalies.length,
        has_part_requests: anomalies.some(a => a.partRequest),
        sample_anomaly: anomalies[0],
      });
      setLocalAnomalies(anomalies);
      setHasInitialized(true);
    }
  }, [anomalies, loading, hasInitialized]);
  // saving vem do hook; remove estado local

  const handleBack = () => {
    router.push('/dashboard');
  };

  const addAnomaly = () => {
    const newAnomaly: AnomalyEvidence = {
      id: Date.now().toString(),
      description: '',
      photos: [],
    };
    setLocalAnomalies(prev => [...prev, newAnomaly]);
  };

  const removeAnomaly = (id: string) => {
    setLocalAnomalies(prev => prev.filter(anomaly => anomaly.id !== id));
  };

  const updateAnomalyDescription = (id: string, description: string) => {
    setLocalAnomalies(prev =>
      prev.map(anomaly => (anomaly.id === id ? { ...anomaly, description } : anomaly))
    );
  };

  const updateAnomalyPhotos = (id: string, files: FileList | null) => {
    if (!files) return;

    setLocalAnomalies(prev =>
      prev.map(anomaly => {
        if (anomaly.id === id) {
          // Manter URLs existentes e adicionar novos arquivos
          const existingUrls = anomaly.photos.filter(photo => typeof photo === 'string');
          const newFiles = Array.from(files);
          return { ...anomaly, photos: [...existingUrls, ...newFiles] };
        }
        return anomaly;
      })
    );
  };

  const removePhoto = (anomalyId: string, photoIndex: number) => {
    setLocalAnomalies(prev =>
      prev.map(anomaly => {
        if (anomaly.id === anomalyId) {
          const updatedPhotos = anomaly.photos.filter((_, index) => index !== photoIndex);
          logger.debug('photo_removed', {
            anomaly_id: anomalyId,
            photo_index: photoIndex,
            remaining_photos: updatedPhotos.length,
          });
          return { ...anomaly, photos: updatedPhotos };
        }
        return anomaly;
      })
    );
  };

  const openPartRequestModal = (anomalyId: string) => {
    const anomaly = localAnomalies.find(a => a.id === anomalyId);
    setPartRequestModal({
      isOpen: true,
      anomalyId,
      partName: anomaly?.partRequest?.partName || '',
      partDescription: anomaly?.partRequest?.partDescription || '',
      quantity: anomaly?.partRequest?.quantity || 1,
      estimatedPrice: anomaly?.partRequest?.estimatedPrice?.toString() || '',
    });
  };

  const closePartRequestModal = () => {
    setPartRequestModal({
      isOpen: false,
      anomalyId: null,
      partName: '',
      partDescription: '',
      quantity: 1,
      estimatedPrice: '',
    });
  };

  const savePartRequest = () => {
    if (!partRequestModal.anomalyId || !partRequestModal.partName.trim()) {
      return;
    }

    setLocalAnomalies(prev =>
      prev.map(anomaly =>
        anomaly.id === partRequestModal.anomalyId
          ? {
              ...anomaly,
              partRequest: {
                partName: partRequestModal.partName,
                partDescription: partRequestModal.partDescription,
                quantity: partRequestModal.quantity,
                estimatedPrice: partRequestModal.estimatedPrice
                  ? parseFloat(partRequestModal.estimatedPrice)
                  : undefined,
              },
            }
          : anomaly
      )
    );

    closePartRequestModal();
  };

  const removePartRequest = (anomalyId: string) => {
    setLocalAnomalies(prev =>
      prev.map(anomaly =>
        anomaly.id === anomalyId
          ? {
              ...anomaly,
              partRequest: undefined,
            }
          : anomaly
      )
    );
  };

  const handleSave = async () => {
    try {
      // Opcional: validar se há ao menos uma anomalia descrita
      const hasValidAnomaly = localAnomalies.some(anomaly => anomaly.description.trim() !== '');
      if (!hasValidAnomaly) {
        // Sem anomalias é permitido; checklist técnico ainda pode ser salvo
        // mas poderíamos alertar o usuário caso queira obrigar evidências
      }

      // Persistir checklist técnico para habilitar edição de orçamento
      await saveChecklist();

      // Salvar anomalias
      await saveAnomalies(localAnomalies);

      // Voltar ao dashboard após salvar
      router.push('/dashboard');
    } catch {
      // Erro já é tratado pelo hook
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loading />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Veículo não encontrado</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Não foi possível encontrar o veículo para este orçamento.
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '12px 24px',
            background: '#002e4c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e1e5e9',
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#002e4c',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            ← Voltar ao Dashboard
          </button>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
            }}
          >
            Anomalias do Veículo
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Vehicle Information */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
            }}
          >
            Informações do Veículo
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              fontSize: '16px',
            }}
          >
            <div>
              <strong>Veículo:</strong> {vehicle.brand} {vehicle.model}{' '}
              {vehicle.year ? `(${vehicle.year})` : ''}
            </div>
            <div>
              <strong>Placa:</strong> {vehicle.plate}
            </div>
            {vehicle.color && (
              <div>
                <strong>Cor:</strong> {vehicle.color}
              </div>
            )}
          </div>
        </div>

        {/* Inspection Data */}
        <InspectionData
          inspectionDate={form.date}
          odometer={form.odometer}
          fuelLevel={form.fuelLevel}
          observations={form.observations}
        />

        {/* Anomalies Section */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
              }}
            >
              Evidências e Anomalias {localAnomalies.length > 0 && `(${localAnomalies.length})`}
            </h2>
            <button
              type="button"
              onClick={addAnomaly}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              + Adicionar Anomalia
            </button>
          </div>

          {localAnomalies.length === 0 && (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px dashed #d1d5db',
              }}
            >
              <p style={{ margin: 0, fontSize: '16px' }}>
                Nenhuma anomalia registrada. Clique em &quot;+ Adicionar Anomalia&quot; para
                começar.
              </p>
            </div>
          )}

          {localAnomalies.map((anomaly, index) => (
            <div
              key={anomaly.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px',
                background: '#f8fafc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#374151',
                    margin: 0,
                  }}
                >
                  Anomalia {index + 1}
                </h3>
                {localAnomalies.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAnomaly(anomaly.id)}
                    style={{
                      padding: '4px 8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Descrição da Anomalia *
                </label>
                <textarea
                  value={anomaly.description}
                  onChange={e => updateAnomalyDescription(anomaly.id, e.target.value)}
                  placeholder="Descreva a anomalia encontrada..."
                  required
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Evidências (Fotos)
                </label>

                {/* Exibir imagens já carregadas */}
                {anomaly.photos.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px',
                      }}
                    >
                      Imagens ({anomaly.photos.length}):
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {anomaly.photos.map((photo, photoIndex) => {
                        // Determinar se é uma URL (string) ou File
                        const isFile = photo instanceof File;
                        const isUrl = typeof photo === 'string';

                        // Gerar preview URL
                        let previewUrl = '';
                        if (isFile) {
                          previewUrl = URL.createObjectURL(photo);
                        } else if (isUrl) {
                          previewUrl = photo;
                        }

                        return (
                          <div
                            key={photoIndex}
                            style={{
                              position: 'relative',
                              width: '100px',
                              height: '100px',
                            }}
                          >
                            <img
                              src={previewUrl}
                              alt={`Evidência ${photoIndex + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: isFile ? '2px solid #3b82f6' : '2px solid #10b981',
                              }}
                              onError={e => {
                                logger.error('image_load_error', {
                                  photo_index: photoIndex,
                                  is_file: isFile,
                                  is_url: isUrl,
                                  url: previewUrl.substring(0, 100),
                                });
                                // Exibir placeholder em caso de erro
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {/* Badge indicando tipo */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '4px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isFile ? '#3b82f6' : '#10b981',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                              }}
                            >
                              {isFile ? 'NOVA' : 'SALVA'}
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(anomaly.id, photoIndex)}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                color: 'white',
                                border: '2px solid white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }}
                              title="Remover imagem"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Input para novas fotos */}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => updateAnomalyPhotos(anomaly.id, e.target.files)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: '#ffffff',
                  }}
                />
                <p
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                    marginBottom: 0,
                  }}
                >
                  Você pode enviar múltiplas imagens. Imagens com borda azul são novas, com borda
                  verde já foram salvas.
                </p>
              </div>

              {/* Part Request Section */}
              <div
                style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}
              >
                {anomaly.partRequest ? (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '12px',
                      }}
                    >
                      <h4
                        style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e40af' }}
                      >
                        🔧 Solicitação de Peça
                      </h4>
                      <button
                        type="button"
                        onClick={() => removePartRequest(anomaly.id)}
                        style={{
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Remover
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', color: '#1e3a8a' }}>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Peça:</strong> {anomaly.partRequest.partName}
                      </p>
                      {anomaly.partRequest.partDescription && (
                        <p style={{ margin: '4px 0' }}>
                          <strong>Descrição:</strong> {anomaly.partRequest.partDescription}
                        </p>
                      )}
                      <p style={{ margin: '4px 0' }}>
                        <strong>Quantidade:</strong> {anomaly.partRequest.quantity}
                      </p>
                      {anomaly.partRequest.estimatedPrice && (
                        <p style={{ margin: '4px 0' }}>
                          <strong>Preço Estimado:</strong> R${' '}
                          {anomaly.partRequest.estimatedPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openPartRequestModal(anomaly.id)}
                      style={{
                        marginTop: '12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Editar Solicitação
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openPartRequestModal(anomaly.id)}
                    style={{
                      width: '100%',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    🛒 Solicitar Compra de Peças
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Part Request Modal */}
        {partRequestModal.isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={closePartRequestModal}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                }}
              >
                Solicitar Compra de Peças
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Nome da Peça *
                </label>
                <input
                  type="text"
                  value={partRequestModal.partName}
                  onChange={e =>
                    setPartRequestModal(prev => ({ ...prev, partName: e.target.value }))
                  }
                  placeholder="Ex: Pastilha de freio dianteira"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Descrição (opcional)
                </label>
                <textarea
                  value={partRequestModal.partDescription}
                  onChange={e =>
                    setPartRequestModal(prev => ({ ...prev, partDescription: e.target.value }))
                  }
                  placeholder="Especificações, marca sugerida, etc."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  value={partRequestModal.quantity}
                  onChange={e =>
                    setPartRequestModal(prev => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Preço Estimado (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={partRequestModal.estimatedPrice}
                  onChange={e =>
                    setPartRequestModal(prev => ({ ...prev, estimatedPrice: e.target.value }))
                  }
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closePartRequestModal}
                  style={{
                    padding: '10px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={savePartRequest}
                  disabled={!partRequestModal.partName.trim()}
                  style={{
                    padding: '10px 20px',
                    background: partRequestModal.partName.trim() ? '#10b981' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: partRequestModal.partName.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                  }}
                >
                  Salvar Solicitação
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              color: '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              color: '#16a34a',
            }}
          >
            {success}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                opacity: saving ? 0.6 : 1,
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Anomalias'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicChecklistPage;
