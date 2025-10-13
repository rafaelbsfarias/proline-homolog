import { useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';
import { AnomalyEvidence } from '../types/VehicleDetailsTypes';

const logger = getLogger('hooks:useDynamicChecklistLoader');

export const useDynamicChecklistLoader = () => {
  const [loading, setLoading] = useState(false);

  const loadChecklist = async (
    vehicleId: string,
    inspectionId: string,
    category?: string
  ): Promise<AnomalyEvidence[] | null> => {
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

      const params = new URLSearchParams({
        vehicle_id: vehicleId,
        inspection_id: inspectionId,
      });

      if (category) {
        params.append('partner_category', category);
      }

      const response = await fetch(`/api/checklist/view?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('dynamic_checklist_loaded', {
          anomalies_count: data.data?.length || 0,
        });
        return data.data || [];
      }

      const errorData = await response.json();
      logger.error('load_dynamic_checklist_failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return null;
    } catch (err) {
      logger.error('load_dynamic_checklist_error', { error: err });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loadChecklist, loading };
};
