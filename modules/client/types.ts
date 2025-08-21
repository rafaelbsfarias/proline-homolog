// Vehicle type aligned via alias to shared definition

export interface AddressItem {
  id: string;
  street: string | null;
  number: string | null;
  city: string | null;
  is_collect_point: boolean;
}

export type Method = 'collect_point' | 'bring_to_yard';

// Re-export types from the directory index to align with imports
export type { VehicleItem } from './types/index';

// Alias Vehicle to the shared VehicleItem shape to keep API consistent
export type Vehicle = import('./types/index').VehicleItem;
