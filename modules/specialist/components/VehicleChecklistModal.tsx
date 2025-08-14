'use client';

import React, { useMemo, useState } from 'react';
import Modal from '@/modules/common/components/Modal';
import styles from './VehicleChecklistModal.module.css';
import { useToast } from '@/modules/common/components/ToastProvider';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';

export type ChecklistStatus = 'ok' | 'attention' | 'critical';

export interface VehicleInfo {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
}

interface VehicleChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleInfo | null;
}

interface ChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  exterior: ChecklistStatus;
  interior: ChecklistStatus;
  tires: ChecklistStatus;
  brakes: ChecklistStatus;
  lights: ChecklistStatus;
  fluids: ChecklistStatus;
  engine: ChecklistStatus;
  suspension: ChecklistStatus;
  battery: ChecklistStatus;
  observations: string;
}

const defaultForm = (today: string): ChecklistForm => ({
  date: today,
  odometer: '',
  fuelLevel: 'half',
  exterior: 'ok',
  interior: 'ok',
  tires: 'ok',
  brakes: 'ok',
  lights: 'ok',
  fluids: 'ok',
  engine: 'ok',
  suspension: 'ok',
  battery: 'ok',
  observations: '',
});

function formatDateYYYYMMDD(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const STORAGE_PREFIX = 'vehicle_checklists:';

const VehicleChecklistModal: React.FC<VehicleChecklistModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<ChecklistForm>(defaultForm(formatDateYYYYMMDD()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const title = useMemo(() => {
    if (!vehicle) return 'Checklist do Veículo';
    return `Checklist • ${vehicle.brand} ${vehicle.model} • ${vehicle.plate}`;
  }, [vehicle]);

  const handleClose = () => {
    setForm(defaultForm(formatDateYYYYMMDD()));
    setSaving(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const setField = (name: keyof ChecklistForm, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const saveToLocalStorage = () => {
    if (!vehicle) return;
    try {
      const key = `${STORAGE_PREFIX}${vehicle.id}`;
      const existingRaw = localStorage.getItem(key);
      const list = existingRaw ? (JSON.parse(existingRaw) as any[]) : [];
      const payload = {
        ...form,
        date: sanitizeString(form.date),
        odometer: sanitizeString(form.odometer),
        observations: sanitizeString(form.observations),
        savedAt: new Date().toISOString(),
        vehicle: { id: vehicle.id, plate: vehicle.plate },
      };
      list.push(payload);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) {
      // ignore storage errors
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Front-only validation
    if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date)) {
      setError('Data da inspeção inválida.');
      setSaving(false);
      return;
    }
    if (!form.odometer || Number(form.odometer) < 0) {
      setError('Informe a quilometragem atual válida.');
      setSaving(false);
      return;
    }

    saveToLocalStorage();
    setSuccess('Checklist salvo localmente.');
    showToast('success', 'Checklist salvo localmente.');
    setSaving(false);
  };

  if (!isOpen || !vehicle) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form className={styles.container} onSubmit={handleSubmit}>
        <div className={styles.vehicleHeader}>
          <div>
            Veículo: {vehicle.brand} {vehicle.model} {vehicle.year ? `• ${vehicle.year}` : ''}
          </div>
          <div>Placa: {vehicle.plate}</div>
          {vehicle.color && <div>Cor: {vehicle.color}</div>}
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="date">Data da inspeção</label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={e => setField('date', e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="odometer">Quilometragem atual (km)</label>
            <input
              id="odometer"
              name="odometer"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.odometer}
              onChange={e => setField('odometer', e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="fuelLevel">Nível de combustível</label>
            <select
              id="fuelLevel"
              name="fuelLevel"
              value={form.fuelLevel}
              onChange={e => setField('fuelLevel', e.target.value)}
            >
              <option value="empty">Vazio</option>
              <option value="quarter">1/4</option>
              <option value="half">1/2</option>
              <option value="three_quarters">3/4</option>
              <option value="full">Cheio</option>
            </select>
          </div>
        </div>

        {(
          [
            { key: 'exterior', label: 'Exterior' },
            { key: 'interior', label: 'Interior' },
            { key: 'tires', label: 'Pneus' },
            { key: 'brakes', label: 'Freios' },
            { key: 'lights', label: 'Iluminação' },
            { key: 'fluids', label: 'Fluidos' },
            { key: 'engine', label: 'Motor' },
            { key: 'suspension', label: 'Suspensão' },
            { key: 'battery', label: 'Bateria' },
          ] as const
        ).map(item => (
          <div key={item.key} className={styles.group}>
            <h4 className={styles.groupTitle}>{item.label}</h4>
            <div className={styles.options}>
              <label>
                <input
                  type="radio"
                  name={item.key}
                  value="ok"
                  checked={form[item.key] === 'ok'}
                  onChange={e => setField(item.key, e.target.value)}
                />
                Em ordem
              </label>
              <label>
                <input
                  type="radio"
                  name={item.key}
                  value="attention"
                  checked={form[item.key] === 'attention'}
                  onChange={e => setField(item.key, e.target.value)}
                />
                Atenção breve
              </label>
              <label>
                <input
                  type="radio"
                  name={item.key}
                  value="critical"
                  checked={form[item.key] === 'critical'}
                  onChange={e => setField(item.key, e.target.value)}
                />
                Crítico/Imediato
              </label>
            </div>
          </div>
        ))}

        <div className={styles.field}>
          <label htmlFor="observations">Observações gerais</label>
          <textarea
            id="observations"
            name="observations"
            rows={4}
            value={form.observations}
            onChange={e => setField('observations', e.target.value)}
            placeholder="Anote detalhes relevantes, barulhos, avarias, etc."
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleClose}
            disabled={saving}
          >
            Fechar
          </button>
          <button type="submit" className={styles.primary} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar checklist (local)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleChecklistModal;
