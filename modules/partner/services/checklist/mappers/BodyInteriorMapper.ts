import { worstStatus } from '../utils/statusNormalizer';
import { concatNotes } from '../utils/notesAggregator';
import { ChecklistStatus } from '../types';

export interface BodyInteriorInput {
  bodywork?: string;
  paint?: string;
  seats?: string;
  carpets?: string;
  dashboard?: string;
  headliner?: string;
  bodyworkNotes?: string;
  paintNotes?: string;
  seatsNotes?: string;
  carpetsNotes?: string;
  dashboardNotes?: string;
  headlinerNotes?: string;
}

export interface BodyInteriorOutput {
  bodywork_condition: ChecklistStatus;
  bodywork_notes: string | null;
}

export class BodyInteriorMapper {
  public static map(input: BodyInteriorInput): BodyInteriorOutput {
    const bodywork_condition = worstStatus([
      input.bodywork,
      input.paint,
      input.seats,
      input.carpets,
      input.dashboard,
      input.headliner,
    ]);

    const bodywork_notes = concatNotes([
      input.bodyworkNotes,
      input.paintNotes,
      input.seatsNotes,
      input.carpetsNotes,
      input.dashboardNotes,
      input.headlinerNotes,
    ]);

    return { bodywork_condition, bodywork_notes };
  }
}
