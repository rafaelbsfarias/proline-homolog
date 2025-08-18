export type ChecklistStatus = 'ok' | 'attention' | 'critical';

export interface VehicleInfo {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
}

export interface ServicesFlags {
  mechanics: { required: boolean; notes: string };
  bodyPaint: { required: boolean; notes: string };
  washing: { required: boolean; notes: string };
  tires: { required: boolean; notes: string };
}

export interface ChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  exterior: ChecklistStatus;
  interior: ChecklistStatus;
  tires: ChecklistStatus;
  brakes: ChecklistStatus;
  lights: ChecklistStatus;
  fluids: ChecklistStatus;
  engine: ChecklistStatus;
  suspension: ChecklistStatus;
  battery: ChecklistStatus;
  observations: string;
  services: ServicesFlags;
}

export const formatDateYYYYMMDD = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const buildDefaultForm = (today: string): ChecklistForm => ({
  date: today,
  odometer: '',
  fuelLevel: 'half',
  exterior: 'ok',
  interior: 'ok',
  tires: 'ok',
  brakes: 'ok',
  lights: 'ok',
  fluids: 'ok',
  engine: 'ok',
  suspension: 'ok',
  battery: 'ok',
  observations: '',
  services: {
    mechanics: { required: false, notes: '' },
    bodyPaint: { required: false, notes: '' },
    washing: { required: false, notes: '' },
    tires: { required: false, notes: '' },
  },
});
