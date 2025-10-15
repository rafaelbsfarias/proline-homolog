export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Evidence {
  id?: string;
  quote_item_id: string;
  image_url: string;
  description: string;
  uploaded_at?: string;
}

export interface ServiceWithEvidences extends QuoteItem {
  evidences: Evidence[];
}

export interface VehicleInfo {
  plate: string;
  brand: string;
  model: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ServiceOrderResponse {
  ok: boolean;
  serviceOrder?: {
    vehicle: VehicleInfo;
    items: QuoteItem[];
    evidences?: Evidence[];
  };
  error?: string;
}
