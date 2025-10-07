import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:checklist:load-anomalies');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inspection_id = searchParams.get('inspection_id');
    const vehicle_id = searchParams.get('vehicle_id');

    if (!inspection_id) {
      return NextResponse.json(
        { success: false, error: 'inspection_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!vehicle_id) {
      return NextResponse.json(
        { success: false, error: 'vehicle_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();
    logger.info('load_anomalies_start', {
      inspection_id,
      vehicle_id,
    });

    // Determinar partner_id a partir do token do usuário
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;

    let partnerId: string | undefined;
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      partnerId = userData.user?.id;
    }
    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o partner tem acesso ao vehicle através de quotes
    // Temporariamente desabilitado para debug
    /*
    const { data: accessCheck, error: accessError } = await supabase
      .from('quotes')
      .select(`
        id,
        service_orders!inner(vehicle_id)
      `)
      .eq('partner_id', partnerId)
      .eq('service_orders.vehicle_id', vehicle_id)
      .limit(1);

    if (accessError || !accessCheck || accessCheck.length === 0) {
      logger.warn('partner_access_denied', {
        partner_id: partnerId,
        vehicle_id,
        error: accessError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Acesso negado: partner não tem permissão para este veículo' },
        { status: 403 }
      );
    }
    */

    // Buscar anomalias existentes
    const { data: anomalies, error: anomaliesError } = await supabase
      .from('vehicle_anomalies')
      .select('*')
      .eq('inspection_id', inspection_id)
      .eq('vehicle_id', vehicle_id)
      .order('created_at', { ascending: true });

    if (anomaliesError) {
      logger.error('load_anomalies_error', {
        error: anomaliesError.message,
        inspection_id,
        vehicle_id,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao carregar anomalias' },
        { status: 500 }
      );
    }

    logger.info('anomalies_loaded_successfully', {
      count: anomalies?.length || 0,
      inspection_id,
      vehicle_id,
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
