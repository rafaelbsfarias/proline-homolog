'use client';

import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

export interface SpecialistChecklistForm {
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

export interface VehicleInfo {
  id: string;
  brand: string;
  model: string;
  year?: number;
  plate: string;
  color?: string;
}

export interface InspectionInfo {
  id: string;
  inspection_date: string;
  odometer: number;
  fuel_level: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  observations?: string;
  finalized: boolean;
  created_at: string;
}

const initialForm: SpecialistChecklistForm = {
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

export function useSpecialistChecklist() {
  const { showToast } = useToast();
  const { get, put, post } = useAuthenticatedFetch();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<SpecialistChecklistForm>(initialForm);
  // Evidências por item
  const emptyEvidenceState = Object.fromEntries(
    EVIDENCE_KEYS.map(k => [k, undefined])
  ) as EvidenceState;
  const [evidences, setEvidences] = useState<EvidenceState>(emptyEvidenceState);
  // Supabase client para upload
  const supabase = createClientComponentClient();
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
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [inspection, setInspection] = useState<InspectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Variável para fallback do inspectionId retornado da API
  const inspectionIdRef = useRef<string | undefined>(undefined);

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
          vehicle: VehicleInfo;
          inspection?: InspectionInfo;
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
                form: Partial<SpecialistChecklistForm> | null;
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
          } catch (e) {}
        } else {
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
    field: keyof SpecialistChecklistForm,
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

      // Upload das evidências para o Supabase Storage
      const uploadedEvidenceUrls = Object.fromEntries(EVIDENCE_KEYS.map(k => [k, ''])) as Record<
        EvidenceKey,
        string
      >;
      for (const key of EVIDENCE_KEYS) {
        const ev = evidences[key];
        if (ev?.file) {
          // Nome do arquivo: checklist-<vehicleId>-<itemKey>-<timestamp>.ext
          const ext = ev.file.name.split('.').pop() || 'jpg';
          const fileName = `checklist-${vehicle.id}-${key}-${Date.now()}.${ext}`;
          const { data, error: uploadError } = await supabase.storage
            .from('vehicle-media')
            .upload(fileName, ev.file, { upsert: true, contentType: ev.file.type });
          if (uploadError) {
            throw new Error(`Erro ao enviar evidência de ${key}: ${uploadError.message}`);
          }
          // Salvar o caminho do arquivo
          uploadedEvidenceUrls[key] = data.path;
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
  };
}
