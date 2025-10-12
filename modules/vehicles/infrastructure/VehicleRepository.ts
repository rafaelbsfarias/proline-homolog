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

const supabase = SupabaseService.getInstance().getAdminClient();

// Removido scan recursivo do Storage para evitar mistura de mídias

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
    const { data: insp, error } = await supabase
      .from('inspections')
      .select('id, inspection_date, odometer, fuel_level, observations, finalized')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message || 'Erro ao buscar inspeção');

    // Buscar mídias associadas à inspeção no banco (sem varrer storage)
    let inspectionDbMedia: { storage_path: string; uploaded_by: string; created_at: string }[] = [];
    if (insp) {
      const { data: media, error: mediaError } = await supabase
        .from('inspection_media')
        // Join com profiles para permitir filtro por role (especialista)
        .select('storage_path, uploaded_by, created_at, profiles!inner(role)')
        .eq('inspection_id', insp.id)
        .eq('profiles.role', 'specialist')
        .order('created_at', { ascending: false });

      if (mediaError) {
        // Se join falhar por relação, cair para seleção simples
        const { data: fallbackMedia } = await supabase
          .from('inspection_media')
          .select('storage_path, uploaded_by, created_at')
          .eq('inspection_id', insp.id)
          .order('created_at', { ascending: false });
        inspectionDbMedia = fallbackMedia || [];
      } else if (media) {
        // Remover campo profiles da resposta
        inspectionDbMedia = media.map(m => ({
          storage_path: (m as any).storage_path,
          uploaded_by: (m as any).uploaded_by,
          created_at: (m as any).created_at,
        }));
      }
    }

    // Se não encontramos nem inspeção nem mídia, retornamos nulo
    if (!insp && inspectionDbMedia.length === 0) {
      return null;
    }

    // Se tivermos uma inspeção, buscamos os serviços
    let services: any[] = [];
    if (insp) {
      const { data: srv } = await supabase
        .from('inspection_services')
        .select('category, required, notes')
        .eq('inspection_id', insp.id);
      services = srv || [];
    }

    // Retorna o objeto combinado
    return {
      ...(insp || { id: vehicleId }), // Usa o ID do veículo se não houver inspeção
      services: services,
      media: inspectionDbMedia,
    } as InspectionRecord;
  }
}
