import { useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';
import { AnomalyEvidence } from '../types/VehicleDetailsTypes';
import { FormattedAnomaly } from '@/modules/partner/services/checklist/types/AnomalyTypes';

type ChecklistItem = {
  key: string;
  label: string;
  type: 'checkbox';
  value?: boolean;
};

type DynamicChecklistData = {
  items: ChecklistItem[];
  anomalies: AnomalyEvidence[];
  savedAt?: string;
};

const logger = getLogger('hooks:useDynamicChecklistLoader');

export const useDynamicChecklistLoader = () => {
  const [loading, setLoading] = useState(false);

  const loadChecklist = async (
    vehicleId: string,
    inspectionId: string,
    category?: string,
    partnerId?: string,
    entryId?: string
  ): Promise<DynamicChecklistData | null> => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        logger.error('session_error_dynamic_checklist', {
          error: sessionError,
          hasSession: !!session,
        });
        return null;
      }

      // Carregar form + anomalias via endpoint de visualização (qualquer papel)
      const params = new URLSearchParams({ vehicle_id: vehicleId, inspection_id: inspectionId });
      if (partnerId) params.set('partner_id', partnerId);
      if (category) params.set('partner_category', category);
      if (entryId) params.set('entry_id', entryId);
      const viewResp = await fetch(`/api/checklist/view?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!viewResp.ok) {
        const err = await viewResp.json().catch(() => ({}));
        logger.error('load_checklist_failed', { status: viewResp.status, error: err });
        return null;
      }
      const viewData = (await viewResp.json()) as {
        success: boolean;
        data?:
          | { form?: Record<string, unknown>; anomalies?: AnomalyEvidence[] }
          | FormattedAnomaly[];
      };
      const form: Record<string, unknown> =
        viewData.data && typeof viewData.data === 'object' && !Array.isArray(viewData.data)
          ? (viewData.data as { form?: Record<string, unknown> }).form || {}
          : {};
      const anomalies: AnomalyEvidence[] = Array.isArray(viewData.data)
        ? viewData.data
        : (viewData.data as { anomalies?: AnomalyEvidence[] })?.anomalies || [];

      // Mapear form -> itens apenas quando a categoria for Mecânica
      const norm = (category || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const isMechanics = norm.includes('mecanica') || norm.includes('mechanic');

      const labelMap: Record<string, string> = {
        engineOil: 'Óleo do Motor',
        oilFilter: 'Filtro de Óleo',
        airFilter: 'Filtro de Ar',
        fuelFilter: 'Filtro de Combustível',
        sparkPlugs: 'Velas de Ignição',
        belts: 'Correias',
        radiator: 'Radiador',
        battery: 'Bateria',
        clutch: 'Embreagem',
        gearbox: 'Caixa de Câmbio',
        shockAbsorbers: 'Amortecedores',
        springs: 'Molas',
        ballJoints: 'Pivôs/Terminais',
        brakePads: 'Pastilhas de Freio',
        brakeDiscs: 'Discos de Freio',
        brakeFluid: 'Fluido de Freio',
        steeringWheel: 'Volante/Direção',
        powerSteering: 'Direção Hidráulica',
        tires: 'Pneus',
        tireAlignment: 'Alinhamento',
        lights: 'Iluminação',
        wipers: 'Limpadores de Parabrisa',
        horn: 'Buzina',
        exhaust: 'Escapamento',
        bodywork: 'Carroceria',
        airConditioningCleaning: 'Higienização do Ar-Condicionado',
        airConditioningFilter: 'Filtro do Ar-Condicionado',
        airConditioningGas: 'Gás do Ar-Condicionado',
        airConditioningCompressor: 'Compressor do Ar-Condicionado',
        engine: 'Motor',
        transmission: 'Transmissão',
        brakes: 'Freios',
        suspension: 'Suspensão',
        steering: 'Direção',
        electrical: 'Elétrica',
        cooling: 'Arrefecimento',
        steeringBox: 'Caixa de Direção',
        electricSteeringBox: 'Caixa de Direção Elétrica',
        electricalActuationMirror: 'Acionamento Elétrico - Retrovisor',
        electricalActuationSocket: 'Acionamento Elétrico - Tomada',
        electricalActuationLock: 'Acionamento Elétrico - Trava',
        electricalActuationTrunk: 'Acionamento Elétrico - Porta-malas',
        electricalActuationWiper: 'Acionamento Elétrico - Limpador',
        electricalActuationKey: 'Acionamento Elétrico - Chave',
        electricalActuationAlarm: 'Acionamento Elétrico - Alarme',
        electricalActuation: 'Acionamento Elétrico',
        electricalActuationGlass: 'Acionamento Elétrico - Vidro',
        electricalActuationInteriorLight: 'Acionamento Elétrico - Luz Interna',
        InteriorLight: 'Luz Interna',
        frontShocks: 'Amortecedores Dianteiros',
        rearShockselectric: 'Amortecedores Traseiros (Elétrico)',
        rearShocks: 'Amortecedores Traseiros',
        fluids: 'Fluidos',
        airConditioning: 'Ar-Condicionado',
        dashboardPanel: 'Painel de Instrumentos',
      };

      const items: ChecklistItem[] = isMechanics
        ? Object.entries(form)
            .filter(([k]) => !k.endsWith('Notes'))
            .map(([k, v]) => ({
              key: k,
              label: labelMap[k] || k,
              type: 'checkbox' as const,
              value: String(v).toLowerCase() === 'ok',
            }))
        : [];

      logger.info('dynamic_checklist_loaded_full', {
        items_count: items.length,
        anomalies_count: anomalies.length,
        category,
      });

      return { items, anomalies };
    } catch (err) {
      logger.error('load_dynamic_checklist_error', { error: err });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loadChecklist, loading };
};
