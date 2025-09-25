export type InspectionStatus = 'ok' | 'attention' | 'critical';
export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';

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
  fuel_level: FuelLevel;
  observations?: string;
  finalized: boolean;
  created_at: string;
}

export interface ChecklistFormBase {
  date: string;
  odometer: string;
  fuelLevel: FuelLevel;
  observations: string;
}

export interface InspectionItem {
  status: InspectionStatus;
  notes: string;
}

export interface ChecklistFormWithInspections extends ChecklistFormBase {
  id?: string;
  inspection_id?: string;
  partner_id?: string;
  status?: 'draft' | 'submitted' | 'completed' | 'rejected';

  // Grupos de Inspeção baseados no CHECK LIST.xlsx
  clutch: InspectionStatus;
  clutchNotes: string;
  clutchEvidence?: string;
  sparkPlugs: InspectionStatus;
  sparkPlugsNotes: string;
  sparkPlugsEvidence?: string;
  belts: InspectionStatus;
  beltsNotes: string;
  beltsEvidence?: string;
  radiator: InspectionStatus;
  radiatorNotes: string;
  radiatorEvidence?: string;
  frontShocks: InspectionStatus;
  frontShocksNotes: string;
  frontShocksEvidence?: string;
  rearShocks: InspectionStatus;
  rearShocksNotes: string;
  rearShocksEvidence?: string;
  suspension: InspectionStatus;
  suspensionNotes: string;
  suspensionEvidence?: string;
  tires: InspectionStatus;
  tiresNotes: string;
  tiresEvidence?: string;
  brakePads: InspectionStatus;
  brakePadsNotes: string;
  brakePadsEvidence?: string;
  brakeDiscs: InspectionStatus;
  brakeDiscsNotes: string;
  brakeDiscsEvidence?: string;
  engine: InspectionStatus;
  engineNotes: string;
  engineEvidence?: string;
  steeringBox: InspectionStatus;
  steeringBoxNotes: string;
  steeringBoxEvidence?: string;
  electricSteeringBox: InspectionStatus;
  electricSteeringBoxNotes: string;
  electricSteeringBoxEvidence?: string;
  exhaust: InspectionStatus;
  exhaustNotes: string;
  exhaustEvidence?: string;
  fluids: InspectionStatus;
  fluidsNotes: string;
  fluidsEvidence?: string;
  airConditioning: InspectionStatus;
  airConditioningNotes: string;
  airConditioningEvidence?: string;
  airConditioningCompressor: InspectionStatus;
  airConditioningCompressorNotes: string;
  airConditioningCompressorEvidence?: string;
  airConditioningCleaning: InspectionStatus;
  airConditioningCleaningNotes: string;
  airConditioningCleaningEvidence?: string;
  // Itens individuais do Acionamento Elétrico
  electricalActuationGlass: InspectionStatus;
  electricalActuationGlassNotes: string;
  electricalActuationGlassEvidence?: string;
  electricalActuationMirror: InspectionStatus;
  electricalActuationMirrorNotes: string;
  electricalActuationMirrorEvidence?: string;
  electricalActuationSocket: InspectionStatus;
  electricalActuationSocketNotes: string;
  electricalActuationSocketEvidence?: string;
  electricalActuationLock: InspectionStatus;
  electricalActuationLockNotes: string;
  electricalActuationLockEvidence?: string;
  electricalActuationTrunk: InspectionStatus;
  electricalActuationTrunkNotes: string;
  electricalActuationTrunkEvidence?: string;
  electricalActuationWiper: InspectionStatus;
  electricalActuationWiperNotes: string;
  electricalActuationWiperEvidence?: string;
  electricalActuationKey: InspectionStatus;
  electricalActuationKeyNotes: string;
  electricalActuationKeyEvidence?: string;
  electricalActuationAlarm: InspectionStatus;
  electricalActuationAlarmNotes: string;
  electricalActuationAlarmEvidence?: string;
  electricalActuationInteriorLight: InspectionStatus;
  electricalActuationInteriorLightNotes: string;
  electricalActuationInteriorLightEvidence?: string;
  dashboardPanel: InspectionStatus;
  dashboardPanelNotes: string;
  dashboardPanelEvidence?: string;
  lights: InspectionStatus;
  lightsNotes: string;
  lightsEvidence?: string;
  battery: InspectionStatus;
  batteryNotes: string;
  batteryEvidence?: string;
}
