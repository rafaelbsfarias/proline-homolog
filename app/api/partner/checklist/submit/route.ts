import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ChecklistService } from '@/modules/partner/services/ChecklistService';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:submit');

// Schema de validação
const SubmitChecklistSchema = z
  .object({
    vehicle_id: z.string().uuid('ID do veículo inválido'),
    inspection_id: z.string().uuid('ID da inspeção inválido'),
    // Demais campos são opcionais
  })
  .passthrough(); // Permite campos adicionais

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
    });

    // Mapear dados usando ChecklistService
    const mapped = checklistService.mapChecklistToMechanicsSchema(checklistData, partnerId);
    logger.debug('mapped_payload', {
      vehicle_id: mapped.vehicle_id,
      inspection_id: mapped.inspection_id,
      status: mapped.status,
    });

    // Upsert vinculado por (vehicle_id, inspection_id)
    const { data, error } = await supabase
      .from('mechanics_checklist')
      .upsert(mapped, { onConflict: 'vehicle_id,inspection_id' })
      .select('*');

    if (error) {
      logger.error('mechanics_checklist_upsert_error', { error: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    logger.info('mechanics_checklist_upsert_ok', { rows: Array.isArray(data) ? data.length : 0 });

    // Verificar se é a primeira vez que este parceiro salva checklist para este veículo
    // Se sim, adicionar entrada na timeline
    const isFirstSave = Array.isArray(data) && data[0] && data[0].created_at === data[0].updated_at;

    if (isFirstSave) {
      try {
        // Buscar categoria do parceiro
        const { data: partnerCategories, error: categoryError } = await supabase.rpc(
          'get_partner_categories',
          { partner_id: partnerId }
        );

        if (categoryError) {
          logger.error('category_fetch_error', { error: categoryError.message });
        } else {
          const categories = partnerCategories || [];
          const categoryName = categories[0] || 'Parceiro';
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
              // Não falhar a request por causa do histórico
            } else {
              logger.info('timeline_created', {
                vehicle_id: checklistData.vehicle_id.slice(0, 8),
                status: timelineStatus,
                partner_id: partnerId.slice(0, 8),
              });
            }
          } else {
            logger.debug('timeline_already_exists', {
              vehicle_id: checklistData.vehicle_id.slice(0, 8),
            });
          }
        }
      } catch (timelineError) {
        logger.error('timeline_update_error', {
          error: timelineError instanceof Error ? timelineError.message : String(timelineError),
        });
        // Não falhar a requisição principal por causa da timeline
      }
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
        return {
          inspection_id: checklistData.inspection_id,
          vehicle_id: checklistData.vehicle_id,
          item_key: key,
          item_status: mappedStatus,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          item_notes: (checklistData as any)?.[notesKey] || null,
        };
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(Boolean) as any[];

    logger.debug('mechanics_checklist_items_prepared', { count: itemRows.length });

    if (itemRows.length > 0) {
      const { error: itemsError } = await supabase
        .from('mechanics_checklist_items')
        .upsert(itemRows, { onConflict: 'inspection_id,item_key' });
      if (itemsError) {
        logger.error('mechanics_checklist_items_upsert_error', { error: itemsError.message });
      }
      logger.info('mechanics_checklist_items_upsert_ok', { count: itemRows.length });
    }

    // Persistir referências das evidências em tabela separada (uma por item), sem blobs
    if (checklistData.evidences && typeof checklistData.evidences === 'object') {
      const entries = Object.entries(checklistData.evidences) as [string, string][];
      const rows = entries
        .filter(([, path]) => !!path && String(path).trim() !== '')
        .map(([item_key, storage_path]) => ({
          inspection_id: checklistData.inspection_id,
          vehicle_id: checklistData.vehicle_id,
          item_key,
          storage_path,
        }));

      if (rows.length > 0) {
        const { error: evError } = await supabase
          .from('mechanics_checklist_evidences')
          .upsert(rows, { onConflict: 'inspection_id,item_key' });
        if (evError) {
          // Não falhar a requisição principal por causa das evidências
          logger.error('mechanics_checklist_evidences_upsert_error', { error: evError.message });
        }
        logger.info('mechanics_checklist_evidences_upsert_ok', { count: rows.length });
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

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) && data[0] ? data[0] : mapped,
    });
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
