export interface AnomalyEvidence {
  id: string;
  description: string;
  photos: (File | string)[];
  partRequest?: PartRequest;
}

export interface PartRequest {
  partName: string;
  partDescription?: string;
  quantity: number;
  estimatedPrice?: number;
  purchaseLink?: string;
}

export interface PartRequestModalState {
  isOpen: boolean;
  anomalyId: string | null;
  partName: string;
  partDescription: string;
  quantity: number;
  estimatedPrice: string;
  purchaseLink: string;
}

export interface VehicleInfo {
  brand: string;
  model: string;
  year?: number;
  plate: string;
  color?: string;
}

export interface InspectionFormData {
  date: string;
  odometer: number;
  fuelLevel: string;
  observations: string;
}
