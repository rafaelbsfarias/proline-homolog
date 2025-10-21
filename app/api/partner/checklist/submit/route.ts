import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ChecklistService } from '@/modules/partner/services/ChecklistService';
import { TABLES } from '@/modules/common/constants/database';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:submit');

// Schema de validação
const SubmitChecklistSchema = z
  .object({
    vehicle_id: z.string().uuid('ID do veículo inválido'),
    inspection_id: z.string().uuid('ID da inspeção inválido').optional(), // Agora opcional (legacy)
    quote_id: z.string().uuid('ID do quote inválido').optional(), // Novo campo
    // Demais campos são opcionais
  })
  .passthrough() // Permite campos adicionais
  .refine(data => data.inspection_id || data.quote_id, {
    message: 'É necessário fornecer inspection_id (legacy) ou quote_id',
    path: ['inspection_id', 'quote_id'],
  });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function submitChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const checklistData = await req.json();

    // Validar entrada
    const validation = SubmitChecklistSchema.safeParse(checklistData);
    if (!validation.success) {
      logger.warn('validation_error', { errors: validation.error.errors });
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const supabase = SupabaseService.getInstance().getAdminClient();
    const checklistService = ChecklistService.getInstance();
    const partnerId = req.user.id;

    logger.info('submit_start', {
      vehicle_id: checklistData.vehicle_id,
      inspection_id: checklistData.inspection_id,
      quote_id: checklistData.quote_id,
    });

    // Access control: garantir que o parceiro tem vínculo com o veículo (via quotes)
    try {
      const { data: accessCheck, error: accessError } = await supabase
        .from('quotes')
        .select(
          `
          id,
          service_orders!inner(vehicle_id)
        `
        )
        .eq('partner_id', partnerId)
        .eq('service_orders.vehicle_id', checklistData.vehicle_id)
        .limit(1);

      if (accessError || !accessCheck || accessCheck.length === 0) {
        logger.warn('partner_access_denied_submit', {
          partner_id: partnerId,
          vehicle_id: checklistData.vehicle_id,
          error: accessError?.message,
        });
        return NextResponse.json(
          { success: false, error: 'Acesso negado para este veículo' },
          { status: 403 }
        );
      }
    } catch (ace) {
      logger.warn('partner_access_check_error', {
        error: ace instanceof Error ? ace.message : String(ace),
      });
    }

    // Buscar categoria do parceiro
    let partnerCategory: string | null = null;
    try {
      const { data: partner } = await supabase
        .from('partners')
        .select('category')
        .eq('profile_id', partnerId)
        .single();
      partnerCategory = partner?.category || null;
    } catch (error) {
      logger.warn('failed_to_fetch_partner_category', {
        partner_id: partnerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Garantir que a categoria do parceiro está devidamente identificada
    // para compor a timeline sem fallback genérico
    let resolvedCategoryName: string | null = null;
    try {
      const { data: partnerCategories, error: categoryError } = await supabase.rpc(
        'get_partner_categories',
        { partner_id: partnerId }
      );
      const { normalizePartnerCategoryName } = await import('@/modules/partner/utils/category');
      if (categoryError) {
        logger.warn('category_fetch_error', { error: categoryError.message });
      }
      const cn = normalizePartnerCategoryName(partnerCategories);
      resolvedCategoryName = cn && cn !== 'Parceiro' ? cn : null;
    } catch (e) {
      logger.warn('category_resolution_exception', {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    if (!resolvedCategoryName) {
      return NextResponse.json(
        { success: false, error: 'Categoria do parceiro não identificada para compor a timeline' },
        { status: 422 }
      );
    }

    // VALIDAÇÃO REMOVIDA: O roteamento agora é feito no client baseado na categoria
    // Apenas parceiros de Mecânica devem chegar neste endpoint através do saveChecklist()

    // Mapear dados usando ChecklistService
    const mapped = checklistService.mapChecklistToMechanicsSchema(checklistData, partnerId);

    // Adicionar categoria do parceiro
    if (partnerCategory) {
      mapped.category = partnerCategory;
    }

    // Adicionar quote_id se fornecido (nova arquitetura)
    if (checklistData.quote_id) {
      mapped.quote_id = checklistData.quote_id;
    }

    logger.debug('mapped_payload', {
      vehicle_id: mapped.vehicle_id,
      inspection_id: mapped.inspection_id,
      quote_id: mapped.quote_id,
      status: mapped.status,
    });

    // Segmentação por parceiro: atualizar registro do próprio parceiro, senão inserir
    let existingId: string | null = null;
    {
      let base = supabase
        .from('mechanics_checklist')
        .select('id')
        .eq('vehicle_id', checklistData.vehicle_id)
        .eq('partner_id', partnerId)
        .limit(1);
      if (checklistData.quote_id) base = base.eq('quote_id', checklistData.quote_id);
      if (checklistData.inspection_id) base = base.eq('inspection_id', checklistData.inspection_id);
      const { data: found } = await base.maybeSingle();
      existingId = found?.id || null;
    }

    let mainRow;
    if (existingId) {
      const { data: updated, error: updErr } = await supabase
        .from('mechanics_checklist')
        .update(mapped)
        .eq('id', existingId)
        .select('*')
        .single();
      if (updErr) {
        logger.error('mechanics_checklist_update_error', { error: updErr.message });
        return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
      }
      mainRow = updated;
      logger.info('mechanics_checklist_update_ok', { id: existingId });
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('mechanics_checklist')
        .insert(mapped)
        .select('*')
        .single();
      if (insErr) {
        logger.error('mechanics_checklist_insert_error', { error: insErr.message });
        return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
      }
      mainRow = inserted;
      logger.info('mechanics_checklist_insert_ok', { id: inserted?.id });
    }

    // Registrar entrada de timeline idempotente e atualizar status do veículo
    try {
      {
        const categoryName = resolvedCategoryName; // já validada acima
        const timelineStatus = `Fase Orçamentária Iniciada - ${categoryName}`;

        // Verificar se já existe este status na timeline para evitar duplicatas
        const { data: existingHistory } = await supabase
          .from('vehicle_history')
          .select('id')
          .eq('vehicle_id', checklistData.vehicle_id)
          .eq('status', timelineStatus)
          .maybeSingle();

        // Se não existe, criar novo registro na timeline
        if (!existingHistory) {
          const { error: historyError } = await supabase.from('vehicle_history').insert({
            vehicle_id: checklistData.vehicle_id,
            status: timelineStatus,
            prevision_date: null,
            end_date: null,
            created_at: new Date().toISOString(),
          });

          if (historyError) {
            logger.error('timeline_insert_error', { error: historyError.message });
          } else {
            logger.info('timeline_created', {
              vehicle_id: checklistData.vehicle_id.slice(0, 8),
              status: timelineStatus,
              partner_id: partnerId.slice(0, 8),
            });
          }
        }

        // Atualizar status do veículo para 'FASE ORÇAMENTÁRIA'
        const { error: statusUpdateError } = await supabase
          .from('vehicles')
          .update({ status: 'FASE ORÇAMENTÁRIA' })
          .eq('id', checklistData.vehicle_id);

        if (statusUpdateError) {
          logger.error('vehicle_status_update_error', { error: statusUpdateError.message });
        } else {
          logger.info('vehicle_status_updated', {
            vehicle_id: checklistData.vehicle_id.slice(0, 8),
            new_status: 'FASE ORÇAMENTÁRIA',
          });
        }
      }
    } catch (timelineError) {
      logger.error('timeline_or_status_update_error', {
        error: timelineError instanceof Error ? timelineError.message : String(timelineError),
      });
      // Não falhar a requisição principal por causa da timeline/status
    }

    // Persistir status e notas por item em mechanics_checklist_items
    const itemDefs: { key: string; notesKey: string }[] = [
      { key: 'clutch', notesKey: 'clutchNotes' },
      { key: 'sparkPlugs', notesKey: 'sparkPlugsNotes' },
      { key: 'belts', notesKey: 'beltsNotes' },
      { key: 'radiator', notesKey: 'radiatorNotes' },
      { key: 'frontShocks', notesKey: 'frontShocksNotes' },
      { key: 'rearShocks', notesKey: 'rearShocksNotes' },
      { key: 'suspension', notesKey: 'suspensionNotes' },
      { key: 'tires', notesKey: 'tiresNotes' },
      { key: 'brakePads', notesKey: 'brakePadsNotes' },
      { key: 'brakeDiscs', notesKey: 'brakeDiscsNotes' },
      { key: 'engine', notesKey: 'engineNotes' },
      { key: 'steeringBox', notesKey: 'steeringBoxNotes' },
      { key: 'electricSteeringBox', notesKey: 'electricSteeringBoxNotes' },
      { key: 'exhaust', notesKey: 'exhaustNotes' },
      { key: 'fluids', notesKey: 'fluidsNotes' },
      { key: 'airConditioning', notesKey: 'airConditioningNotes' },
      { key: 'airConditioningCompressor', notesKey: 'airConditioningCompressorNotes' },
      { key: 'airConditioningCleaning', notesKey: 'airConditioningCleaningNotes' },
      { key: 'electricalActuationGlass', notesKey: 'electricalActuationGlassNotes' },
      { key: 'electricalActuationMirror', notesKey: 'electricalActuationMirrorNotes' },
      { key: 'electricalActuationSocket', notesKey: 'electricalActuationSocketNotes' },
      { key: 'electricalActuationLock', notesKey: 'electricalActuationLockNotes' },
      { key: 'electricalActuationTrunk', notesKey: 'electricalActuationTrunkNotes' },
      { key: 'electricalActuationWiper', notesKey: 'electricalActuationWiperNotes' },
      { key: 'electricalActuationKey', notesKey: 'electricalActuationKeyNotes' },
      { key: 'electricalActuationAlarm', notesKey: 'electricalActuationAlarmNotes' },
      {
        key: 'electricalActuationInteriorLight',
        notesKey: 'electricalActuationInteriorLightNotes',
      },
      { key: 'dashboardPanel', notesKey: 'dashboardPanelNotes' },
      { key: 'lights', notesKey: 'lightsNotes' },
      { key: 'battery', notesKey: 'batteryNotes' },
    ];

    const itemRows = itemDefs
      .map(({ key, notesKey }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (checklistData as any)?.[key];
        const mappedStatus = checklistService.mapStatus(status);
        if (!mappedStatus) return null;

        const row: Record<string, unknown> = {
          vehicle_id: checklistData.vehicle_id,
          item_key: key,
          item_status: mappedStatus,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          item_notes: (checklistData as any)?.[notesKey] || null,
          partner_id: partnerId,
        };

        // Adicionar quote_id (novo) ou inspection_id (legacy)
        if (checklistData.quote_id) {
          row.quote_id = checklistData.quote_id;
        }
        if (checklistData.inspection_id) {
          row.inspection_id = checklistData.inspection_id;
        }

        // Adicionar part_request se existir para este item
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partRequest = (checklistData as any)?.part_requests?.[key];
        if (partRequest) {
          row.part_request = partRequest;
        }

        return row;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(Boolean) as any[];

    logger.debug('mechanics_checklist_items_prepared', { count: itemRows.length });

    if (itemRows.length > 0) {
      // Limpar itens anteriores deste parceiro neste contexto
      let del = supabase
        .from('mechanics_checklist_items')
        .delete()
        .eq('vehicle_id', checklistData.vehicle_id)
        .eq('partner_id', partnerId);
      if (checklistData.quote_id) del = del.eq('quote_id', checklistData.quote_id);
      if (checklistData.inspection_id) del = del.eq('inspection_id', checklistData.inspection_id);
      const { error: delErr } = await del;
      if (delErr) {
        logger.warn('mechanics_checklist_items_delete_error', { error: delErr.message });
      }

      const { error: itemsError } = await supabase
        .from('mechanics_checklist_items')
        .insert(itemRows);
      if (itemsError) {
        logger.error('mechanics_checklist_items_insert_error', { error: itemsError.message });
      } else {
        logger.info('mechanics_checklist_items_insert_ok', { count: itemRows.length });
      }
    }

    // Persistir referências das evidências em tabela separada (uma por item), sem blobs
    logger.debug('evidences_processing_start', {
      hasEvidences: !!checklistData.evidences,
      evidencesType: typeof checklistData.evidences,
      evidencesKeys: checklistData.evidences ? Object.keys(checklistData.evidences) : [],
      evidencesData: checklistData.evidences, // Log completo do payload de evidências
    });

    if (checklistData.evidences && typeof checklistData.evidences === 'object') {
      // evidences pode ser: { sparkPlugs: ["path1", "path2"], belts: ["path3"] }
      // Achatar para uma row por arquivo
      const rows: Array<Record<string, unknown>> = [];

      Object.entries(checklistData.evidences).forEach(([item_key, paths]) => {
        logger.debug('processing_evidence_item', {
          item_key,
          paths,
          isArray: Array.isArray(paths),
        });
        const pathArray = Array.isArray(paths) ? paths : [paths];
        pathArray.forEach(storage_path => {
          if (storage_path && String(storage_path).trim() !== '') {
            const row: Record<string, unknown> = {
              vehicle_id: checklistData.vehicle_id,
              item_key,
              storage_path: storage_path, // Updated to use storage_path column
              media_type: 'image', // Assumir tipo padrão
              partner_id: partnerId,
            };

            // Adicionar quote_id (novo) ou inspection_id (legacy)
            if (checklistData.quote_id) {
              row.quote_id = checklistData.quote_id;
            }
            if (checklistData.inspection_id) {
              row.inspection_id = checklistData.inspection_id;
            }

            rows.push(row);
          }
        });
      });

      logger.debug('evidence_rows_prepared', { count: rows.length, rows });

      if (rows.length > 0) {
        // CORREÇÃO: Não deletar evidências antigas, apenas adicionar novas
        // O frontend já envia todas as evidências (existentes + novas)
        // então devemos fazer um upsert baseado em media_url única

        // Primeiro, buscar evidências existentes para este contexto
        let existingQuery = supabase
          .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
          .select('storage_path')
          .eq('vehicle_id', checklistData.vehicle_id)
          .eq('partner_id', partnerId);
        if (checklistData.quote_id)
          existingQuery = existingQuery.eq('quote_id', checklistData.quote_id);
        if (checklistData.inspection_id)
          existingQuery = existingQuery.eq('inspection_id', checklistData.inspection_id);

        const { data: existingEvidences } = await existingQuery;
        const existingUrls = new Set((existingEvidences || []).map(e => e.storage_path));

        // Filtrar apenas evidências que ainda não existem
        const newRows = rows.filter(row => !existingUrls.has(row.storage_path as string));

        logger.debug('evidence_upsert_analysis', {
          total_in_payload: rows.length,
          already_exists: rows.length - newRows.length,
          to_insert: newRows.length,
        });

        if (newRows.length > 0) {
          const { error: evError } = await supabase
            .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
            .insert(newRows);
          if (evError) {
            // Não falhar a requisição principal por causa das evidências
            logger.error('mechanics_checklist_evidences_insert_error', { error: evError.message });
          } else {
            logger.info('mechanics_checklist_evidences_insert_ok', { count: newRows.length });
          }
        } else {
          logger.info('mechanics_checklist_evidences_no_new', {
            message: 'Todas as evidências já existem',
          });
        }
      }
    }

    // Deduplicação defensiva: manter apenas uma linha por status "Fase Orçamentária Iniciada - *"
    try {
      const { data: allHist } = await supabase
        .from('vehicle_history')
        .select('id,status,created_at')
        .eq('vehicle_id', checklistData.vehicle_id)
        .ilike('status', 'Fase Orçamentária Iniciada - %')
        .order('created_at', { ascending: true });

      if (Array.isArray(allHist) && allHist.length > 1) {
        const byStatus: Record<string, { keepId: string; removeIds: string[] }> = {};
        for (const row of allHist) {
          const s = row.status as string;
          if (!byStatus[s]) {
            byStatus[s] = { keepId: row.id as string, removeIds: [] };
          } else {
            byStatus[s].removeIds.push(row.id as string);
          }
        }

        const idsToDelete = Object.values(byStatus).flatMap(g => g.removeIds);
        if (idsToDelete.length > 0) {
          const { error: cleanupError } = await supabase
            .from('vehicle_history')
            .delete()
            .in('id', idsToDelete);

          if (cleanupError) {
            logger.warn('timeline_dedup_cleanup_error', { error: cleanupError.message });
          } else {
            logger.info('timeline_dedup_cleanup_done', { removedCount: idsToDelete.length });
          }
        }
      }
    } catch (dedupErr) {
      logger.warn('timeline_dedup_unexpected_error', {
        error: dedupErr instanceof Error ? dedupErr.message : String(dedupErr),
      });
    }

    return NextResponse.json({ success: true, data: mainRow || mapped });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error('submit_unexpected_error', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const PUT = withPartnerAuth(submitChecklistHandler);
