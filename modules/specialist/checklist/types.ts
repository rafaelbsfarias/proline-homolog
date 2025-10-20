export type ChecklistStatus = 'ok' | 'attention' | 'critical';

export interface VehicleInfo {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  observations?: string;
  comercializacao?: boolean;
  preparacao?: boolean;
}

export interface ServicesFlags {
  mechanics: { required: boolean; notes: string };
  bodyPaint: { required: boolean; notes: string };
  washing: { required: boolean; notes: string };
  tires: { required: boolean; notes: string };
  loja: { required: boolean; notes: string };
  patioAtacado: { required: boolean; notes: string };
}

export interface ChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
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
  observations: '',
  services: {
    mechanics: { required: false, notes: '' },
    bodyPaint: { required: false, notes: '' },
    washing: { required: false, notes: '' },
    tires: { required: false, notes: '' },
    loja: { required: false, notes: '' },
    patioAtacado: { required: false, notes: '' },
  },
});
