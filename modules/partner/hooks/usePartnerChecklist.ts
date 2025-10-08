'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLogger } from '@/modules/logger';

const logger = getLogger('partner:checklist');

// Chave dos itens do checklist que aceitam evidência
export const EVIDENCE_KEYS = [
  'clutch',
  'sparkPlugs',
  'belts',
  'radiator',
  'frontShocks',
  'rearShocks',
  'suspension',
  'tires',
  'brakePads',
  'brakeDiscs',
  'engine',
  'steeringBox',
  'electricSteeringBox',
  'exhaust',
  'fluids',
  'airConditioning',
  'airConditioningCompressor',
  'airConditioningCleaning',
  'electricalActuationGlass',
  'electricalActuationMirror',
  'electricalActuationSocket',
  'electricalActuationLock',
  'electricalActuationTrunk',
  'electricalActuationWiper',
  'electricalActuationKey',
  'electricalActuationAlarm',
  'electricalActuationInteriorLight',
  'dashboardPanel',
  'lights',
  'battery',
] as const;
export type EvidenceKey = (typeof EVIDENCE_KEYS)[number];
// Estado para evidências: { [itemKey]: { file?: File, url?: string|null } }
type EvidenceState = Record<EvidenceKey, { file?: File; url?: string | null } | undefined>;
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/modules/common/components/ToastProvider';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';

export interface AnomalyEvidence {
  id: string;
  description: string;
  photos: (File | string)[]; // Pode ser File (novo upload) ou string (URL do banco)
}

export interface PartnerChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  // Grupos de Inspeção baseados no CHECK LIST.xlsx
  clutch: 'ok' | 'attention' | 'critical'; // Embreagem - Conjunto
  clutchNotes: string;
  sparkPlugs: 'ok' | 'attention' | 'critical'; // Vela de Ignição
  sparkPlugsNotes: string;
  belts: 'ok' | 'attention' | 'critical'; // Correia Dentada/Auxiliar
  beltsNotes: string;
  radiator: 'ok' | 'attention' | 'critical'; // Radiador (Arrefecimento) - Verificar vazamentos inferiores
  radiatorNotes: string;
  frontShocks: 'ok' | 'attention' | 'critical'; // Amortecedor Dianteiro
  frontShocksNotes: string;
  rearShocks: 'ok' | 'attention' | 'critical'; // Amortecedor Traseiro
  rearShocksNotes: string;
  suspension: 'ok' | 'attention' | 'critical'; // Suspensão
  suspensionNotes: string;
  tires: 'ok' | 'attention' | 'critical'; // Pneus
  tiresNotes: string;
  brakePads: 'ok' | 'attention' | 'critical'; // Pastilha de Freio
  brakePadsNotes: string;
  brakeDiscs: 'ok' | 'attention' | 'critical'; // Disco de Freio
  brakeDiscsNotes: string;
  engine: 'ok' | 'attention' | 'critical'; // Motor
  engineNotes: string;
  steeringBox: 'ok' | 'attention' | 'critical'; // Caixa de Direção
  steeringBoxNotes: string;
  electricSteeringBox: 'ok' | 'attention' | 'critical'; // Caixa Direção Elétrica - Verificar folga
  electricSteeringBoxNotes: string;
  exhaust: 'ok' | 'attention' | 'critical'; // Sistema de Escape - Checar vazamento/sinistros/alinhamento
  exhaustNotes: string;
  fluids: 'ok' | 'attention' | 'critical'; // Fluidos - Checar níveis
  fluidsNotes: string;
  airConditioning: 'ok' | 'attention' | 'critical'; // Ar Condicionado - Checar se está congelando
  airConditioningNotes: string;
  airConditioningCompressor: 'ok' | 'attention' | 'critical'; // Compressor Ar Condicionado - Checar se está atracando
  airConditioningCompressorNotes: string;
  airConditioningCleaning: 'ok' | 'attention' | 'critical'; // Limpeza Ar Condicionado - Checar fluxo de ar (filtro de cabine)
  airConditioningCleaningNotes: string;
  // Itens individuais do Acionamento Elétrico
  electricalActuationGlass: 'ok' | 'attention' | 'critical'; // VIDRO
  electricalActuationGlassNotes: string;
  electricalActuationMirror: 'ok' | 'attention' | 'critical'; // RETROVISOR
  electricalActuationMirrorNotes: string;
  electricalActuationSocket: 'ok' | 'attention' | 'critical'; // TOMADA 12V
  electricalActuationSocketNotes: string;
  electricalActuationLock: 'ok' | 'attention' | 'critical'; // TRAVA
  electricalActuationLockNotes: string;
  electricalActuationTrunk: 'ok' | 'attention' | 'critical'; // PORTA MALA
  electricalActuationTrunkNotes: string;
  electricalActuationWiper: 'ok' | 'attention' | 'critical'; // LIMPADOR
  electricalActuationWiperNotes: string;
  electricalActuationKey: 'ok' | 'attention' | 'critical'; // CHAVE
  electricalActuationKeyNotes: string;
  electricalActuationAlarm: 'ok' | 'attention' | 'critical'; // ALARME
  electricalActuationAlarmNotes: string;
  electricalActuationInteriorLight: 'ok' | 'attention' | 'critical'; // LUZ INTERNA
  electricalActuationInteriorLightNotes: string;
  dashboardPanel: 'ok' | 'attention' | 'critical'; // Painel de Instrumentos - Checar luzes do painel
  dashboardPanelNotes: string;
  lights: 'ok' | 'attention' | 'critical'; // Lâmpadas - Checar funcionamento
  lightsNotes: string;
  battery: 'ok' | 'attention' | 'critical'; // Bateria
  batteryNotes: string;
  observations: string;
}

