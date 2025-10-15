import { CHECKLIST_STATUS, LEGACY_STATUS_MAP } from '@/modules/partner/constants/checklist';
import { ChecklistStatus } from '../types';

/**
 * Normaliza status do front (2 estados: 'ok' | 'nok') e variações legadas
 */
export function mapStatus(status?: string): ChecklistStatus {
  if (!status) return null;
  const normalized = String(status).toLowerCase();
  return (LEGACY_STATUS_MAP[normalized] as ChecklistStatus) || null;
}

/**
 * Agregação binária: se qualquer item for 'nok', retorna 'nok'; caso contrário 'ok'
 */
export function worstStatus(values: (string | undefined)[]): ChecklistStatus {
  const mapped = values.map(v => mapStatus(v)).filter(Boolean) as string[];
  if (mapped.length === 0) return null;
  return mapped.some(v => v === CHECKLIST_STATUS.NOK) ? CHECKLIST_STATUS.NOK : CHECKLIST_STATUS.OK;
}

/**
 * Converte status do DB para formato da UI (ok/nok apenas)
 */
export function toFrontStatus(db?: string): ChecklistStatus {
  const s = (db || '').toLowerCase();
  if (s === CHECKLIST_STATUS.OK) return CHECKLIST_STATUS.OK;
  return CHECKLIST_STATUS.NOK;
}
