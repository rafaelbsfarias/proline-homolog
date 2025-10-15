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
  // Campos desabilitados por incompatibilidade com o schema atual
  // bodywork_condition: ChecklistStatus;
  // bodywork_notes: string | null;
}

export class BodyInteriorMapper {
  public static map(_input: BodyInteriorInput): BodyInteriorOutput {
    // Retorna objeto vazio para não enviar colunas inexistentes (bodywork_condition/bodywork_notes)
    // Evita erro: "Could not find 'bodywork_condition' column in mechanics_checklist"
    return {} as BodyInteriorOutput;
  }
}
