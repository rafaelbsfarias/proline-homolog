'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSpecialistChecklist } from '@/modules/specialist/hooks/useSpecialistChecklist';
import { Loading } from '@/modules/common/components/Loading/Loading';
import InspectionData from '@/modules/partner/components/InspectionData';

interface AnomalyEvidence {
  id: string;
  description: string;
  photos: File[];
}

const DynamicChecklistPage = () => {
  const router = useRouter();
  const { form, vehicle, loading, error, success } = useSpecialistChecklist();
  const [anomalies, setAnomalies] = useState<AnomalyEvidence[]>([
    { id: '1', description: '', photos: [] },
  ]);
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const addAnomaly = () => {
    const newAnomaly: AnomalyEvidence = {
      id: Date.now().toString(),
      description: '',
      photos: [],
    };
    setAnomalies(prev => [...prev, newAnomaly]);
  };

  const removeAnomaly = (id: string) => {
    setAnomalies(prev => prev.filter(anomaly => anomaly.id !== id));
  };

  const updateAnomalyDescription = (id: string, description: string) => {
    setAnomalies(prev =>
      prev.map(anomaly => (anomaly.id === id ? { ...anomaly, description } : anomaly))
    );
  };

  const updateAnomalyPhotos = (id: string, files: FileList | null) => {
    if (!files) return;

    const photosArray = Array.from(files);
    setAnomalies(prev =>
      prev.map(anomaly => (anomaly.id === id ? { ...anomaly, photos: photosArray } : anomaly))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validar se pelo menos uma anomalia tem descrição
      const hasValidAnomaly = anomalies.some(anomaly => anomaly.description.trim() !== '');

      if (!hasValidAnomaly) {
        console.error('Pelo menos uma anomalia deve ter descrição');
        return;
      }

      // Aqui você implementaria a lógica para salvar as anomalias
      // Por enquanto, apenas simula um delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Anomalias salvas:', anomalies);

      // Redirecionar de volta ao dashboard após salvar
      router.push('/dashboard');
    } catch (err) {
      console.error('Erro ao salvar anomalias:', err);
    } finally {
      setSaving(false);
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
              Evidências e Anomalias
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

          {anomalies.map((anomaly, index) => (
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
                {anomalies.length > 1 && (
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
                {anomaly.photos.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#6b7280',
                    }}
                  >
                    {anomaly.photos.length} arquivo(s) selecionado(s)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

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
