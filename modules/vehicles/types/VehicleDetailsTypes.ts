export interface AnomalyEvidence {
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

export interface VehicleDetails {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: string;
  created_at: string;
  fipe_value?: number;
  current_odometer?: number;
  fuel_level?: string;
  estimated_arrival_date?: string;
  preparacao?: boolean;
  comercializacao?: boolean;
  observations?: string;
}

export interface InspectionData {
  id: string;
  inspection_date: string;
  odometer: number;
  fuel_level: string;
  observations: string;
  finalized: boolean;
  services: ServiceData[];
  media: MediaData[];
}

export interface ServiceData {
  category: string;
  required: boolean;
  notes: string;
}

export interface MediaData {
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface VehicleDetailsProps {
  vehicle: VehicleDetails | null;
  inspection: InspectionData | null;
  mediaUrls: Record<string, string>;
  loading: boolean;
  error: string | null;
}
