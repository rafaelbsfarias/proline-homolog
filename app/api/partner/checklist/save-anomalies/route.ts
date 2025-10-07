import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:checklist:save-anomalies');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const inspection_id = formData.get('inspection_id') as string;
    const vehicle_id = formData.get('vehicle_id') as string;
    const anomaliesJson = formData.get('anomalies') as string;

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

    if (!anomaliesJson) {
      return NextResponse.json(
        { success: false, error: 'anomalies é obrigatório' },
        { status: 400 }
      );
    }

    let anomalies;
    try {
      anomalies = JSON.parse(anomaliesJson);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'anomalies deve ser um JSON válido' },
        { status: 400 }
      );
    }

    if (!Array.isArray(anomalies)) {
      return NextResponse.json(
        { success: false, error: 'anomalies deve ser um array' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();
    logger.info('save_anomalies_start', {
      inspection_id,
      vehicle_id,
      anomalies_count: anomalies.length,
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
    const { data: accessCheck, error: accessError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        service_orders!inner(vehicle_id)
      `
      )
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

    // Processar anomalias e fazer upload das imagens
    const processedAnomalies = [];

    for (let i = 0; i < anomalies.length; i++) {
      const anomaly = anomalies[i];
      const description = anomaly.description?.trim();

      if (!description) continue; // Pular anomalias sem descrição

      const photos = anomaly.photos || [];
      const uploadedPhotoUrls: string[] = [];

      // Fazer upload das fotos para o bucket
      for (let j = 0; j < photos.length; j++) {
        const photoKey = `anomaly-${i}-photo-${j}`;
        const photoFile = formData.get(photoKey) as File;

        if (photoFile && photoFile instanceof File) {
          try {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${photoFile.name.split('.').pop()}`;
            const filePath = `anomalies/${inspection_id}/${vehicle_id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('vehicle-media')
              .upload(filePath, photoFile, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              logger.error('photo_upload_error', {
                error: uploadError.message,
                fileName,
                inspection_id,
                vehicle_id,
              });
              // Continuar sem esta foto, não falhar toda a operação
              continue;
            }

            // Obter URL pública da imagem
            const { data: urlData } = supabase.storage.from('vehicle-media').getPublicUrl(filePath);

            if (urlData?.publicUrl) {
              uploadedPhotoUrls.push(urlData.publicUrl);
            }
          } catch (uploadErr) {
            logger.error('photo_upload_exception', {
              error: String(uploadErr),
              photoKey,
              inspection_id,
              vehicle_id,
            });
            // Continuar sem esta foto
          }
        }
      }

      processedAnomalies.push({
        inspection_id,
        vehicle_id,
        description,
        photos: uploadedPhotoUrls,
      });
    }

    logger.debug('anomalies_processed', {
      valid_anomalies: processedAnomalies.length,
      total_received: anomalies.length,
    });

    // Remover anomalias existentes para este inspection_id e vehicle_id
    const { error: deleteError } = await supabase
      .from('vehicle_anomalies')
      .delete()
      .eq('inspection_id', inspection_id)
      .eq('vehicle_id', vehicle_id);

    if (deleteError) {
      logger.error('delete_existing_anomalies_error', {
        error: deleteError.message,
        inspection_id,
        vehicle_id,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao limpar anomalias existentes' },
        { status: 500 }
      );
    }

    // Inserir novas anomalias se houver
    if (processedAnomalies.length > 0) {
      const { data, error: insertError } = await supabase
        .from('vehicle_anomalies')
        .insert(processedAnomalies)
        .select('*');

      if (insertError) {
        logger.error('insert_anomalies_error', {
          error: insertError.message,
          inspection_id,
          vehicle_id,
        });
        return NextResponse.json(
          { success: false, error: 'Erro ao salvar anomalias' },
          { status: 500 }
        );
      }

      logger.info('anomalies_saved_successfully', {
        count: processedAnomalies.length,
        inspection_id,
        vehicle_id,
      });

      return NextResponse.json({
        success: true,
        data: data,
        message: `${processedAnomalies.length} anomalia(s) salva(s) com sucesso`,
      });
    } else {
      logger.info('no_valid_anomalies_to_save', {
        inspection_id,
        vehicle_id,
      });

      return NextResponse.json({
        success: true,
        data: [],
        message: 'Nenhuma anomalia válida para salvar',
      });
    }
  } catch (e) {
    const error = e as Error;
    logger.error('save_anomalies_unexpected_error', {
      error: error.message || String(e),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
