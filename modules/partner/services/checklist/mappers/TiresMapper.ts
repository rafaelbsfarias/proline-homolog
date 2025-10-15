import { worstStatus } from '../utils/statusNormalizer';
import { concatNotes } from '../utils/notesAggregator';
import { ChecklistStatus } from '../types';

export interface TiresInput {
  frontLeftTire?: string;
  frontRightTire?: string;
  rearLeftTire?: string;
  rearRightTire?: string;
  spareTire?: string;
  frontLeftTireNotes?: string;
  frontRightTireNotes?: string;
  rearLeftTireNotes?: string;
  rearRightTireNotes?: string;
  spareTireNotes?: string;
}

export interface TiresOutput {
  tires_condition: ChecklistStatus;
  tires_notes: string | null;
}

export class TiresMapper {
  public static map(input: TiresInput): TiresOutput {
    const tires_condition = worstStatus([
      input.frontLeftTire,
      input.frontRightTire,
      input.rearLeftTire,
      input.rearRightTire,
      input.spareTire,
    ]);

    const tires_notes = concatNotes([
      input.frontLeftTireNotes,
      input.frontRightTireNotes,
      input.rearLeftTireNotes,
      input.rearRightTireNotes,
      input.spareTireNotes,
    ]);

    return { tires_condition, tires_notes };
  }
}
