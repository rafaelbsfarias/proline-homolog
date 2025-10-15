import { useState, useMemo } from 'react';
import { EVIDENCE_KEYS, type EvidenceKey } from '@/modules/partner/constants/checklist';
import type { EvidenceItem, EvidenceState } from '@/modules/partner/types/checklist';
import { getLogger } from '@/modules/logger';

const logger = getLogger('hooks:checklist-evidences');

export function useChecklistEvidences() {
  const emptyEvidenceState = useMemo(
    () => Object.fromEntries(EVIDENCE_KEYS.map(k => [k, []])) as EvidenceState,
    []
  );
  const [evidences, setEvidences] = useState<EvidenceState>(emptyEvidenceState);

  const addEvidence = (key: EvidenceKey, file: File) => {
    setEvidences(prev => {
      const existing = prev[key] || [];
      const newEvidence: EvidenceItem = {
        file,
        url: undefined,
        id: `${Date.now()}-${Math.random()}`,
      };
      return { ...prev, [key]: [...existing, newEvidence] };
    });
  };

  const removeEvidence = (key: EvidenceKey, evidenceId?: string) => {
    setEvidences(prev => {
      const existing = prev[key] || [];
      const filtered = evidenceId ? existing.filter(ev => ev.id !== evidenceId) : [];
      return { ...prev, [key]: filtered.length > 0 ? filtered : [] };
    });
  };

  const clear = () => setEvidences(emptyEvidenceState);

  const setFromUrlMap = (urls: Record<string, { urls: string[] }>) => {
    logger.info('setFromUrlMap called', {
      inputKeys: Object.keys(urls),
      inputSample: Object.entries(urls).slice(0, 2),
      evidenceKeys: EVIDENCE_KEYS,
    });

    const next: EvidenceState = { ...emptyEvidenceState };
    Object.entries(urls).forEach(([key, value]) => {
      if (!value?.urls || !Array.isArray(value.urls)) return;
      if ((EVIDENCE_KEYS as readonly string[]).includes(key)) {
        const entries: EvidenceItem[] = value.urls.map((url, index) => ({
          url,
          id: `${key}-${index}`,
        }));
        (next as Record<string, EvidenceItem[] | undefined>)[key] = entries;
      }
    });

    logger.info('setFromUrlMap result', {
      resultKeys: Object.keys(next),
      resultCounts: Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v?.length || 0])),
    });

    setEvidences(next);
  };

  return { evidences, addEvidence, removeEvidence, clear, setFromUrlMap };
}
