import type { EvidenceKey } from '@/modules/partner/constants/checklist';

export interface EvidenceItem {
  file?: File;
  url?: string | null;
  id?: string;
}

export type EvidenceState = Record<EvidenceKey, EvidenceItem[] | undefined>;

export interface PartnerChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  clutch: 'ok' | 'nok';
  clutchNotes: string;
  sparkPlugs: 'ok' | 'nok';
  sparkPlugsNotes: string;
  belts: 'ok' | 'nok';
  beltsNotes: string;
  radiator: 'ok' | 'nok';
  radiatorNotes: string;
  frontShocks: 'ok' | 'nok';
  frontShocksNotes: string;
  rearShocks: 'ok' | 'nok';
  rearShocksNotes: string;
  suspension: 'ok' | 'nok';
  suspensionNotes: string;
  tires: 'ok' | 'nok';
  tiresNotes: string;
  brakePads: 'ok' | 'nok';
  brakePadsNotes: string;
  brakeDiscs: 'ok' | 'nok';
  brakeDiscsNotes: string;
  engine: 'ok' | 'nok';
  engineNotes: string;
  steeringBox: 'ok' | 'nok';
  steeringBoxNotes: string;
  electricSteeringBox: 'ok' | 'nok';
  electricSteeringBoxNotes: string;
  exhaust: 'ok' | 'nok';
  exhaustNotes: string;
  fluids: 'ok' | 'nok';
  fluidsNotes: string;
  airConditioning: 'ok' | 'nok';
  airConditioningNotes: string;
  airConditioningCompressor: 'ok' | 'nok';
  airConditioningCompressorNotes: string;
  airConditioningCleaning: 'ok' | 'nok';
  airConditioningCleaningNotes: string;
  electricalActuationGlass: 'ok' | 'nok';
  electricalActuationGlassNotes: string;
  electricalActuationMirror: 'ok' | 'nok';
  electricalActuationMirrorNotes: string;
  electricalActuationSocket: 'ok' | 'nok';
  electricalActuationSocketNotes: string;
  electricalActuationLock: 'ok' | 'nok';
  electricalActuationLockNotes: string;
  electricalActuationTrunk: 'ok' | 'nok';
  electricalActuationTrunkNotes: string;
  electricalActuationWiper: 'ok' | 'nok';
  electricalActuationWiperNotes: string;
  electricalActuationKey: 'ok' | 'nok';
  electricalActuationKeyNotes: string;
  electricalActuationAlarm: 'ok' | 'nok';
  electricalActuationAlarmNotes: string;
  electricalActuationInteriorLight: 'ok' | 'nok';
  electricalActuationInteriorLightNotes: string;
  dashboardPanel: 'ok' | 'nok';
  dashboardPanelNotes: string;
  lights: 'ok' | 'nok';
  lightsNotes: string;
  battery: 'ok' | 'nok';
  batteryNotes: string;
  observations: string;
}

export interface AnomalyEvidence {
  id: string;
  description: string;
  photos: (File | string)[];
  partRequest?: {
    partName: string;
    partDescription?: string;
    quantity: number;
    estimatedPrice?: number;
  };
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

