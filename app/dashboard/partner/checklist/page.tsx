'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePartnerChecklist } from '@/modules/partner/hooks/usePartnerChecklist';
import { PartnerInspectionGroups } from '@/modules/partner/components/PartnerInspectionGroups';
import { Loading } from '@/modules/common/components/Loading/Loading';
import InspectionData from '@/modules/partner/components/InspectionData';

const ChecklistPage = () => {
  const router = useRouter();
  const {
    form,
    vehicle,
    inspection,
    loading,
    saving,
    error,
    vehicleLoading,
    vehicleError,
    loadChecklist,
    updateChecklistItem,
    saveChecklist,
    submitChecklist,
    canSubmit,
    hasUnsavedChanges,
  } = usePartnerChecklist();

  // Carregar checklist quando inspeção estiver disponível
  useEffect(() => {
    if (inspection?.id && !form) {
      loadChecklist();
    }
  }, [inspection?.id, form, loadChecklist]);

  const handleSave = async () => {
    try {
      await saveChecklist();
    } catch {
      // Error já tratado no hook
    }
  };

  const handleSubmit = async () => {
    try {
      await submitChecklist();
    } catch {
      // Error já tratado no hook
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading || vehicleLoading) {
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

  if (vehicleError || !vehicle) {
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
        <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>
          {vehicleError || 'Veículo não encontrado'}
        </h1>
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
            Checklist do Veículo
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

        {/* Inspection Basic Data */}
        {form && (
          <InspectionData
            inspectionDate={form.date}
            odometer={form.odometer}
            fuelLevel={form.fuelLevel}
            observations={form.observations}
          />
        )}

        {/* Checklist Form */}
        {form && (
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
                marginBottom: '20px',
              }}
            >
              Checklist de Inspeção
            </h2>

            <PartnerInspectionGroups
              form={form}
              onUpdateItem={updateChecklistItem}
              disabled={saving || form.status === 'submitted' || form.status === 'completed'}
            />
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

        {/* Actions */}
        {form && (
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
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {hasUnsavedChanges && (
                  <span style={{ color: '#f59e0b' }}>⚠️ Você tem alterações não salvas</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
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
                  Voltar
                </button>

                {form.status !== 'submitted' && form.status !== 'completed' && (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !hasUnsavedChanges}
                      style={{
                        padding: '12px 24px',
                        background: hasUnsavedChanges ? '#3b82f6' : '#e5e7eb',
                        color: hasUnsavedChanges ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: saving || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? 'Salvando...' : 'Salvar Rascunho'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving || !canSubmit}
                      style={{
                        padding: '12px 24px',
                        background: canSubmit ? '#10b981' : '#e5e7eb',
                        color: canSubmit ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: saving || !canSubmit ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? 'Enviando...' : 'Enviar Checklist'}
                    </button>
                  </>
                )}

                {(form.status === 'submitted' || form.status === 'completed') && (
                  <div
                    style={{
                      padding: '12px 24px',
                      color: '#10b981',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                  >
                    {form.status === 'submitted'
                      ? '✓ Checklist enviado para revisão'
                      : '✓ Checklist concluído'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistPage;
