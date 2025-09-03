'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Modal from '@/modules/common/components/Modal';
import styles from './VehicleChecklistModal.module.css';
import { useToast } from '@/modules/common/components/ToastProvider';
import { supabase } from '@/modules/common/services/supabaseClient';

interface VehicleInfo {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year?: number;
  color?: string;
}

interface PartnerVehicleChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleInfo | null;
  quoteId: string;
  partnerCategory?: string;
  onSaved?: () => void;
}

const PartnerVehicleChecklistModal: React.FC<PartnerVehicleChecklistModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  quoteId,
  partnerCategory = '',
  onSaved,
}) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Checklist items baseados no arquivo CHECK LIST.xlsx
  const [checklistItems, setChecklistItems] = useState({
    // Inspeção Visual
    visualInspection: {
      exteriorBodywork: false,
      interiorCondition: false,
      tiresCondition: false,
      windowsCondition: false,
      lightsCondition: false,
    },
    // Sistema Elétrico
    electricalSystem: {
      batteryCharge: false,
      alternatorFunction: false,
      starterMotor: false,
      electricalWiring: false,
      fusesAndRelays: false,
    },
    // Sistema de Freios
    brakeSystem: {
      brakePads: false,
      brakeDiscs: false,
      brakeFluid: false,
      brakeLines: false,
      handbrake: false,
    },
    // Sistema de Suspensão
    suspensionSystem: {
      shockAbsorbers: false,
      springs: false,
      armsAndJoints: false,
      stabilizerBar: false,
      wheelAlignment: false,
    },
    // Sistema de Direção
    steeringSystem: {
      steeringBox: false,
      tieRods: false,
      steeringColumn: false,
      powerSteering: false,
    },
    // Sistema de Transmissão
    transmissionSystem: {
      clutchSystem: false,
      gearbox: false,
      driveshaft: false,
      differential: false,
    },
    // Sistema de Arrefecimento
    coolingSystem: {
      radiator: false,
      waterPump: false,
      thermostat: false,
      coolantLevel: false,
      hosesAndBelts: false,
    },
    // Sistema de Combustível
    fuelSystem: {
      fuelPump: false,
      fuelFilter: false,
      fuelLines: false,
      fuelTank: false,
      fuelInjector: false,
    },
    // Motor
    engine: {
      oilLevel: false,
      oilFilter: false,
      airFilter: false,
      sparkPlugs: false,
      timingBelt: false,
      engineMounts: false,
    },
    // Observações
    observations: '',
  });

  const title = useMemo(() => {
    if (!vehicle) return 'Checklist do Veículo';
    return `Checklist • ${vehicle.brand} ${vehicle.model} • ${vehicle.plate}`;
  }, [vehicle]);

  const handleClose = () => {
    setSaving(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleChecklistChange = (category: string, item: string, checked: boolean) => {
    setChecklistItems(prev => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof typeof prev] as Record<string, boolean>),
        [item]: checked,
      },
    }));
  };

  const handleObservationsChange = (observations: string) => {
    setChecklistItems(prev => ({
      ...prev,
      observations,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      // Salvar checklist no banco
      const payload = {
        quoteId,
        vehicleId: vehicle?.id,
        checklistData: checklistItems,
        completedAt: new Date().toISOString(),
      };

      const resp = await fetch('/api/partner/save-vehicle-checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao salvar checklist');
      }

      setSuccess('Checklist salvo com sucesso.');
      showToast('success', 'Checklist salvo com sucesso.');
      try {
        onSaved && onSaved();
      } catch {}
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar checklist.';
      setError(msg);
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const renderChecklistSection = useCallback(
    (title: string, items: Record<string, boolean>, category: string) => (
      <div key={`section-${category}`} className={styles.group}>
        <h4 className={styles.groupTitle}>{title}</h4>
        <div className={styles.grid}>
          {Object.entries(items).map(([key, checked]) => (
            <div key={`${category}-${key}`} className={styles.field}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  name={`${category}-${key}`}
                  checked={checked}
                  onChange={e => handleChecklistChange(category, key, e.target.checked)}
                  disabled={saving}
                />
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            </div>
          ))}
        </div>
      </div>
    ),
    [saving]
  );

  const renderChecklistContent = useMemo(() => {
    // Para mecânicos, mostra o checklist completo
    if (partnerCategory === 'mecânica') {
      return (
        <div key="mechanics-content" className={styles.content}>
          <div className={styles.vehicleHeader}>
            {vehicle && (
              <React.Fragment key="vehicle-info">
                <div>
                  Veículo: {vehicle.brand} {vehicle.model} {vehicle.year ? `• ${vehicle.year}` : ''}
                </div>
                <div>Placa: {vehicle.plate}</div>
                {vehicle.color && <div>Cor: {vehicle.color}</div>}
              </React.Fragment>
            )}
          </div>

          {renderChecklistSection(
            'Inspeção Visual',
            checklistItems.visualInspection,
            'visualInspection'
          )}
          {renderChecklistSection(
            'Sistema Elétrico',
            checklistItems.electricalSystem,
            'electricalSystem'
          )}
          {renderChecklistSection('Sistema de Freios', checklistItems.brakeSystem, 'brakeSystem')}
          {renderChecklistSection(
            'Sistema de Suspensão',
            checklistItems.suspensionSystem,
            'suspensionSystem'
          )}
          {renderChecklistSection(
            'Sistema de Direção',
            checklistItems.steeringSystem,
            'steeringSystem'
          )}
          {renderChecklistSection(
            'Sistema de Transmissão',
            checklistItems.transmissionSystem,
            'transmissionSystem'
          )}
          {renderChecklistSection(
            'Sistema de Arrefecimento',
            checklistItems.coolingSystem,
            'coolingSystem'
          )}
          {renderChecklistSection(
            'Sistema de Combustível',
            checklistItems.fuelSystem,
            'fuelSystem'
          )}
          {renderChecklistSection('Motor', checklistItems.engine, 'engine')}

          <div key="observations-section" className={styles.group}>
            <h4 className={styles.groupTitle}>Observações</h4>
            <textarea
              className={styles.textarea}
              value={checklistItems.observations}
              onChange={e => handleObservationsChange(e.target.value)}
              placeholder="Digite suas observações sobre o veículo..."
              rows={4}
              disabled={saving}
            />
          </div>

          {error && (
            <div key="error-message" className={styles.error}>
              {error}
            </div>
          )}
          {success && (
            <div key="success-message" className={styles.success}>
              {success}
            </div>
          )}
        </div>
      );
    }

    // Para outras categorias, mostra mensagem temporária
    return (
      <div key="placeholder-content" className={styles.content}>
        <div
          key="placeholder-message"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666',
            fontSize: '16px',
          }}
        >
          <h3 key="placeholder-title" style={{ marginBottom: '20px', color: '#333' }}>
            Checklist - {partnerCategory.charAt(0).toUpperCase() + partnerCategory.slice(1)}
          </h3>
          <p key="placeholder-text" style={{ marginBottom: '20px', fontSize: '18px' }}>
            🔧 O checklist será exibido aqui
          </p>
          <p key="placeholder-subtitle" style={{ fontSize: '14px', color: '#888' }}>
            Em desenvolvimento - Checklist específico para categoria "{partnerCategory}"
          </p>
        </div>
      </div>
    );
  }, [partnerCategory, vehicle, checklistItems, error, success, saving]);

  if (!isOpen || !vehicle) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form
        className={styles.container}
        onSubmit={partnerCategory === 'mecânica' ? handleSubmit : e => e.preventDefault()}
      >
        {renderChecklistContent}

        <div key="actions-footer" className={`${styles.actions} ${styles.actionsFooter}`}>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleClose}
            disabled={saving}
          >
            Fechar
          </button>
          {partnerCategory === 'mecânica' && (
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar checklist'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default PartnerVehicleChecklistModal;
