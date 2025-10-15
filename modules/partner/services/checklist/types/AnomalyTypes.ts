export interface AnomalyRecord {
  id: string;
  vehicle_id: string;
  inspection_id?: string | null;
  quote_id?: string | null;
  description: string;
  photos: string[];
  created_at: string;
  part_requests?: PartRequestRecord[];
}

export interface PartRequestRecord {
  id: string;
  part_name: string;
  part_description: string | null;
  quantity: number;
  estimated_price: string | null;
  status: string;
}

export interface FormattedAnomaly {
  id: string;
  description: string;
  photos: string[];
  partRequest?: {
    partName: string;
    partDescription?: string;
    quantity: number;
    estimatedPrice?: number;
  };
}
