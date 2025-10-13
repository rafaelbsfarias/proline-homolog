import { worstStatus } from '../utils/statusNormalizer';
import { concatNotes } from '../utils/notesAggregator';
import { ChecklistStatus } from '../types';

export interface MotorInput {
  engine?: string;
  radiator?: string;
  sparkPlugs?: string;
  belts?: string;
  exhaust?: string;
  engineNotes?: string;
  radiatorNotes?: string;
  sparkPlugsNotes?: string;
  beltsNotes?: string;
  exhaustNotes?: string;
}

export interface MotorOutput {
  motor_condition: ChecklistStatus;
  motor_notes: string | null;
}

export class MotorMapper {
  public static map(input: MotorInput): MotorOutput {
    const motor_condition = worstStatus([
      input.engine,
      input.radiator,
      input.sparkPlugs,
      input.belts,
      input.exhaust,
    ]);

    const motor_notes = concatNotes([
      input.engineNotes,
      input.radiatorNotes,
      input.sparkPlugsNotes,
      input.beltsNotes,
      input.exhaustNotes,
    ]);

    return { motor_condition, motor_notes };
  }
}
