import { worstStatus } from '../utils/statusNormalizer';
import { concatNotes } from '../utils/notesAggregator';
import { ChecklistStatus } from '../types';

export interface ElectricalInput {
  electricalActuationGlass?: string;
  electricalActuationMirror?: string;
  electricalActuationSocket?: string;
  electricalActuationLock?: string;
  electricalActuationTrunk?: string;
  electricalActuationWiper?: string;
  electricalActuationKey?: string;
  electricalActuationAlarm?: string;
  electricalActuationInteriorLight?: string;
  dashboardPanel?: string;
  lights?: string;
  battery?: string;
  airConditioning?: string;
  airConditioningCompressor?: string;
  airConditioningCleaning?: string;
  // Notes
  electricalActuationGlassNotes?: string;
  electricalActuationMirrorNotes?: string;
  electricalActuationSocketNotes?: string;
  electricalActuationLockNotes?: string;
  electricalActuationTrunkNotes?: string;
  electricalActuationWiperNotes?: string;
  electricalActuationKeyNotes?: string;
  electricalActuationAlarmNotes?: string;
  electricalActuationInteriorLightNotes?: string;
  dashboardPanelNotes?: string;
  lightsNotes?: string;
  batteryNotes?: string;
  airConditioningNotes?: string;
  airConditioningCompressorNotes?: string;
  airConditioningCleaningNotes?: string;
}

export interface ElectricalOutput {
  electrical_condition: ChecklistStatus;
  electrical_notes: string | null;
  battery_voltage: null;
  alternator_condition: null;
}

export class ElectricalMapper {
  public static map(input: ElectricalInput): ElectricalOutput {
    const electrical_condition = worstStatus([
      input.electricalActuationGlass,
      input.electricalActuationMirror,
      input.electricalActuationSocket,
      input.electricalActuationLock,
      input.electricalActuationTrunk,
      input.electricalActuationWiper,
      input.electricalActuationKey,
      input.electricalActuationAlarm,
      input.electricalActuationInteriorLight,
      input.dashboardPanel,
      input.lights,
      input.battery,
      input.airConditioning,
      input.airConditioningCompressor,
      input.airConditioningCleaning,
    ]);

    const electrical_notes = concatNotes([
      input.electricalActuationGlassNotes,
      input.electricalActuationMirrorNotes,
      input.electricalActuationSocketNotes,
      input.electricalActuationLockNotes,
      input.electricalActuationTrunkNotes,
      input.electricalActuationWiperNotes,
      input.electricalActuationKeyNotes,
      input.electricalActuationAlarmNotes,
      input.electricalActuationInteriorLightNotes,
      input.dashboardPanelNotes,
      input.lightsNotes,
      input.batteryNotes,
      input.airConditioningNotes,
      input.airConditioningCompressorNotes,
      input.airConditioningCleaningNotes,
    ]);

    return {
      electrical_condition,
      electrical_notes,
      battery_voltage: null,
      alternator_condition: null,
    };
  }
}
