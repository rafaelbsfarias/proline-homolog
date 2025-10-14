import { useState, useMemo } from 'react';
import { EVIDENCE_KEYS, type EvidenceKey } from '@/modules/partner/constants/checklist';
import type { EvidenceItem, EvidenceState } from '@/modules/partner/types/checklist';

export function useChecklistEvidences() {
  const emptyEvidenceState = useMemo(
    () => Object.fromEntries(EVIDENCE_KEYS.map(k => [k, []])) as EvidenceState,
    []
  );
  const [evidences, setEvidences] = useState<EvidenceState>(emptyEvidenceState);

  const addEvidence = (key: EvidenceKey, file: File) => {
    setEvidences(prev => {
      const existing = prev[key] || [];
      const newEvidence: EvidenceItem = { file, url: undefined, id: `${Date.now()}-${Math.random()}` };
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

  const setFromUrlMap = (urls: Record<string, { url: string }>) => {
    const next: EvidenceState = { ...emptyEvidenceState };
    Object.entries(urls).forEach(([key, value]) => {
      if (!value?.url) return;
      if ((EVIDENCE_KEYS as readonly string[]).includes(key as any)) {
        const entry: EvidenceItem = { url: value.url, id: `${key}-0` };
        (next as Record<string, EvidenceItem[] | undefined>)[key] = [entry];
      }
    });
    setEvidences(next);
  };

  return { evidences, addEvidence, removeEvidence, clear, setFromUrlMap };
}
