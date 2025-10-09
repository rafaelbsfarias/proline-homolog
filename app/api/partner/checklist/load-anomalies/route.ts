import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:load-anomalies');

// Schema de validação
const LoadAnomaliesSchema = z.object({
  inspection_id: z.string().uuid('inspection_id deve ser um UUID válido'),
  vehicle_id: z.string().uuid('vehicle_id deve ser um UUID válido'),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadAnomaliesHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspection_id = searchParams.get('inspection_id');
    const vehicle_id = searchParams.get('vehicle_id');

    // Validação com Zod
    const validation = LoadAnomaliesSchema.safeParse({
      inspection_id,
      vehicle_id,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { inspection_id: validInspectionId, vehicle_id: validVehicleId } = validation.data;
    const partnerId = req.user.id;

    const supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('load_anomalies_start', {
      inspection_id: validInspectionId,
      vehicle_id: validVehicleId,
      partner_id: partnerId,
    });

    // Buscar anomalias existentes
    const { data: anomalies, error: anomaliesError } = await supabase
      .from('vehicle_anomalies')
      .select('*')
      .eq('inspection_id', validInspectionId)
      .eq('vehicle_id', validVehicleId)
      .order('created_at', { ascending: true });

    if (anomaliesError) {
      logger.error('load_anomalies_error', {
        error: anomaliesError.message,
        inspection_id: validInspectionId,
        vehicle_id: validVehicleId,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao carregar anomalias' },
        { status: 500 }
      );
    }

    logger.info('anomalies_loaded_successfully', {
      count: anomalies?.length || 0,
      inspection_id: validInspectionId,
      vehicle_id: validVehicleId,
    });

    // Converter para o formato esperado pelo frontend
    // Gerar URLs assinadas para as imagens (válidas por 1 hora)
    const formattedAnomalies = await Promise.all(
      (anomalies || []).map(async anomaly => {
        const signedPhotos = await Promise.all(
          (anomaly.photos || []).map(async (photoPath: string) => {
            try {
              // Extrair o caminho da imagem (remover domínio/bucket se presente)
              let path = photoPath;

              // Se for uma URL completa, extrair apenas o path
              if (photoPath.includes('vehicle-media/')) {
                const parts = photoPath.split('vehicle-media/');
                path = parts[parts.length - 1];
              }

              // Se começar com barra, remover
              if (path.startsWith('/')) {
                path = path.substring(1);
              }

              const { data: signedData, error: signedError } = await supabase.storage
                .from('vehicle-media')
                .createSignedUrl(path, 3600); // 1 hora de validade

              if (signedError || !signedData) {
                logger.warn('failed_to_sign_url', {
                  original: photoPath,
                  extracted_path: path,
                  error: signedError?.message,
                });
                return photoPath; // Retorna o path original como fallback
              }

              return signedData.signedUrl;
            } catch (error) {
              logger.error('sign_url_exception', {
                path: photoPath,
                error: error instanceof Error ? error.message : String(error),
              });
              return photoPath;
            }
          })
        );

        return {
          id: anomaly.id,
          description: anomaly.description,
          photos: signedPhotos,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedAnomalies,
    });
  } catch (e) {
    const error = e as Error;
    logger.error('load_anomalies_unexpected_error', {
      error: error.message || String(e),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withPartnerAuth(loadAnomaliesHandler);
