import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { MediaUploadService } from '@/modules/common/services/MediaUploadService';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:save-anomalies');

// Validação do FormData
const SaveAnomaliesSchema = z
  .object({
    inspection_id: z.string().uuid('ID da inspeção inválido').optional(), // Agora opcional (legacy)
    quote_id: z.string().uuid('ID do quote inválido').optional(), // Novo campo
    vehicle_id: z.string().uuid('ID do veículo inválido'),
    anomalies: z.string().min(1, 'anomalies é obrigatório'),
  })
  .refine(data => data.inspection_id || data.quote_id, {
    message: 'É necessário fornecer inspection_id (legacy) ou quote_id',
    path: ['inspection_id', 'quote_id'],
  });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function saveAnomaliesHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const inspection_id = formData.get('inspection_id') as string | null;
    const quote_id = formData.get('quote_id') as string | null;
    const vehicle_id = formData.get('vehicle_id') as string;
    const anomaliesJson = formData.get('anomalies') as string;

    // Converter null para undefined para validação Zod
    const validationInput = {
      inspection_id: inspection_id || undefined,
      quote_id: quote_id || undefined,
      vehicle_id,
      anomalies: anomaliesJson,
    };

    // Validar entrada
    const validation = SaveAnomaliesSchema.safeParse(validationInput);

    if (!validation.success) {
      logger.warn('validation_error', {
        errors: validation.error.errors,
        input: validationInput,
      });
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    let anomalies;
    try {
      anomalies = JSON.parse(anomaliesJson);
    } catch {
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

    const supabase = SupabaseService.getInstance().getAdminClient();
    const mediaService = MediaUploadService.getInstance();
    const partnerId = req.user.id;

    logger.info('save_anomalies_start', {
      inspection_id,
      quote_id,
      vehicle_id,
      anomalies_count: anomalies.length,
    });

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

    // Resolver a categoria com base no próprio parceiro logado (fonte de verdade)
    // Evita depender de joins de SO e elimina fallback indevido
    let resolvedCategoryName: string | null = null;
    try {
      const { data: partner } = await supabase
        .from('partners')
        .select('category')
        .eq('profile_id', partnerId)
        .maybeSingle();

      const { normalizePartnerCategoryName } = await import('@/modules/partner/utils/category');
      const normalized = normalizePartnerCategoryName(
        partner?.category ? [partner.category] : undefined
      );
      resolvedCategoryName = normalized && normalized !== 'Parceiro' ? normalized : null;
    } catch (e) {
      logger.warn('partner_category_lookup_error', {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    if (!resolvedCategoryName) {
      // Bloqueia a operação para rastrear inconsistências de categoria
      return NextResponse.json(
        { success: false, error: 'Categoria do parceiro não identificada' },
        { status: 422 }
      );
    }

    // Processar anomalias e fazer upload das imagens
    const processedAnomalies = [];

    for (let i = 0; i < anomalies.length; i++) {
      const anomaly = anomalies[i];
      const description = anomaly.description?.trim();

      if (!description) continue; // Pular anomalias sem descrição

      const photos = anomaly.photos || [];
      const photoFiles: File[] = [];
      const existingPhotoPaths: string[] = [];

      // Separar arquivos novos de URLs existentes
      for (let j = 0; j < photos.length; j++) {
        const photoKey = `anomaly-${i}-photo-${j}`;
        const photoRef = photos[j];

        logger.debug('processing_photo_reference', {
          anomaly_index: i,
          photo_index: j,
          photo_ref_type: typeof photoRef,
          is_string: typeof photoRef === 'string',
          ref_value: typeof photoRef === 'string' ? photoRef.substring(0, 100) : 'File',
          starts_with_anomaly: typeof photoRef === 'string' && photoRef.startsWith('anomaly-'),
        });

        // Se for uma string (URL/path existente), manter
        if (typeof photoRef === 'string' && !photoRef.startsWith('anomaly-')) {
          existingPhotoPaths.push(photoRef);
          logger.debug('photo_marked_as_existing', {
            anomaly_index: i,
            photo_index: j,
            path: photoRef.substring(0, 100),
          });
        } else {
          // Caso contrário, buscar o arquivo no FormData
          const photoFile = formData.get(photoKey) as File;
          if (photoFile && photoFile instanceof File) {
            photoFiles.push(photoFile);
            logger.debug('photo_file_found_in_formdata', {
              anomaly_index: i,
              photo_index: j,
              file_name: photoFile.name,
              file_size: photoFile.size,
            });
          } else {
            logger.warn('photo_file_not_found_in_formdata', {
              anomaly_index: i,
              photo_index: j,
              photo_key: photoKey,
            });
          }
        }
      }

      // Fazer upload usando MediaUploadService apenas para novos arquivos
      let uploadedPhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        const uploadResults = await mediaService.uploadMultipleFiles(
          photoFiles,
          {
            bucket: 'vehicle-media',
            // Padrão unificado: <vehicle_id>/<partner_id>/anomalias
            folder: `${vehicle_id}/${partnerId}/anomalias`,
            allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
            maxSizeBytes: 10 * 1024 * 1024, // 10MB por foto
            cacheControl: '3600',
            upsert: false,
          },
          {
            inspection_id,
            vehicle_id,
            anomaly_index: String(i),
            partner_id: partnerId,
          }
        );

        // Coletar apenas os uploads bem-sucedidos
        uploadedPhotoUrls = uploadResults
          .filter(r => r.success && r.result)
          .map(r => r.result!.path);

        // Logar erros de upload individual
        uploadResults.forEach((r, idx) => {
          if (!r.success) {
            logger.warn('anomaly_photo_upload_failed', {
              anomaly_index: i,
              photo_index: idx,
              error: r.error,
            });
          }
        });
      }

      // Combinar fotos existentes com novas fotos
      const allPhotoPaths = [...existingPhotoPaths, ...uploadedPhotoUrls];

      logger.debug('anomaly_photos_processed', {
        anomaly_index: i,
        existing_photos: existingPhotoPaths.length,
        new_uploads: uploadedPhotoUrls.length,
        total: allPhotoPaths.length,
      });

      processedAnomalies.push({
        vehicle_id,
        partner_id: partnerId, // Adicionar partner_id para identificar quem criou a anomalia
        description,
        photos: allPhotoPaths,
        status: 'submitted', // Status indicando que foi submetido através do checklist
        // Adicionar quote_id (novo) ou inspection_id (legacy)
        ...(quote_id ? { quote_id } : {}),
        ...(inspection_id ? { inspection_id } : {}),
        // Manter referência da solicitação de peça para processar depois
        partRequest: anomaly.partRequest,
      });
    }

    logger.debug('anomalies_processed', {
      valid_anomalies: processedAnomalies.length,
      total_received: anomalies.length,
    });

    // Remover anomalias existentes para este vehicle_id e quote_id ou inspection_id
    let deleteQuery = supabase
      .from('vehicle_anomalies')
      .delete()
      .eq('vehicle_id', vehicle_id)
      .eq('partner_id', partnerId);

    // Usar quote_id se disponível (novo), senão inspection_id (legacy)
    if (quote_id) {
      deleteQuery = deleteQuery.eq('quote_id', quote_id);
    } else if (inspection_id) {
      deleteQuery = deleteQuery.eq('inspection_id', inspection_id);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      logger.error('delete_existing_anomalies_error', {
        error: deleteError.message,
        inspection_id,
        quote_id,
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
        .insert(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          processedAnomalies.map(({ partRequest, ...anomaly }) => anomaly) // Remove partRequest antes de inserir
        )
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
        quote_id,
        vehicle_id,
      });

      // Salvar solicitações de peças associadas
      const partRequestsToInsert = [];
      for (let i = 0; i < processedAnomalies.length; i++) {
        const anomaly = processedAnomalies[i];
        const savedAnomaly = data[i];

        if (anomaly.partRequest && savedAnomaly) {
          partRequestsToInsert.push({
            anomaly_id: savedAnomaly.id,
            vehicle_id: vehicle_id,
            partner_id: partnerId,
            part_name: anomaly.partRequest.partName,
            part_description: anomaly.partRequest.partDescription || null,
            quantity: anomaly.partRequest.quantity,
            estimated_price: anomaly.partRequest.estimatedPrice || null,
            status: 'pending',
          });
        }
      }

      // Remover solicitações de peças existentes para estas anomalias
      if (data.length > 0) {
        const anomalyIds = data.map(a => a.id);
        await supabase.from('part_requests').delete().in('anomaly_id', anomalyIds);
      }

      // Inserir novas solicitações de peças
      if (partRequestsToInsert.length > 0) {
        const { error: partRequestError } = await supabase
          .from('part_requests')
          .insert(partRequestsToInsert);

        if (partRequestError) {
          logger.error('insert_part_requests_error', {
            error: partRequestError.message,
            count: partRequestsToInsert.length,
          });
          // Não falhar a requisição - anomalias já foram salvas
        } else {
          logger.info('part_requests_saved_successfully', {
            count: partRequestsToInsert.length,
          });
        }
      }

      // Criar entrada na timeline "Fase Orçamentária Iniciada - {categoria}"
      // se ainda não existir (importante para dynamic-checklist que não passa por /submit)
      try {
        const categoryName = resolvedCategoryName; // já resolvida acima (sem fallback)
        const timelineStatus = `Fase Orçamentária Iniciada - ${categoryName}`;

        // Verificar se já existe este status na timeline para evitar duplicatas
        const { data: existingHistory } = await supabase
          .from('vehicle_history')
          .select('id')
          .eq('vehicle_id', vehicle_id)
          .eq('status', timelineStatus)
          .maybeSingle();

        // Se não existe, criar novo registro na timeline
        if (!existingHistory) {
          const { error: historyError } = await supabase.from('vehicle_history').insert({
            vehicle_id: vehicle_id,
            status: timelineStatus,
            partner_service: categoryName,
            prevision_date: null,
            end_date: null,
            created_at: new Date().toISOString(),
          });

          if (historyError) {
            logger.error('timeline_insert_error', { error: historyError.message });
          } else {
            logger.info('timeline_created', {
              vehicle_id: vehicle_id.slice(0, 8),
              status: timelineStatus,
              partner_id: partnerId.slice(0, 8),
            });

            // Atualizar status do veículo para 'FASE ORÇAMENTÁRIA'
            const { error: statusUpdateError } = await supabase
              .from('vehicles')
              .update({ status: 'FASE ORÇAMENTÁRIA' })
              .eq('id', vehicle_id);

            if (statusUpdateError) {
              logger.error('vehicle_status_update_error', { error: statusUpdateError.message });
            } else {
              logger.info('vehicle_status_updated', {
                vehicle_id: vehicle_id.slice(0, 8),
                new_status: 'FASE ORÇAMENTÁRIA',
              });
            }
          }
        } else {
          logger.info('timeline_entry_already_exists', {
            vehicle_id: vehicle_id.slice(0, 8),
            status: timelineStatus,
          });
        }
      } catch (timelineError) {
        logger.error('timeline_or_status_update_error', {
          error: timelineError instanceof Error ? timelineError.message : String(timelineError),
        });
        // Não falhar a requisição principal por causa da timeline/status
      }

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

export const POST = withPartnerAuth(saveAnomaliesHandler);
