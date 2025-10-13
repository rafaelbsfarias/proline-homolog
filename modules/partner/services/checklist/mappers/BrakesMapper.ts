import { worstStatus } from '../utils/statusNormalizer';
import { concatNotes } from '../utils/notesAggregator';
import { ChecklistStatus } from '../types';

export interface BrakesInput {
  brakePads?: string;
  brakeDiscs?: string;
  brakePadsNotes?: string;
  brakeDiscsNotes?: string;
  brake_pads_front?: number | null;
  brake_pads_rear?: number | null;
}

export interface BrakesOutput {
  brakes_condition: ChecklistStatus;
  brakes_notes: string | null;
  brake_pads_front: number | null;
  brake_pads_rear: number | null;
  brake_discs_front_condition: null;
  brake_discs_rear_condition: null;
}

export class BrakesMapper {
  public static map(input: BrakesInput): BrakesOutput {
    const brakes_condition = worstStatus([input.brakePads, input.brakeDiscs]);
    const brakes_notes = concatNotes([input.brakePadsNotes, input.brakeDiscsNotes]);

    return {
      brakes_condition,
      brakes_notes,
      brake_pads_front: input.brake_pads_front ?? null,
      brake_pads_rear: input.brake_pads_rear ?? null,
      brake_discs_front_condition: null,
      brake_discs_rear_condition: null,
    };
  }
}
