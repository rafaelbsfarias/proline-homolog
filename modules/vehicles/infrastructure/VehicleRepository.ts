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

// 1. Modify the helper function to include created_at
async function listAllFiles(
  path: string
): Promise<{ storage_path: string; created_at: string | null }[]> {
  const bucketName = 'vehicle-media';
  let allFiles: { storage_path: string; created_at: string | null }[] = [];

  const { data: files, error } = await supabase.storage.from(bucketName).list(path);

  if (error) {
    console.error(`Erro ao listar arquivos em ${path}:`, error);
    return []; // Retorna array vazio em caso de erro para não quebrar a execução
  }

  for (const file of files) {
    const newPath = `${path}/${file.name}`;
    if (file.id === null) {
      // É uma pasta
      const subFiles = await listAllFiles(newPath);
      allFiles = allFiles.concat(subFiles);
    } else {
      // É um arquivo
      allFiles.push({ storage_path: newPath, created_at: file.created_at });
    }
  }
  return allFiles;
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
    const { data: insp, error } = await supabase
      .from('inspections')
      .select('id, inspection_date, odometer, fuel_level, observations, finalized')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message || 'Erro ao buscar inspeção');

    // --- LÓGICA DE BUSCA DE MÍDIA MODIFICADA ---

    // Passo 1: Buscar todas as mídias do storage de forma recursiva
    const allStorageMedia = await listAllFiles(vehicleId);

    // Passo 2: Se houver uma inspeção, buscar as mídias associadas a ela no DB
    let inspectionDbMedia: { storage_path: string; uploaded_by: string; created_at: string }[] = [];
    if (insp) {
      const { data: media } = await supabase
        .from('inspection_media')
        .select('storage_path, uploaded_by, created_at')
        .eq('inspection_id', insp.id)
        .order('created_at', { ascending: false });

      if (media) {
        inspectionDbMedia = media;
      }
    }

    // Passo 3: Unificar as duas listas de mídia usando um Map para evitar duplicatas
    const mediaMap = new Map<string, any>();

    // Adiciona primeiro a mídia do DB (que pode ter mais metadados como 'uploaded_by')
    inspectionDbMedia.forEach(item => mediaMap.set(item.storage_path, item));

    // Adiciona a mídia do storage, apenas se não existir ainda
    allStorageMedia.forEach(item => {
      if (!mediaMap.has(item.storage_path)) {
        // Adiciona um item básico, usando a data de criação do storage
        mediaMap.set(item.storage_path, {
          storage_path: item.storage_path,
          created_at: item.created_at,
          uploaded_by: null,
        });
      }
    });

    const combinedMedia = Array.from(mediaMap.values());

    // --- FIM DA LÓGICA DE MÍDIA ---

    // Se não encontramos nem inspeção nem mídia, retornamos nulo
    if (!insp && combinedMedia.length === 0) {
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
      media: combinedMedia,
    } as InspectionRecord;
  }
}
