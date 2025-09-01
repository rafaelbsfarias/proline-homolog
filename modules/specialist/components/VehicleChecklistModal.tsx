'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/modules/common/components/Modal/Modal';
import styles from './VehicleChecklistModal.module.css';
import { useToast } from '@/modules/common/components/ToastProvider';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';
import { supabase } from '@/modules/common/services/supabaseClient';
import { useChecklistForm } from '@/modules/specialist/checklist/useChecklistForm';
import { VehicleInfo } from '@/modules/specialist/checklist/types';
import {
  useImageUploader,
  MAX_FILES,
  MAX_SIZE_MB,
} from '@/modules/specialist/checklist/useImageUploader';
import InspectionGroups from './Checklist/InspectionGroups';
import ServiceCategoryField from './Checklist/ServiceCategoryField';
// duplicate imports removed below

interface VehicleChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleInfo | null;
  onSaved?: () => void;
  onFinalized?: () => void;
}

// Form types and defaults moved to checklist/types and managed by hook

const STORAGE_PREFIX = 'vehicle_checklists:';

const VehicleChecklistModal: React.FC<VehicleChecklistModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSaved,
  onFinalized,
}) => {
  const { showToast } = useToast();
  const {
    files,
    previews,
    handleFiles: handleFilesHook,
    removeFile,
    uploadFiles,
    reset: resetImages,
  } = useImageUploader();
  const { form, setField, setServiceFlag, setServiceNotes, resetForm } = useChecklistForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);

  const title = useMemo(() => {
    if (!vehicle) return 'Checklist do Veículo';
    return `Checklist • ${vehicle.brand} ${vehicle.model} • ${vehicle.plate}`;
  }, [vehicle]);

  const handleClose = () => {
    resetForm();
    setSaving(false);
    setError(null);
    setSuccess(null);
    resetImages();
    onClose();
  };

  // form state handled by useChecklistForm

  // Load existing checklist (collaborative, latest non-finalized)
  useEffect(() => {
    (async () => {
      try {
        if (!isOpen || !vehicle) return;
        const url = `/api/specialist/get-checklist?vehicleId=${vehicle.id}`;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data?.inspection) {
          setField('date', data.inspection.inspection_date);
          setField('odometer', String(data.inspection.odometer ?? ''));
          setField('fuelLevel', data.inspection.fuel_level || 'half');
          setField('observations', data.inspection.observations || '');
          (data.services || []).forEach((s: any) => {
            const map: Record<string, keyof typeof form.services> = {
              mechanics: 'mechanics',
              bodyPaint: 'bodyPaint',
              washing: 'washing',
              tires: 'tires',
            };
            const key = map[s.category];
            if (key) {
              setServiceFlag(key, !!s.required);
              setServiceNotes(key, s.notes || '');
            }
          });
          setIsFinalized(!!data.inspection.finalized);
        }
      } catch (e) {
        // ignore prefill errors
      }
    })();
  }, [isOpen, vehicle]);

  // cleanup moved to hook

  const handleFiles = (list: FileList | null) =>
    handleFilesHook(list, msg => showToast('warning', msg));

  // upload moved to hook; removeFile provided by hook

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinalized) return; // read-only when finalized
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Front-only validation
      if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date)) {
        throw new Error('Data da inspeção inválida.');
      }
      if (!form.odometer || Number(form.odometer) < 0) {
        throw new Error('Informe a quilometragem atual válida.');
      }
      if (!vehicle) {
        throw new Error('Veículo inválido.');
      }

      // Ensure user is authenticated (for storage RLS)
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session?.user) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }
      const userId = session.user.id;

      // Upload files to Supabase Storage (if any)
      let uploadedPaths: string[] = [];
      if (files.length) {
        uploadedPaths = await uploadFiles(userId, vehicle.id);
      }

      // Persist in backend (inspections + services + media)
      const payload = {
        vehicleId: vehicle.id,
        date: form.date,
        odometer: Number(form.odometer),
        fuelLevel: form.fuelLevel,
        observations: sanitizeString(form.observations),
        services: {
          mechanics: {
            required: form.services.mechanics.required,
            notes: sanitizeString(form.services.mechanics.notes),
          },
          bodyPaint: {
            required: form.services.bodyPaint.required,
            notes: sanitizeString(form.services.bodyPaint.notes),
          },
          washing: {
            required: form.services.washing.required,
            notes: sanitizeString(form.services.washing.notes),
          },
          tires: {
            required: form.services.tires.required,
            notes: sanitizeString(form.services.tires.notes),
          },
        },
        mediaPaths: uploadedPaths,
      };

      const resp = await fetch('/api/specialist/save-checklist', {
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

  if (!isOpen || !vehicle) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form className={styles.container} onSubmit={handleSubmit}>
        {/* Área de conteúdo que vai rolar */}
        <div className={styles.content}>
          <div className={styles.vehicleHeader}>
            <div>
              Veículo: {vehicle.brand} {vehicle.model} {vehicle.year ? `• ${vehicle.year}` : ''}
            </div>
            <div>Placa: {vehicle.plate}</div>
            {vehicle.color && <div>Cor: {vehicle.color}</div>}
            {isFinalized && <div className={styles.success}>Checklist finalizado</div>}
          </div>

          {/* Dados básicos da inspeção */}
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
                disabled={isFinalized}
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
                disabled={isFinalized}
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
                disabled={isFinalized}
              >
                <option value="empty">Vazio</option>
                <option value="quarter">1/4</option>
                <option value="half">1/2</option>
                <option value="three_quarters">3/4</option>
                <option value="full">Cheio</option>
              </select>
            </div>
          </div>

          {/* Sinalização de serviços necessários por categoria */}
          <div className={styles.group}>
            <h4 className={styles.groupTitle}>Serviços necessários</h4>
            <div className={styles.grid}>
              <ServiceCategoryField
                label="Mecânica"
                checked={form.services.mechanics.required}
                notes={form.services.mechanics.notes}
                onToggle={v => setServiceFlag('mechanics', v)}
                onNotesChange={v => setServiceNotes('mechanics', v)}
                disabled={isFinalized}
              />
              <ServiceCategoryField
                label="Funilaria/Pintura"
                checked={form.services.bodyPaint.required}
                notes={form.services.bodyPaint.notes}
                onToggle={v => setServiceFlag('bodyPaint', v)}
                onNotesChange={v => setServiceNotes('bodyPaint', v)}
                disabled={isFinalized}
              />
              <ServiceCategoryField
                label="Lavagem"
                checked={form.services.washing.required}
                notes={form.services.washing.notes}
                onToggle={v => setServiceFlag('washing', v)}
                onNotesChange={v => setServiceNotes('washing', v)}
                disabled={isFinalized}
              />
              <ServiceCategoryField
                label="Pneus"
                checked={form.services.tires.required}
                notes={form.services.tires.notes}
                onToggle={v => setServiceFlag('tires', v)}
                onNotesChange={v => setServiceNotes('tires', v)}
                disabled={isFinalized}
              />
            </div>
          </div>

          {/* Upload de fotos (galeria/câmera) */}
          <div className={styles.upload}>
            <label htmlFor="photos">Fotos do veículo</label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={e => handleFiles(e.target.files)}
              disabled={isFinalized}
            />
            <small>
              Até {MAX_FILES} imagens, {MAX_SIZE_MB}MB cada. Formatos: JPG, PNG, WEBP, HEIC.
            </small>
            {!!previews.length && (
              <div className={styles.previews}>
                {previews.map((src, i) => (
                  <div key={src} className={styles.previewItem}>
                    <img
                      src={src}
                      alt={`Pré-visualização ${i + 1}`}
                      className={styles.previewImage}
                    />
                    {!isFinalized && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeFile(i)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
        </div>

        {/* Rodapé de Ações Fixo */}
        <div className={`${styles.actions} ${styles.actionsFooter}`}>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleClose}
            disabled={saving}
          >
            Fechar
          </button>
          <button type="submit" className={styles.primary} disabled={saving || isFinalized}>
            {saving ? 'Salvando...' : 'Salvar checklist'}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={async () => {
              if (!vehicle || isFinalized) return;
              try {
                setSaving(true);
                const {
                  data: { session },
                } = await supabase.auth.getSession();
                const resp = await fetch('/api/specialist/finalize-checklist', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token
                      ? { Authorization: `Bearer ${session.access_token}` }
                      : {}),
                  },
                  body: JSON.stringify({ vehicleId: vehicle.id }),
                });
                if (!resp.ok) {
                  const data = await resp.json().catch(() => ({}));
                  throw new Error(data?.error || 'Erro ao finalizar checklist');
                }
                setIsFinalized(true);
                setSuccess('Checklist finalizado.');
                showToast('success', 'Checklist finalizado.');
                try {
                  onFinalized && onFinalized();
                } catch {}
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Erro ao finalizar checklist.';
                setError(msg);
                showToast('error', msg);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || isFinalized}
          >
            Finalizar checklist
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleChecklistModal;
