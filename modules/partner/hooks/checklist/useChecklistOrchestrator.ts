import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';
import { EVIDENCE_KEYS, type EvidenceKey } from '@/modules/partner/constants/checklist';
import type {
  PartnerChecklistForm,
  PartnerVehicleInfo,
  PartnerInspectionInfo,
} from '@/modules/partner/types/checklist';
import { useChecklistForm } from './useChecklistForm';
import { useChecklistEvidences } from './useChecklistEvidences';
import { useChecklistAnomalies } from './useChecklistAnomalies';
import { getLogger } from '@/modules/logger';

export function useChecklistOrchestrator() {
  const { get, post, put } = useAuthenticatedFetch();
  const searchParams = useSearchParams();
  const logger = getLogger('hooks:checklist-orchestrator');

  const { form, setField, reset } = useChecklistForm();
  const { evidences, addEvidence, removeEvidence, setFromUrlMap } = useChecklistEvidences();

  const [vehicle, setVehicle] = useState<PartnerVehicleInfo | null>(null);
  const [inspection, setInspection] = useState<PartnerInspectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inspectionIdRef = useRef<string | undefined>(undefined);

  // Part requests carregados dos items (por item_key)
  const [partRequests, setPartRequests] = useState<Record<string, unknown>>({});

  // IDs
  const quoteId = searchParams.get('quoteId') || undefined;
  const vehicleIdParam = searchParams.get('vehicleId') || undefined;
  const inspectionIdParam = searchParams.get('inspectionId') || undefined;

  const anomalies = useChecklistAnomalies(
    vehicle?.id,
    inspection?.id || inspectionIdRef.current,
    quoteId || null
  );

  // Efeito separado para carregar anomalias após os dados básicos serem carregados
  useEffect(() => {
    if (vehicle?.id && (inspection?.id || inspectionIdRef.current || quoteId)) {
      anomalies.load().catch(error => {
        logger.warn('Failed to load anomalies', { error: error.message });
      });
    }
  }, [vehicle?.id, inspection?.id, inspectionIdRef.current, quoteId, anomalies.load]);

  // Initial load: vehicle + inspection + checklist data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const targetId = inspectionIdParam || vehicleIdParam || quoteId;
        if (!targetId) throw new Error('Nenhum ID válido fornecido na URL');

        let apiUrl = '/api/partner/get-vehicle-from-inspection';
        if (vehicleIdParam) apiUrl += `?vehicleId=${targetId}`;
        else if (inspectionIdParam) apiUrl += `?inspectionId=${targetId}`;
        else apiUrl += `?quoteId=${targetId}`;

        const response = await get<{
          vehicle: PartnerVehicleInfo;
          inspection?: PartnerInspectionInfo;
          vehicleId?: string;
          inspectionId?: string;
        }>(apiUrl);
        if (!response.ok || !response.data) throw new Error('Erro ao buscar dados do veículo');

        const { vehicle: vehicleData, inspection: inspectionData, inspectionId } = response.data;
        inspectionIdRef.current = inspectionId || inspectionData?.id || undefined;
        if (!vehicleData) throw new Error('Veículo não encontrado');
        setVehicle(vehicleData);

        // timeline init
        try {
          await post(
            '/api/partner/checklist/init',
            { vehicleId: vehicleData.id, quoteId },
            { requireAuth: true }
          );
        } catch {}

        if (inspectionData) {
          setInspection(inspectionData);
          // hydrate form basics
          setField('date', inspectionData.inspection_date);
          setField('odometer', String(inspectionData.odometer));
          setField('fuelLevel', inspectionData.fuel_level);
          setField('observations', inspectionData.observations || '');

          // load checklist data for partner
          const loadResp = await post<{
            ok: boolean;
            data?: {
              form: (Partial<PartnerChecklistForm> & { [k: string]: unknown }) | null;
              evidences?: Record<string, { url: string }>;
              items?: Array<{
                item_key: string;
                item_status: string;
                item_notes: string;
                part_request?: unknown;
              }>;
            };
          }>(
            '/api/partner/checklist/load',
            { inspectionId: inspectionData.id, quoteId },
            { requireAuth: true }
          );

          if (loadResp.ok && loadResp.data) {
            const loadedForm = loadResp.data.data?.form || null;
            const loadedEvidences = loadResp.data.data?.evidences || {};
            const loadedItems = loadResp.data.data?.items || [];
            if (loadedForm) {
              Object.entries(loadedForm).forEach(([k, v]) => {
                if (typeof v === 'string') {
                  setField(k as keyof PartnerChecklistForm, v);
                }
              });
            }

            logger.info('Loaded evidences from API', {
              count: Object.keys(loadedEvidences).length,
              keys: Object.keys(loadedEvidences),
              sample: Object.entries(loadedEvidences).slice(0, 2),
            }); // Use evidences directly as they come from the service in the correct format
            setFromUrlMap(loadedEvidences as unknown as Record<string, { urls: string[] }>);
            // As a practical approach, return evidences map via return object rather than fully seeding the internal state.
            // Save part-requests map
            const pr: Record<string, unknown> = {};
            for (const item of loadedItems) {
              if (item.part_request && item.item_key) pr[item.item_key] = item.part_request;
            }
            setPartRequests(pr);
          }
        }

        // load anomalies but do not break on failure
        try {
          // Anomalies are now loaded in a separate useEffect after vehicle/inspection data is available
        } catch {}
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erro ao carregar dados do veículo';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Save/submit checklist
  const saveChecklist = useCallback(
    async (partRequestsData?: Record<string, unknown>) => {
      if (!vehicle) throw new Error('Veículo não encontrado');
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date))
          throw new Error('Data da inspeção inválida.');
        if (!form.odometer || Number(form.odometer) < 0)
          throw new Error('Informe a quilometragem atual válida.');

        // Verificar categoria do parceiro para determinar qual endpoint usar
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) throw new Error('Usuário não autenticado');

        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('category')
          .eq('profile_id', userId)
          .single();

        if (partnerError) {
          logger.warn('failed_to_fetch_partner_category', { error: partnerError.message });
          throw new Error('Erro ao verificar categoria do parceiro');
        }

        const partnerCategory = partnerData?.category;
        logger.info('partner_category_determined', { category: partnerCategory });

        const uploadedEvidenceUrls = Object.fromEntries(
          EVIDENCE_KEYS.map(k => [k, [] as string[]])
        ) as Record<EvidenceKey, string[]>;

        // Simplificar: sempre enviar todas as evidências atuais (URLs existentes + novos uploads)
        // Converter URL assinada/pública em storage_path relativo ao bucket
        const toStoragePath = (url: string): string => {
          if (!url) return url;
          const clean = url.split('?')[0];
          if (clean.startsWith('evidences/') || clean.startsWith('itens/')) return clean;
          const marker = '/storage/v1/object/';
          const idx = clean.indexOf(marker);
          if (idx >= 0) {
            const after = clean.substring(idx + marker.length);
            const parts = after.split('/');
            const vmIdx = parts.indexOf('vehicle-media');
            if (vmIdx >= 0) return parts.slice(vmIdx + 1).join('/');
          }
          return clean;
        };

        for (const key of EVIDENCE_KEYS) {
          const items = evidences[key] || [];
          for (const ev of items) {
            if (ev?.url && !ev?.file) {
              // Evidência existente: persistir o storage_path derivado da URL
              uploadedEvidenceUrls[key].push(toStoragePath(ev.url));
            }
          }
        }

        // Segundo, fazer upload de novos arquivos
        const hasFiles = EVIDENCE_KEYS.some(k => (evidences[k] || []).some(item => !!item.file));
        if (hasFiles) {
          const { data: sessionRes } = await supabase.auth.getSession();
          const accessToken = sessionRes.session?.access_token;
          if (!accessToken) throw new Error('Usuário não autenticado para envio de evidências.');
          for (const key of EVIDENCE_KEYS) {
            const items = evidences[key] || [];
            for (const ev of items) {
              if (ev?.file) {
                const formData = new FormData();
                formData.append('vehicle_id', vehicle.id);
                formData.append('item_key', key);
                formData.append('file', ev.file);
                const res = await fetch('/api/partner/checklist/upload-evidence', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${accessToken}` },
                  body: formData,
                });
                if (!res.ok) throw new Error(`Erro ao enviar evidência de ${key}`);
                const json = await res.json();
                uploadedEvidenceUrls[key].push(json.storage_path || '');
              }
            }
          }
        }

        let inspection_id = inspection?.id || inspectionIdRef.current;
        if (!inspection_id && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          inspection_id = url.searchParams.get('inspectionId') || undefined;
        }

        // Roteamento baseado na categoria do parceiro
        if (partnerCategory === 'Mecânica') {
          // Parceiros de Mecânica salvam checklist técnico completo
          const payload = {
            ...form,
            vehicle_id: vehicle.id,
            evidences: uploadedEvidenceUrls,
            inspection_id,
            ...(quoteId ? { quote_id: quoteId } : {}),
            ...(partRequestsData ? { part_requests: partRequestsData } : {}),
          } as Record<string, unknown>;

          const resp = await put('/api/partner/checklist/submit', payload, { requireAuth: true });
          if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar checklist no backend');
          setSuccess('Checklist salvo com sucesso!');
        } else {
          // Outros parceiros salvam apenas anomalias usando o hook de anomalias
          try {
            await anomalies.save(anomalies.anomalies);
            setSuccess('Anomalias salvas com sucesso!');
          } catch (anomalyError) {
            throw new Error(
              anomalyError instanceof Error ? anomalyError.message : 'Erro ao salvar anomalias'
            );
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erro ao salvar checklist.';
        setError(message);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [vehicle, form, evidences, inspection?.id, quoteId, put, anomalies]
  );

  return {
    // state
    form,
    vehicle,
    inspection,
    loading,
    saving,
    error,
    success,
    // actions
    setField,
    saveChecklist,
    reset,
    evidences,
    addEvidence,
    removeEvidence,
    // anomalies
    anomalies,
    // part-requests from items
    partRequests,
  };
}
