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

// Checklist status constants used across services/mappers
export const CHECKLIST_STATUS = {
  OK: 'ok',
  NOK: 'nok',
} as const;

// Legacy/status normalization map: map various inputs to ok/nok
export const LEGACY_STATUS_MAP: Record<string, 'ok' | 'nok'> = {
  ok: 'ok',
  good: 'ok',
  yes: 'ok',
  true: 'ok',
  // negative/nok cluster
  nok: 'nok',
  poor: 'nok',
  regular: 'nok',
  attention: 'nok',
  critical: 'nok',
  no: 'nok',
  false: 'nok',
};

// Workflow-level status (checklist lifecycle)
export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
} as const;
