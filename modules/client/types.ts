export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  created_at: string;
  pickup_address_id?: string | null;
  estimated_arrival_date?: string | null;
}

export interface AddressItem {
  id: string;
  street: string | null;
  number: string | null;
  city: string | null;
  is_collect_point: boolean;
}

export type Method = 'collect_point' | 'bring_to_yard';

