/**
 * Constantes de Checklist - Partner Domain
 *
 * Centraliza constantes relacionadas ao fluxo de checklist mecânico,
 * incluindo status normalizados e mapeamentos.
 */

/**
 * Status normalizados do checklist (UI)
 *
 * Sistema binário simplificado:
 * - 'ok': Item em condição aceitável
 * - 'nok': Item requer atenção/reparo
 */
export const CHECKLIST_STATUS = {
  OK: 'ok',
  NOK: 'nok',
} as const;

/**
 * Status legados aceitos (compatibilidade com dados antigos)
 *
 * Mapeamento de valores antigos para o sistema binário atual (ok/nok)
 */
export const LEGACY_STATUS_MAP: Record<
  string,
  (typeof CHECKLIST_STATUS)[keyof typeof CHECKLIST_STATUS]
> = {
  ok: CHECKLIST_STATUS.OK,
  good: CHECKLIST_STATUS.OK,
  nok: CHECKLIST_STATUS.NOK,
  poor: CHECKLIST_STATUS.NOK,
  regular: CHECKLIST_STATUS.NOK,
  // Status legados que eram usados antes (não mais utilizados):
  attention: CHECKLIST_STATUS.NOK,
  critical: CHECKLIST_STATUS.NOK,
} as const;

/**
 * Status de workflow do checklist
 */
export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ChecklistStatus = (typeof CHECKLIST_STATUS)[keyof typeof CHECKLIST_STATUS];
export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS];
