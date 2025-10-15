import { worstStatus } from '../utils/statusNormalizer';
import { concatNotes } from '../utils/notesAggregator';
import { ChecklistStatus } from '../types';

export interface TransmissionInput {
  clutch?: string;
  gearShift?: string;
  clutchNotes?: string;
  gearShiftNotes?: string;
}

export interface TransmissionOutput {
  transmission_condition: ChecklistStatus;
  transmission_notes: string | null;
}

export class TransmissionMapper {
  public static map(input: TransmissionInput): TransmissionOutput {
    const transmission_condition = worstStatus([input.clutch, input.gearShift]);
    const transmission_notes = concatNotes([input.clutchNotes, input.gearShiftNotes]);

    return { transmission_condition, transmission_notes };
  }
}
