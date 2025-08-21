// modules/client/types/index.ts

export interface VehicleData {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  status: string;
  created_at: string;
  fipe_value?: number;
  current_odometer?: number;
  fuel_level?: string;
  estimated_arrival_date?: string | null;
  pickup_address_id?: string | null;
}

export interface VehicleItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  status?: string;
  created_at: string;
  fipe_value?: number;
  current_odometer?: number;
  fuel_level?: string;
  estimated_arrival_date?: string | null;
  pickup_address_id?: string | null;
}

export interface AddressItem {
  id: string;
  profile_id: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  complement: string | null;
  is_collect_point: boolean;
  is_main_address: boolean;
  created_at: string;
}

export interface ClientData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  parqueamento?: number;
  taxa_operacao?: number;
}

export type UserRole = 'admin' | 'client' | 'specialist' | 'partner';

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistFormData {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  exterior: 'ok' | 'attention' | 'critical';
  interior: 'ok' | 'attention' | 'critical';
  tires: 'ok' | 'attention' | 'critical';
  brakes: 'ok' | 'attention' | 'critical';
  lights: 'ok' | 'attention' | 'critical';
  fluids: 'ok' | 'attention' | 'critical';
  engine: 'ok' | 'attention' | 'critical';
  suspension: 'ok' | 'attention' | 'critical';
  battery: 'ok' | 'attention' | 'critical';
  observations: string;
  services: {
    mechanics: { required: boolean; notes: string };
    bodyPaint: { required: boolean; notes: string };
    washing: { required: boolean; notes: string };
    tires: { required: boolean; notes: string };
  };
}

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

export type Method = 'collect_point' | 'bring_to_yard';