export interface PartnerVehicleInfo {
  id: string;
  brand: string;
  model: string;
  year?: number;
  plate: string;
  color?: string;
}

export interface PartnerInspectionInfo {
  id: string;
  inspection_date: string;
  odometer: number;
  fuel_level: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  observations?: string;
  finalized: boolean;
  created_at: string;
}

const initialForm: PartnerChecklistForm = {
  date: new Date().toISOString().split('T')[0],
  odometer: '',
  fuelLevel: 'half',
  // Grupos de Inspeção baseados no CHECK LIST.xlsx
  clutch: 'ok',
  clutchNotes: '',
  sparkPlugs: 'ok',
  sparkPlugsNotes: '',
  belts: 'ok',
  beltsNotes: '',
  radiator: 'ok',
  radiatorNotes: '',
  frontShocks: 'ok',
  frontShocksNotes: '',
  rearShocks: 'ok',
  rearShocksNotes: '',
  suspension: 'ok',
  suspensionNotes: '',
  tires: 'ok',
  tiresNotes: '',
  brakePads: 'ok',
  brakePadsNotes: '',
  brakeDiscs: 'ok',
  brakeDiscsNotes: '',
  engine: 'ok',
  engineNotes: '',
  steeringBox: 'ok',
  steeringBoxNotes: '',
  electricSteeringBox: 'ok',
  electricSteeringBoxNotes: '',
  exhaust: 'ok',
  exhaustNotes: '',
  fluids: 'ok',
  fluidsNotes: '',
  airConditioning: 'ok',
  airConditioningNotes: '',
  airConditioningCompressor: 'ok',
  airConditioningCompressorNotes: '',
  airConditioningCleaning: 'ok',
  airConditioningCleaningNotes: '',
  // Itens individuais do Acionamento Elétrico
  electricalActuationGlass: 'ok',
  electricalActuationGlassNotes: '',
  electricalActuationMirror: 'ok',
  electricalActuationMirrorNotes: '',
  electricalActuationSocket: 'ok',
  electricalActuationSocketNotes: '',
  electricalActuationLock: 'ok',
  electricalActuationLockNotes: '',
  electricalActuationTrunk: 'ok',
  electricalActuationTrunkNotes: '',
  electricalActuationWiper: 'ok',
  electricalActuationWiperNotes: '',
  electricalActuationKey: 'ok',
  electricalActuationKeyNotes: '',
  electricalActuationAlarm: 'ok',
  electricalActuationAlarmNotes: '',
  electricalActuationInteriorLight: 'ok',
  electricalActuationInteriorLightNotes: '',
  dashboardPanel: 'ok',
  dashboardPanelNotes: '',
  lights: 'ok',
  lightsNotes: '',
  battery: 'ok',
  batteryNotes: '',
  observations: '',
};

