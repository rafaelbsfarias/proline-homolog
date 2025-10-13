import { worstStatus } from '../utils/statusNormalizer';
import { concatNotes } from '../utils/notesAggregator';
import { ChecklistStatus } from '../types';

export interface SuspensionInput {
  shockAbsorbers?: string;
  springs?: string;
  shockAbsorbersNotes?: string;
  springsNotes?: string;
}

export interface SuspensionOutput {
  suspension_condition: ChecklistStatus;
  suspension_notes: string | null;
}

export class SuspensionMapper {
  public static map(input: SuspensionInput): SuspensionOutput {
    const suspension_condition = worstStatus([input.shockAbsorbers, input.springs]);
    const suspension_notes = concatNotes([input.shockAbsorbersNotes, input.springsNotes]);

    return { suspension_condition, suspension_notes };
  }
}
