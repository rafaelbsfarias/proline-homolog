'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSpecialistChecklist } from '@/modules/specialist/hooks/useSpecialistChecklist';
import SpecialistInspectionGroups from '@/modules/specialist/components/checklist/SpecialistInspectionGroups';
import { Loading } from '@/modules/common/components/Loading/Loading';
import InspectionData from '@/modules/partner/components/InspectionData';

const ChecklistPage = () => {
  const router = useRouter();
  const { form, vehicle, loading, saving, error, success, setField, saveChecklist } =
    useSpecialistChecklist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveChecklist();
    } catch {
      // Error já tratado no hook
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
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
            Checklist do Veículo
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <form onSubmit={handleSubmit}>
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
              Grupos de Inspeção
            </h2>

            <SpecialistInspectionGroups
              values={{
                clutch: form.clutch,
                sparkPlugs: form.sparkPlugs,
                belts: form.belts,
                radiator: form.radiator,
                frontShocks: form.frontShocks,
                rearShocks: form.rearShocks,
                suspension: form.suspension,
                tires: form.tires,
                brakePads: form.brakePads,
                brakeDiscs: form.brakeDiscs,
                engine: form.engine,
                steeringBox: form.steeringBox,
                electricSteeringBox: form.electricSteeringBox,
                exhaust: form.exhaust,
                fluids: form.fluids,
                airConditioning: form.airConditioning,
                airConditioningCompressor: form.airConditioningCompressor,
                airConditioningCleaning: form.airConditioningCleaning,
                electricalActuationGlass: form.electricalActuationGlass,
                electricalActuationGlassNotes: form.electricalActuationGlassNotes,
                electricalActuationMirror: form.electricalActuationMirror,
                electricalActuationMirrorNotes: form.electricalActuationMirrorNotes,
                electricalActuationSocket: form.electricalActuationSocket,
                electricalActuationSocketNotes: form.electricalActuationSocketNotes,
                electricalActuationLock: form.electricalActuationLock,
                electricalActuationLockNotes: form.electricalActuationLockNotes,
                electricalActuationTrunk: form.electricalActuationTrunk,
                electricalActuationTrunkNotes: form.electricalActuationTrunkNotes,
                electricalActuationWiper: form.electricalActuationWiper,
                electricalActuationWiperNotes: form.electricalActuationWiperNotes,
                electricalActuationKey: form.electricalActuationKey,
                electricalActuationKeyNotes: form.electricalActuationKeyNotes,
                electricalActuationAlarm: form.electricalActuationAlarm,
                electricalActuationAlarmNotes: form.electricalActuationAlarmNotes,
                electricalActuationInteriorLight: form.electricalActuationInteriorLight,
                electricalActuationInteriorLightNotes: form.electricalActuationInteriorLightNotes,
                dashboardPanel: form.dashboardPanel,
                lights: form.lights,
                battery: form.battery,
                clutchNotes: form.clutchNotes,
                sparkPlugsNotes: form.sparkPlugsNotes,
                beltsNotes: form.beltsNotes,
                radiatorNotes: form.radiatorNotes,
                frontShocksNotes: form.frontShocksNotes,
                rearShocksNotes: form.rearShocksNotes,
                suspensionNotes: form.suspensionNotes,
                tiresNotes: form.tiresNotes,
                brakePadsNotes: form.brakePadsNotes,
                brakeDiscsNotes: form.brakeDiscsNotes,
                engineNotes: form.engineNotes,
                steeringBoxNotes: form.steeringBoxNotes,
                electricSteeringBoxNotes: form.electricSteeringBoxNotes,
                exhaustNotes: form.exhaustNotes,
                fluidsNotes: form.fluidsNotes,
                airConditioningNotes: form.airConditioningNotes,
                airConditioningCompressorNotes: form.airConditioningCompressorNotes,
                airConditioningCleaningNotes: form.airConditioningCleaningNotes,
                dashboardPanelNotes: form.dashboardPanelNotes,
                lightsNotes: form.lightsNotes,
                batteryNotes: form.batteryNotes,
              }}
              onChange={(name, value) => setField(name, value)}
            />
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
                type="submit"
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
                {saving ? 'Salvando...' : 'Salvar Checklist'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChecklistPage;
