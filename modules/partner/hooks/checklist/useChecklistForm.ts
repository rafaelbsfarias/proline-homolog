import { useState } from 'react';
import type { PartnerChecklistForm } from '@/modules/partner/types/checklist';

const initialForm: PartnerChecklistForm = {
  date: new Date().toISOString().split('T')[0],
  odometer: '',
  fuelLevel: 'half',
  clutch: 'ok',
  clutchNotes: '',
  sparkPlugs: 'ok',
  sparkPlugsNotes: '',
  belts: 'ok',
  beltsNotes: '',
  radiator: 'ok',
  radiatorNotes: '',
  frontShocks: 'ok',
  frontShocksNotes: '',
  rearShocks: 'ok',
  rearShocksNotes: '',
  suspension: 'ok',
  suspensionNotes: '',
  tires: 'ok',
  tiresNotes: '',
  brakePads: 'ok',
  brakePadsNotes: '',
  brakeDiscs: 'ok',
  brakeDiscsNotes: '',
  engine: 'ok',
  engineNotes: '',
  steeringBox: 'ok',
  steeringBoxNotes: '',
  electricSteeringBox: 'ok',
  electricSteeringBoxNotes: '',
  exhaust: 'ok',
  exhaustNotes: '',
  fluids: 'ok',
  fluidsNotes: '',
  airConditioning: 'ok',
  airConditioningNotes: '',
  airConditioningCompressor: 'ok',
  airConditioningCompressorNotes: '',
  airConditioningCleaning: 'ok',
  airConditioningCleaningNotes: '',
  electricalActuationGlass: 'ok',
  electricalActuationGlassNotes: '',
  electricalActuationMirror: 'ok',
  electricalActuationMirrorNotes: '',
  electricalActuationSocket: 'ok',
  electricalActuationSocketNotes: '',
  electricalActuationLock: 'ok',
  electricalActuationLockNotes: '',
  electricalActuationTrunk: 'ok',
  electricalActuationTrunkNotes: '',
  electricalActuationWiper: 'ok',
  electricalActuationWiperNotes: '',
  electricalActuationKey: 'ok',
  electricalActuationKeyNotes: '',
  electricalActuationAlarm: 'ok',
  electricalActuationAlarmNotes: '',
  electricalActuationInteriorLight: 'ok',
  electricalActuationInteriorLightNotes: '',
  dashboardPanel: 'ok',
  dashboardPanelNotes: '',
  lights: 'ok',
  lightsNotes: '',
  battery: 'ok',
  batteryNotes: '',
  observations: '',
};

export function useChecklistForm() {
  const [form, setForm] = useState<PartnerChecklistForm>(initialForm);

  const setField = (
    field: keyof PartnerChecklistForm,
    value: string | 'ok' | 'attention' | 'critical' | 'nok'
  ) => {
    setForm(prev => ({ ...prev, [field]: value as any }));
  };

  const reset = () => setForm(initialForm);

  return { form, setField, reset };
}

