/**
 * Compat wrapper for the legacy usePartnerChecklist hook.
 * Delegates to the new orchestrator-based hooks while preserving
 * the legacy return shape to avoid breaking imports/usages.
 */
'use client';

export { EVIDENCE_KEYS, type EvidenceKey } from '../constants/checklist';
export type { PartnerChecklistForm } from '@/modules/partner/types/checklist';
import { useChecklistOrchestrator } from './checklist/useChecklistOrchestrator';

export function usePartnerChecklist() {
  const o = useChecklistOrchestrator();

  // Map orchestrator API to legacy API surface
  const resetForm = o.reset;
  const setEvidence = o.addEvidence;
  const anomalies = o.anomalies?.anomalies || [{ id: '1', description: '', photos: [] }];
  const loadAnomalies = o.anomalies?.load || (async () => {});
  const saveAnomalies = o.anomalies?.save || (async () => {});
  const anomaliesLoading = o.anomalies?.loading || false;
  const anomaliesSaving = o.anomalies?.saving || false;
  const anomaliesError = o.anomalies?.error || null;

  return {
    form: o.form,
    vehicle: o.vehicle,
    inspection: o.inspection,
    loading: o.loading,
    saving: o.saving,
    error: o.error,
    success: o.success,
    setField: o.setField,
    saveChecklist: o.saveChecklist,
    resetForm,
    evidences: o.evidences,
    setEvidence,
    removeEvidence: o.removeEvidence,
    anomalies,
    loadAnomalies,
    saveAnomalies,
    anomaliesLoading,
    anomaliesSaving,
    anomaliesError,
  };
}
