export interface ChecklistSubmissionData {
  vehicle_id: string;
  inspection_id: string;
  partner_id: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ChecklistSubmissionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export type ChecklistStatus = 'ok' | 'nok' | null;

export interface ChecklistRecord {
  id?: string;
  vehicle_id: string;
  inspection_id: string | null;
  quote_id?: string | null;
  partner_id: string;
  status: string;
  created_at?: string;
  updated_at: string;
  motor_condition: ChecklistStatus;
  motor_notes: string | null;
  transmission_condition: ChecklistStatus;
  transmission_notes: string | null;
  brakes_condition: ChecklistStatus;
  brakes_notes: string | null;
  brake_pads_front: number | null;
  brake_pads_rear: number | null;
  brake_discs_front_condition: null;
  brake_discs_rear_condition: null;
  suspension_condition: ChecklistStatus;
  suspension_notes: string | null;
  tires_condition: ChecklistStatus;
  tires_notes: string | null;
  electrical_condition: ChecklistStatus;
  electrical_notes: string | null;
  battery_voltage: null;
  alternator_condition: null;
  fluids_notes: string | null;
  general_observations: string | null;
}

export interface LoadChecklistOptions {
  inspection_id?: string | null;
  quote_id?: string | null;
  vehicle_id?: string;
  partner_id?: string;
}
