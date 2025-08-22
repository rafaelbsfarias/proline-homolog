// modules/vehicles/components/types.ts

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  fipe_value?: number;
  initialKm?: number;
  observations?: string;
  estimated_arrival_date?: string;
  status: string;
  created_at: string;
  client?: { id: string; full_name: string; email: string };
}

export type UserRole = 'admin' | 'client';

export type FieldKey =
  | 'plate' | 'brand' | 'model' | 'year' | 'color'
  | 'initialKm' | 'fipe_value'
  | 'estimated_arrival_date' | 'observations';

export interface VehicleRegistrationBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (vehicle?: Vehicle) => void;
  userRole: UserRole;
  hiddenFields?: FieldKey[];
}

export interface VehicleFormData {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | '';
  initialKm: number | '';
  fipe_value: number | '';
  observations: string;
  estimated_arrival_date: string;
}

export interface FormErrors {
  clientId?: string;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string;
  initialKm?: string;
  fipe_value?: string;
  estimated_arrival_date?: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
}
