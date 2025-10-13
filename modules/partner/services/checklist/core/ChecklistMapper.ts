import { WORKFLOW_STATUS } from '@/modules/partner/constants/checklist';
import { ChecklistRecord } from '../types';
import { MotorMapper } from '../mappers/MotorMapper';
import { TransmissionMapper } from '../mappers/TransmissionMapper';
import { BrakesMapper } from '../mappers/BrakesMapper';
import { SuspensionMapper } from '../mappers/SuspensionMapper';
import { TiresMapper } from '../mappers/TiresMapper';
import { ElectricalMapper } from '../mappers/ElectricalMapper';
import { BodyInteriorMapper } from '../mappers/BodyInteriorMapper';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class ChecklistMapper {
  /**
   * Mapeia payload do front para schema mechanics_checklist
   */
  public static toDatabase(input: any, partnerId: string): Partial<ChecklistRecord> {
    // Mapear cada seção usando mappers especializados
    const motor = MotorMapper.map(input);
    const transmission = TransmissionMapper.map(input);
    const brakes = BrakesMapper.map(input);
    const suspension = SuspensionMapper.map(input);
    const tires = TiresMapper.map(input);
    const electrical = ElectricalMapper.map(input);
    const bodyInterior = BodyInteriorMapper.map(input);

    return {
      // Identificação
      vehicle_id: input.vehicle_id,
      inspection_id: input.inspection_id || null,
      quote_id: input.quote_id || null,
      partner_id: partnerId,

      // Status
      status: input.status || WORKFLOW_STATUS.SUBMITTED,
      created_at: input.created_at || undefined,
      updated_at: new Date().toISOString(),

      // Seções mapeadas
      ...motor,
      ...transmission,
      ...brakes,
      ...suspension,
      ...tires,
      ...electrical,
      ...bodyInterior,

      // Campos gerais
      fluids_notes: input.fluidsNotes || null,
      general_observations: input.observations || null,
    };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
