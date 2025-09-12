import { SupabaseService } from '@/modules/common/services/SupabaseService';

export interface VehicleRecord {
  id: string;
  client_id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  status: string;
  created_at: string;
  fipe_value?: number | null;
  current_odometer?: number | null;
  fuel_level?: string | null;
  estimated_arrival_date?: string | null;
  preparacao?: boolean | null;
  comercializacao?: boolean | null;
}

export interface InspectionRecord {
  id: string;
  inspection_date: string;
  odometer: number;
  fuel_level: string;
  observations: string;
  finalized: boolean;
  services: Array<{ category: string; required: boolean; notes: string }>;
  media: Array<{ storage_path: string; uploaded_by: string; created_at: string }>;
}

export class VehicleRepository {
  static async getById(vehicleId: string): Promise<VehicleRecord | null> {
    const admin = SupabaseService.getInstance().getAdminClient();
    const { data, error } = await admin
      .from('vehicles')
      .select(
        [
          'id',
          'client_id',
          'plate',
          'brand',
          'model',
          'year',
          'color',
          'status',
          'created_at',
          'fipe_value',
          'current_odometer',
          'fuel_level',
          'estimated_arrival_date',
          'preparacao',
          'comercializacao',
        ].join(', ')
      )
      .eq('id', vehicleId)
      .maybeSingle();
    if (error) throw new Error(error.message || 'Erro ao buscar veículo');
    return (data as VehicleRecord) || null;
  }

  static async getLatestInspection(vehicleId: string): Promise<InspectionRecord | null> {
    const admin = SupabaseService.getInstance().getAdminClient();
    const { data: insp, error } = await admin
      .from('inspections')
      .select('id, inspection_date, odometer, fuel_level, observations, finalized')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message || 'Erro ao buscar inspeção');
    if (!insp) return null;

    const { data: services } = await admin
      .from('inspection_services')
      .select('category, required, notes')
      .eq('inspection_id', insp.id);

    const { data: media } = await admin
      .from('inspection_media')
      .select('storage_path, uploaded_by, created_at')
      .eq('inspection_id', insp.id)
      .order('created_at', { ascending: false });

    return {
      ...(insp as any),
      services: (services as any) || [],
      media: (media as any) || [],
    } as InspectionRecord;
  }
}