export function usePartnerChecklist() {
  const { showToast } = useToast();
  const { get, put, post } = useAuthenticatedFetch();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<PartnerChecklistForm>(initialForm);
  // Evidências por item
  const emptyEvidenceState = Object.fromEntries(
    EVIDENCE_KEYS.map(k => [k, undefined])
  ) as EvidenceState;
  const [evidences, setEvidences] = useState<EvidenceState>(emptyEvidenceState);
  // Setar evidência (imagem) para um item
  const setEvidence = (key: EvidenceKey, file: File) => {
    setEvidences(prev => ({ ...prev, [key]: { file, url: undefined } }));
  };

  // Remover evidência de um item
  const removeEvidence = (key: EvidenceKey) => {
    setEvidences(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };
  const [vehicle, setVehicle] = useState<PartnerVehicleInfo | null>(null);
  const [inspection, setInspection] = useState<PartnerInspectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Variável para fallback do inspectionId retornado da API
  const inspectionIdRef = useRef<string | undefined>(undefined);

  // Anomalies state
  const [anomaliesData, setAnomaliesData] = useState<AnomalyEvidence[]>([
    { id: '1', description: '', photos: [] },
  ]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);
  const [anomaliesSaving, setAnomaliesSaving] = useState(false);
  const [anomaliesError, setAnomaliesError] = useState<string | null>(null);

  // Buscar dados reais do veículo
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obter parâmetros da URL
        const quoteId = searchParams.get('quoteId');
        const vehicleId = searchParams.get('vehicleId');
        const inspectionId = searchParams.get('inspectionId');

        // Determinar qual parâmetro usar
        const targetId = inspectionId || vehicleId || quoteId;
        const isVehicleId = !!vehicleId;

        if (!targetId) {
          throw new Error('Nenhum ID válido fornecido na URL');
        }

        // Construir URL da API
        let apiUrl = '/api/partner/get-vehicle-from-inspection';
        if (isVehicleId) {
          apiUrl += `?vehicleId=${targetId}`;
        } else if (inspectionId) {
          apiUrl += `?inspectionId=${targetId}`;
        } else {
          // Para quoteId, pode ser necessário uma API diferente
          apiUrl += `?quoteId=${targetId}`;
        }

        const response = await get<{
          vehicle: PartnerVehicleInfo;
          inspection?: PartnerInspectionInfo;
          vehicleId?: string;
          inspectionId?: string;
          source?: string;
        }>(apiUrl);

        if (!response.ok || !response.data) {
          throw new Error('Erro ao buscar dados do veículo');
        }

        const {
          vehicle: vehicleData,
          inspection: inspectionData,
          inspectionId: inspectionIdApi,
        } = response.data;
        inspectionIdRef.current = inspectionIdApi || inspectionData?.id || undefined;

        if (!vehicleData) {
          throw new Error('Veículo não encontrado');
        }

        setVehicle(vehicleData);

        // Registrar início da fase orçamentária APÓS obter o vehicleId
        // Usar o ID do veículo retornado pela API
        const actualVehicleId = vehicleData.id;
        if (actualVehicleId) {
          try {
            logger.info('Registrando início do checklist', {
              vehicleId: actualVehicleId.slice(0, 8),
              quoteId: quoteId?.slice(0, 8),
            });

            const initResponse = await post<{
              success: boolean;
              message?: string;
              status?: string;
              error?: string;
            }>(
              '/api/partner/checklist/init',
              { vehicleId: actualVehicleId, quoteId },
              { requireAuth: true }
            );

            if (initResponse.ok && initResponse.data) {
              logger.info('Timeline atualizada com sucesso', {
                status: initResponse.data.status,
              });
            } else {
              logger.warn('Falha ao atualizar timeline', {
                error: initResponse.error,
                status: initResponse.status,
              });
            }
          } catch (initError) {
            logger.error('Erro ao registrar início do checklist', {
              error: initError instanceof Error ? initError.message : String(initError),
            });
          }
        }

        // Se temos dados da inspeção, preencher o formulário
        if (inspectionData) {
          setInspection(inspectionData);
          setForm(prev => ({
            ...prev,
            date: inspectionData.inspection_date,
            odometer: inspectionData.odometer.toString(),
            fuelLevel: inspectionData.fuel_level,
            observations: inspectionData.observations || '',
          }));
          // Carregar checklist salvo (valores e evidências)
          try {
            const loadResp = await post<{
              ok: boolean;
              data?: {
                form: Partial<PartnerChecklistForm> | null;
                evidences?: Record<string, { url: string }>;
              };
            }>(
              '/api/partner/checklist/load',
              { inspectionId: inspectionData.id },
              { requireAuth: true }
            );
            if (loadResp.ok && loadResp.data) {
              const loadedForm = loadResp.data.data?.form;
              const loadedEvidences = loadResp.data.data?.evidences || {};
              if (loadedForm) {
                setForm(prev => ({ ...prev, ...loadedForm }));
              }
              // Mapear evidences para o estado com url
              const newEvidenceState = { ...emptyEvidenceState };
              for (const key of Object.keys(loadedEvidences)) {
                if ((EVIDENCE_KEYS as readonly string[]).includes(key)) {
                  // @ts-ignore - assign url only
                  newEvidenceState[key as EvidenceKey] = { url: loadedEvidences[key]!.url };
                }
              }
              setEvidences(prev => ({ ...prev, ...newEvidenceState }));
            }
          } catch {}
        } else {
          // Se não há inspeção, mas temos vehicle, ainda podemos tentar carregar anomalias
          // usando o vehicleId diretamente (se for o caso)
        }

        // Carregar anomalias se temos vehicle e inspection
        if (vehicleData && inspectionData) {
          try {
            // Carregar anomalias inline para evitar dependência circular
            const anomaliesResponse = await get<{
              success: boolean;
              data: AnomalyEvidence[];
              error?: string;
            }>(
              `/api/partner/checklist/load-anomalies?inspection_id=${inspectionData.id}&vehicle_id=${vehicleData.id}`
            );

            if (anomaliesResponse.ok && anomaliesResponse.data?.success) {
              const loadedAnomalies = anomaliesResponse.data.data || [];
              // Sempre atualizar - se vazio, mostrar uma anomalia inicial
              const finalAnomalies =
                loadedAnomalies.length > 0
                  ? loadedAnomalies
                  : [{ id: '1', description: '', photos: [] }];
              setAnomaliesData(finalAnomalies);
            }
          } catch {
            // Silently handle anomaly loading errors to not disrupt the main flow
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados do veículo';
        setError(message);
        showToast('error', message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [searchParams, get, post, showToast]);

  const setField = (
    field: keyof PartnerChecklistForm,
    value: string | 'ok' | 'attention' | 'critical'
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveChecklist = async () => {
    if (!vehicle) {
      throw new Error('Veículo não encontrado');
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validações básicas
      if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date)) {
        throw new Error('Data da inspeção inválida.');
      }
      if (!form.odometer || Number(form.odometer) < 0) {
        throw new Error('Informe a quilometragem atual válida.');
      }

      // Upload das evidências através do endpoint server-side (evita RLS no client)
      const uploadedEvidenceUrls = Object.fromEntries(EVIDENCE_KEYS.map(k => [k, ''])) as Record<
        EvidenceKey,
        string
      >;
      const hasFiles = EVIDENCE_KEYS.some(k => !!evidences[k]?.file);
      if (hasFiles) {
        const { data: sessionRes } = await supabase.auth.getSession();
        const accessToken = sessionRes.session?.access_token;
        if (!accessToken) {
          throw new Error('Usuário não autenticado para envio de evidências.');
        }

        for (const key of EVIDENCE_KEYS) {
          const ev = evidences[key];
          if (ev?.file) {
            const form = new FormData();
            form.append('vehicle_id', vehicle.id);
            form.append('item_key', key);
            form.append('file', ev.file);

            const res = await fetch('/api/partner/checklist/upload-evidence', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: form,
            });
            if (!res.ok) {
              const msg = await res.text();
              throw new Error(`Erro ao enviar evidência de ${key}: ${msg || res.status}`);
            }
            const json = await res.json();
            uploadedEvidenceUrls[key] = json.storage_path || '';
          }
        }
      }

      // Enviar checklist + evidências para a API/backend
      // Garantir que inspection_id sempre seja enviado
      let inspection_id = inspection?.id;
      // Fallback: usar inspectionId retornado da API se não houver inspection?.id
      if (!inspection_id && typeof inspectionIdRef.current === 'string') {
        inspection_id = inspectionIdRef.current;
      }
      if (!inspection_id && typeof window !== 'undefined') {
        // Tentar obter inspectionId do searchParams (caso a API não tenha retornado)
        const url = new URL(window.location.href);
        inspection_id = url.searchParams.get('inspectionId') || undefined;
      }

      const payload = {
        ...form,
        vehicle_id: vehicle.id,
        evidences: uploadedEvidenceUrls,
        inspection_id,
      };

      // PUT para submit (pode ser ajustado para save rascunho se necessário)
      const response = await put('/api/partner/checklist/submit', payload, {
        requireAuth: true,
      });

      if (!response.ok) {
        throw new Error(response.error || 'Erro ao salvar checklist no backend');
      }
      setSuccess('Checklist salvo com sucesso!');
      showToast('success', 'Checklist salvo com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar checklist.';
      setError(message);
      showToast('error', message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setError(null);
    setSuccess(null);
  };

  // Load anomalies from API
  const loadAnomalies = useCallback(async () => {
    if (!vehicle || !inspection) return;

    setAnomaliesLoading(true);
    setAnomaliesError(null);

    try {
      const response = await get<{
        success: boolean;
        data: AnomalyEvidence[];
        error?: string;
      }>(
        `/api/partner/checklist/load-anomalies?inspection_id=${inspection.id}&vehicle_id=${vehicle.id}`
      );

      if (!response.ok || !response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao carregar anomalias');
      }

      const loadedAnomalies = response.data.data || [];
      // Sempre atualizar o estado, mesmo que vazio
      setAnomaliesData(
        loadedAnomalies.length > 0 ? loadedAnomalies : [{ id: '1', description: '', photos: [] }]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar anomalias';
      setAnomaliesError(message);
    } finally {
      setAnomaliesLoading(false);
    }
  }, [vehicle, inspection, get]);

  // Save anomalies to API
  const saveAnomalies = useCallback(
    async (anomalies: AnomalyEvidence[]) => {
      if (!vehicle || !inspection) {
        throw new Error('Veículo ou inspeção não encontrados');
      }

      setAnomaliesSaving(true);
      setAnomaliesError(null);

      try {
        // Criar FormData para enviar arquivos e dados
        const formData = new FormData();
        formData.append('inspection_id', inspection.id);
        formData.append('vehicle_id', vehicle.id);

        // Preparar dados das anomalias sem os arquivos (apenas metadados)
        const anomaliesData = anomalies.map((anomaly, anomalyIndex) => {
          // Adicionar arquivos ao FormData com chaves específicas
          anomaly.photos.forEach((photo, photoIndex) => {
            if (photo instanceof File) {
              formData.append(`anomaly-${anomalyIndex}-photo-${photoIndex}`, photo);
            }
          });

          return {
            description: anomaly.description,
            photos: anomaly.photos.map((photo, photoIndex) =>
              photo instanceof File ? `anomaly-${anomalyIndex}-photo-${photoIndex}` : photo
            ),
          };
        });

        formData.append('anomalies', JSON.stringify(anomaliesData));

        // Enviar como FormData
        const { data: sessionRes } = await supabase.auth.getSession();
        const accessToken = sessionRes.session?.access_token;

        const response = await fetch('/api/partner/checklist/save-anomalies', {
          method: 'POST',
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
          },
          body: formData,
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || 'Erro ao salvar anomalias');
        }

        setAnomaliesData(anomalies);
        showToast('success', responseData.message || 'Anomalias salvas com sucesso!');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar anomalias';
        setAnomaliesError(message);
        showToast('error', message);
        throw err;
      } finally {
        setAnomaliesSaving(false);
      }
    },
    [vehicle, inspection, showToast]
  );

  return {
    form,
    vehicle,
    inspection,
    loading,
    saving,
    error,
    success,
    setField,
    saveChecklist,
    resetForm,
    evidences,
    setEvidence,
    removeEvidence,
    // Anomalies functionality
    anomalies: anomaliesData,
    loadAnomalies,
    saveAnomalies,
    anomaliesLoading,
    anomaliesSaving,
    anomaliesError,
  };
}
