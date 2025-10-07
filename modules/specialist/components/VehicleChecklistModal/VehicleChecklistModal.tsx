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
import ServiceCategoryField from '../Checklist/ServiceCategoryField';
import Input from '@/modules/common/components/Input/Input';
import DatePickerBR from '@/modules/common/components/DatePickerBR/DatePickerBR';
import Select from '@/modules/common/components/Select/Select';
import ImageUpload from '@/modules/common/components/ImageUpload/ImageUpload';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';

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

const fuelLevelOptions = [
  { value: 'empty', label: 'Vazio' },
  { value: 'quarter', label: '1/4' },
  { value: 'half', label: '1/2' },
  { value: 'three_quarters', label: '3/4' },
  { value: 'full', label: 'Cheio' },
];

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
    setPreviews,
  } = useImageUploader();
  const { form, setField, setServiceFlag, setServiceNotes, resetForm } = useChecklistForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [existingImages, setExistingImages] = useState<{ path: string; url: string }[]>([]);

  // const title = useMemo(() => {
  //   if (!vehicle) return 'Checklist do Veículo';
  //   return `Checklist • ${vehicle.brand} ${vehicle.model} • ${vehicle.plate}`;
  // }, [vehicle]);

  const handleClose = () => {
    resetForm();
    setSaving(false);
    setError(null);
    setSuccess(null);
    resetImages();
    setExistingImages([]);
    onClose();
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
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
              loja: 'loja',
              patio_atacado: 'patioAtacado',
            };
            const key = map[s.category];
            if (key) {
              setServiceFlag(key, !!s.required);
              setServiceNotes(key, s.notes || '');
            }
          });
          setIsFinalized(!!data.inspection.finalized);

          const media = data.inspection?.mediaPaths || [];
          if (Array.isArray(media) && media.length > 0) {
            const signedUrlPromises = media.map((path: string) =>
              supabase.storage.from('vehicle-media').createSignedUrl(path, 60)
            );
            const signedUrlResults = await Promise.all(signedUrlPromises);

            const imageObjects = media
              .map((path: string, index: number) => {
                const { data, error } = signedUrlResults[index];
                if (error) {
                  return null;
                }
                return { path, url: data.signedUrl };
              })
              .filter(Boolean) as { path: string; url: string }[];

            setExistingImages(imageObjects);
          } else {
            setExistingImages([]);
          }
        }
      } catch (e) {
        // ignore prefill errors
      }
    })();
  }, [isOpen, vehicle]);

  // cleanup moved to hook

  const handleFiles = (list: FileList | null) =>
    handleFilesHook(list, msg => showToast('warning', msg), existingImages.length);

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

      const existingPaths = existingImages.map(img => img.path);

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
          loja: {
            required: form.services.loja.required,
            notes: sanitizeString(form.services.loja.notes),
          },
          patioAtacado: {
            required: form.services.patioAtacado.required,
            notes: sanitizeString(form.services.patioAtacado.notes),
          },
        },
        mediaPaths: [...existingPaths, ...uploadedPaths],
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
      resetImages();
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
    <Modal isOpen={isOpen} onClose={handleClose} title={'Checklist do Veículo'} size="lg">
      <form className={styles.container} onSubmit={handleSubmit}>
        {/* Área de conteúdo que vai rolar */}
        <div className={styles.content}>
          <div className={styles.vehicleHeader}>
            <div>
              <span className={styles.detailLabel}>Veículo:</span> {vehicle.brand} {vehicle.model}{' '}
              {vehicle.year ? `• ${vehicle.year}` : ''}
            </div>
            <div>
              <span className={styles.detailLabel}>Placa:</span> {vehicle.plate}
            </div>
            {vehicle.color && (
              <div>
                <span className={styles.detailLabel}>Cor:</span> {vehicle.color}
              </div>
            )}
            {isFinalized && <div className={styles.success}>Checklist finalizado</div>}
          </div>

          {/* Dados básicos da inspeção */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <DatePickerBR
                id="date"
                label="Data da inspeção"
                valueIso={form.date}
                onChangeIso={iso => setField('date', iso)}
                minIso={new Date().toISOString().split('T')[0]}
                disabledDatesIso={[]}
                ariaLabel="Data da inspeção"
                containerClass={styles.datePickerContainer}
                inputClass={styles.datePickerInput} /* Add this back */
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div className={styles.field}>
              <Input
                id="odometer"
                name="odometer"
                label="Quilometragem atual (km)"
                type="text"
                value={form.odometer}
                onChange={e => setField('odometer', e.target.value)}
                required
                disabled={isFinalized}
                mask={Number} // se quiser usar imask pra forçar numérico
              />
            </div>
            <div className={styles.field}>
              <Select
                id="fuelLevel"
                className={styles.fuelLevel}
                name="fuelLevel"
                label="Nível de combustível"
                value={form.fuelLevel}
                onChange={e => setField('fuelLevel', e.target.value)}
                options={fuelLevelOptions}
                disabled={isFinalized}
              />
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
              <ServiceCategoryField
                label="Loja"
                checked={form.services.loja.required}
                notes={form.services.loja.notes}
                onToggle={v => setServiceFlag('loja', v)}
                onNotesChange={v => setServiceNotes('loja', v)}
                disabled={isFinalized}
              />
              <ServiceCategoryField
                label="Pátio Atacado"
                checked={form.services.patioAtacado.required}
                notes={form.services.patioAtacado.notes}
                onToggle={v => setServiceFlag('patioAtacado', v)}
                onNotesChange={v => setServiceNotes('patioAtacado', v)}
                disabled={isFinalized}
              />
            </div>
          </div>

          {/* Upload de fotos (galeria/câmera) */}
          <ImageUpload
            label="Fotos do veículo"
            onFilesSelect={handleFiles}
            isFinalized={isFinalized}
            maxFiles={MAX_FILES}
            maxSizeMB={MAX_SIZE_MB}
          />
          {(existingImages.length > 0 || previews.length > 0) && (
            <div className={styles.previews}>
              {existingImages.map((image, i) => (
                <div key={image.path} className={styles.previewItem}>
                  <img
                    src={image.url}
                    alt={`Imagem existente ${i + 1}`}
                    className={styles.previewImage}
                  />
                  {!isFinalized && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleRemoveExistingImage(i)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
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

        {/* Rodapé de Ações Fixo */}
        <div className={`${styles.actions} ${styles.actionsFooter}`}>
          <SolidButton type="submit" className={styles.saveButton} disabled={saving || isFinalized}>
            {saving ? 'Salvando...' : 'Salvar checklist'}
          </SolidButton>

          <SolidButton
            type="button"
            className={styles.finalizeButton}
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
          </SolidButton>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleChecklistModal;
