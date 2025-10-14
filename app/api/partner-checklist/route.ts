import { NextResponse } from 'next/server';
import type { AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { withAnyAuth } from '@/modules/common/utils/authMiddleware';
import { createClient } from '@/lib/supabase/server';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner-checklist');

interface Partner {
  id: string;
  name: string;
  partner_type: string;
}

interface ChecklistItemRow {
  id: string;
  item_key: string;
  item_status: string;
  item_notes: string | null;
}

interface EvidenceRow {
  id: string;
  checklist_item_id?: string | null; // Opcional - não existe na tabela
  storage_path: string;
  description: string | null;
  item_key: string; // Obrigatório - usado para associar com items
}

interface AnomalyRow {
  id: string;
  description: string;
  photos: string[];
  severity: string | null;
  status: string | null;
  created_at: string;
}

interface ItemWithEvidences {
  id: string;
  item_key: string;
  item_status: string;
  item_notes: string | null;
  evidences: Array<{
    id: string;
    media_url: string;
    description: string;
  }>;
}

export const GET = withAnyAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId é obrigatório' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Tentar buscar parceiro via quotes aprovados (cenário ideal)
    const { data: quote } = await supabase
      .from('quotes')
      .select(
        `
        id,
        partner_id,
        partners (
          id,
          name,
          partner_type
        )
      `
      )
      .eq('vehicle_id', vehicleId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quote && quote.partners) {
      // partners é um array, pegar o primeiro
      const partnerData = Array.isArray(quote.partners) ? quote.partners[0] : quote.partners;
      const partner: Partner = partnerData as Partner;

      // 2. Detectar tipo e buscar dados apropriados
      if (partner.partner_type === 'mechanic') {
        return getMechanicsChecklist(supabase, vehicleId, partner);
      } else {
        return getAnomaliesChecklist(supabase, vehicleId, partner);
      }
    }

    // 2. Se não encontrou via quotes, buscar diretamente nos checklists/anomalias (dados legados)
    logger.info('trying_legacy_lookup', { vehicleId: vehicleId.slice(0, 8) });

    // Debug: Verificar se existem itens de checklist para este veículo
    const { data: debugItems, error: debugError } = await supabase
      .from('mechanics_checklist_items')
      .select('id, inspection_id, quote_id')
      .eq('vehicle_id', vehicleId)
      .limit(5);

    logger.info('debug_items_check', {
      vehicleId: vehicleId.slice(0, 8),
      itemsFound: debugItems?.length || 0,
      items: debugItems,
      error: debugError?.message,
    });

    // Tentar buscar checklist de mecânica
    const mechanicsResult = await getMechanicsChecklistDirect(supabase, vehicleId);
    if (mechanicsResult) {
      return mechanicsResult;
    }

    // Tentar buscar anomalias
    const anomaliesResult = await getAnomaliesChecklistDirect(supabase, vehicleId);
    if (anomaliesResult) {
      return anomaliesResult;
    }

    // Nenhum dado encontrado
    logger.warn('no_partner_data_found', { vehicleId: vehicleId.slice(0, 8) });
    return NextResponse.json(
      { error: 'Nenhum parceiro encontrado para este veículo' },
      { status: 404 }
    );
  } catch (error) {
    logger.error('error_fetching_partner_checklist', { error });
    return NextResponse.json({ error: 'Erro ao buscar checklist do parceiro' }, { status: 500 });
  }
});

/**
 * Busca checklist de mecânica com itens e evidências
 */
async function getMechanicsChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
  partner: Partner
) {
  try {
    // Buscar checklist principal
    const { data: checklist, error: checklistError } = await supabase
      .from('mechanics_checklist')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (checklistError || !checklist) {
      return NextResponse.json({ error: 'Checklist de mecânica não encontrado' }, { status: 404 });
    }

    // Buscar itens do checklist por quote_id (novo) ou inspection_id (legado)
    let itemsQuery = supabase
      .from('mechanics_checklist_items')
      .select('*')
      .order('created_at', { ascending: true });

    // Usar quote_id (prioridade), inspection_id (fallback) ou vehicle_id (último recurso)
    if (checklist.quote_id) {
      itemsQuery = itemsQuery.eq('quote_id', checklist.quote_id);
      logger.info('fetching_items_by_quote_id', { quote_id: checklist.quote_id.slice(0, 8) });
    } else if (checklist.inspection_id) {
      itemsQuery = itemsQuery.eq('inspection_id', checklist.inspection_id);
      logger.info('fetching_items_by_inspection_id', {
        inspection_id: checklist.inspection_id.slice(0, 8),
      });
    } else {
      itemsQuery = itemsQuery.eq('vehicle_id', vehicleId);
      logger.info('fetching_items_by_vehicle_id_fallback', { vehicle_id: vehicleId.slice(0, 8) });
    }

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      logger.error('error_fetching_items_invalid_column', {
        error: itemsError,
        code: itemsError.code || 'unknown',
        hint: 'Use quote_id or inspection_id instead of checklist_id',
      });
      throw itemsError;
    }

    // Buscar evidências por quote_id ou inspection_id (independente de items)
    let evidencesQuery = supabase.from('mechanics_checklist_evidences').select('*');

    if (checklist.quote_id) {
      evidencesQuery = evidencesQuery.eq('quote_id', checklist.quote_id);
      logger.info('fetching_evidences_by_quote_id', { quote_id: checklist.quote_id.slice(0, 8) });
    } else if (checklist.inspection_id) {
      evidencesQuery = evidencesQuery.eq('inspection_id', checklist.inspection_id);
      logger.info('fetching_evidences_by_inspection_id', {
        inspection_id: checklist.inspection_id.slice(0, 8),
      });
    }

    const { data: evidences, error: evidencesError } = await evidencesQuery;

    if (evidencesError) {
      logger.error('error_fetching_evidences', { error: evidencesError });
      throw evidencesError;
    }

    // Log: Evidências buscadas
    logger.info('evidences_fetched', {
      count: evidences?.length || 0,
      sample: evidences?.slice(0, 3).map(e => ({
        id: (e as EvidenceRow).id?.slice(0, 8),
        item_key: (e as EvidenceRow).item_key,
        has_storage_path: !!(e as EvidenceRow).storage_path,
      })),
    });

    // Gerar signed URLs para as evidências
    const evidencesWithUrls = await Promise.all(
      ((evidences as EvidenceRow[]) || []).map(async evidence => {
        try {
          logger.info('attempting_signed_url', {
            evidenceId: evidence.id.slice(0, 8),
            item_key: evidence.item_key,
            storage_path: evidence.storage_path,
          });

          const { data: urlData, error: urlError } = await supabase.storage
            .from('vehicle-media')
            .createSignedUrl(evidence.storage_path, 3600);

          if (urlError) {
            logger.error('signed_url_error', {
              evidenceId: evidence.id.slice(0, 8),
              error: urlError.message,
              storage_path: evidence.storage_path,
            });
          }

          const signedUrl = urlData?.signedUrl || '';
          logger.info('signed_url_result', {
            evidenceId: evidence.id.slice(0, 8),
            has_url: !!signedUrl,
            url_length: signedUrl.length,
          });

          return {
            id: evidence.id,
            item_key: evidence.item_key, // Garantir que está presente
            media_url: signedUrl,
            description: evidence.description || '',
          };
        } catch (err) {
          logger.error('exception_generating_signed_url', {
            evidenceId: evidence.id.slice(0, 8),
            item_key: evidence.item_key,
            error: err instanceof Error ? err.message : String(err),
          });
          return {
            id: evidence.id,
            item_key: evidence.item_key,
            media_url: '',
            description: evidence.description || '',
          };
        }
      })
    );

    // Log: Signed URLs geradas
    logger.info('signed_urls_generated', {
      count: evidencesWithUrls.length,
      with_urls: evidencesWithUrls.filter(e => !!e.media_url).length,
      sample: evidencesWithUrls.slice(0, 3).map(e => ({
        id: e.id.slice(0, 8),
        item_key: e.item_key,
        has_url: !!e.media_url,
        url_preview: e.media_url ? e.media_url.slice(0, 50) + '...' : 'empty',
      })),
    });

    // Agrupar itens com suas evidências por categoria
    const itemsWithEvidences: ItemWithEvidences[] = ((items as ChecklistItemRow[]) || []).map(
      item => ({
        id: item.id,
        item_key: item.item_key,
        item_status: item.item_status,
        item_notes: item.item_notes,
        evidences: evidencesWithUrls.filter(ev => ev.item_key === item.item_key),
      })
    );

    // Log: Itens NOK com evidências
    const nokItems = itemsWithEvidences.filter(item => item.item_status === 'nok');
    if (nokItems.length > 0) {
      logger.info('nok_items_with_evidences', {
        count: nokItems.length,
        sample: nokItems.slice(0, 3).map(item => ({
          item_key: item.item_key,
          item_status: item.item_status,
          evidences_count: item.evidences.length,
          evidences_have_urls: item.evidences.every(e => !!e.media_url),
        })),
      });
    }

    // Agrupar por categoria (baseado no item_key)
    const itemsByCategory = groupItemsByCategory(itemsWithEvidences);

    return NextResponse.json({
      type: 'mechanics',
      checklist: {
        id: checklist.id,
        vehicle_id: checklist.vehicle_id,
        partner: {
          id: partner.id,
          name: partner.name,
          type: partner.partner_type,
        },
        status: checklist.status,
        notes: checklist.notes,
        created_at: checklist.created_at,
      },
      itemsByCategory,
      stats: {
        totalItems: itemsWithEvidences.length,
      },
    });
  } catch (error) {
    logger.error('error_in_get_mechanics_checklist', { error });
    return NextResponse.json({ error: 'Erro ao buscar checklist de mecânica' }, { status: 500 });
  }
}

/**
 * Busca anomalias (usado por todas as outras categorias)
 */
async function getAnomaliesChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
  partner: Partner
) {
  try {
    // Buscar anomalias do veículo
    const { data: anomalies, error: anomaliesError } = await supabase
      .from('vehicle_anomalies')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (anomaliesError) {
      throw anomaliesError;
    }

    // Gerar signed URLs para as fotos das anomalias
    const anomaliesWithUrls = await Promise.all(
      ((anomalies as AnomalyRow[]) || []).map(async anomaly => {
        const photosWithUrls = await Promise.all(
          (anomaly.photos || []).map(async (photoPath: string) => {
            try {
              const { data: urlData } = await supabase.storage
                .from('vehicle-media')
                .createSignedUrl(photoPath, 3600);

              return urlData?.signedUrl || '';
            } catch {
              logger.warn('error_generating_signed_url_for_photo', { photoPath });
              return '';
            }
          })
        );

        return {
          id: anomaly.id,
          description: anomaly.description,
          photos: photosWithUrls.filter(url => url !== ''),
          severity: anomaly.severity || 'medium',
          status: anomaly.status || 'pending',
          created_at: anomaly.created_at,
        };
      })
    );

    return NextResponse.json({
      type: 'anomalies',
      checklist: {
        vehicle_id: vehicleId,
        partner: {
          id: partner.id,
          name: partner.name,
          type: partner.partner_type,
        },
      },
      anomalies: anomaliesWithUrls,
      stats: {
        totalAnomalies: anomaliesWithUrls.length,
      },
    });
  } catch (error) {
    logger.error('error_in_get_anomalies_checklist', { error });
    return NextResponse.json({ error: 'Erro ao buscar anomalias' }, { status: 500 });
  }
}

/**
 * Agrupa itens por categoria baseado no item_key
 */
function groupItemsByCategory(items: ItemWithEvidences[]): Record<string, ItemWithEvidences[]> {
  const categoryMap: Record<string, string> = {
    // Motor
    engineOil: 'Motor',
    oilFilter: 'Motor',
    airFilter: 'Motor',
    fuelFilter: 'Motor',
    sparkPlugs: 'Motor',
    belts: 'Motor',
    radiator: 'Motor',
    battery: 'Motor',

    // Transmissão
    clutch: 'Transmissão',
    gearbox: 'Transmissão',

    // Suspensão
    shockAbsorbers: 'Suspensão',
    springs: 'Suspensão',
    ballJoints: 'Suspensão',

    // Freios
    brakePads: 'Freios',
    brakeDiscs: 'Freios',
    brakeFluid: 'Freios',

    // Direção
    steeringWheel: 'Direção',
    powerSteering: 'Direção',

    // Pneus
    tires: 'Pneus',
    tireAlignment: 'Pneus',

    // Elétrica
    lights: 'Sistema Elétrico',
    wipers: 'Sistema Elétrico',
    horn: 'Sistema Elétrico',

    // Outros
    exhaust: 'Escapamento',
    bodywork: 'Carroceria',
  };

  const grouped: Record<string, ItemWithEvidences[]> = {};

  items.forEach(item => {
    const category = categoryMap[item.item_key] || 'Outros';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });

  return grouped;
}

/**
 * Busca checklist de mecânica diretamente (sem quote - dados legados com inspection_id)
 */
async function getMechanicsChecklistDirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string
): Promise<NextResponse | null> {
  try {
    logger.info('getMechanicsChecklistDirect_start', { vehicleId: vehicleId.slice(0, 8) });

    // Buscar checklist principal
    const { data: checklist, error: checklistError } = await supabase
      .from('mechanics_checklist')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    logger.info('checklist_lookup', {
      found: !!checklist,
      error: checklistError?.message,
      quote_id: checklist?.quote_id,
      inspection_id: checklist?.inspection_id,
    });

    // Se não encontrou checklist principal, tentar buscar pelos itens diretamente
    if (!checklist) {
      logger.info('no_main_checklist_trying_items_directly', { vehicleId: vehicleId.slice(0, 8) });

      // Buscar itens que pertencem a este veículo
      const { data: directItems, error: directItemsError } = await supabase
        .from('mechanics_checklist_items')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: true });

      if (directItemsError) {
        logger.error('error_fetching_direct_items', { error: directItemsError });
        return null;
      }

      if (!directItems || directItems.length === 0) {
        logger.info('no_items_found_for_vehicle', { vehicleId: vehicleId.slice(0, 8) });
        return null;
      }

      logger.info('items_found_directly', { count: directItems.length });

      // Usar o primeiro item para obter o inspection_id ou quote_id
      const firstItem = directItems[0];

      // Buscar evidências usando o mesmo identificador
      let evidencesQuery = supabase.from('mechanics_checklist_evidences').select('*');

      if (firstItem.quote_id) {
        evidencesQuery = evidencesQuery.eq('quote_id', firstItem.quote_id);
      } else if (firstItem.inspection_id) {
        evidencesQuery = evidencesQuery.eq('inspection_id', firstItem.inspection_id);
      }

      const { data: evidences } = await evidencesQuery;

      // Gerar signed URLs
      const evidencesWithUrls = await Promise.all(
        ((evidences as EvidenceRow[]) || []).map(async evidence => {
          try {
            logger.info('attempting_signed_url_direct', {
              evidenceId: evidence.id.slice(0, 8),
              storage_path: evidence.storage_path,
            });

            const { data: urlData, error: urlError } = await supabase.storage
              .from('vehicle-media')
              .createSignedUrl(evidence.storage_path, 3600);

            if (urlError) {
              logger.error('signed_url_error_direct', {
                evidenceId: evidence.id.slice(0, 8),
                error: urlError.message,
                storage_path: evidence.storage_path,
              });
            }

            return {
              id: evidence.id,
              item_key: evidence.item_key,
              media_url: urlData?.signedUrl || '',
              description: evidence.description || '',
            };
          } catch (err) {
            logger.error('exception_generating_signed_url_direct', {
              evidenceId: evidence.id.slice(0, 8),
              error: err instanceof Error ? err.message : String(err),
            });
            return {
              id: evidence.id,
              item_key: evidence.item_key,
              media_url: '',
              description: evidence.description || '',
            };
          }
        })
      );

      // Montar resposta sem checklist principal
      const itemsWithEvidences: ItemWithEvidences[] = (directItems as ChecklistItemRow[]).map(
        item => ({
          id: item.id,
          item_key: item.item_key,
          item_status: item.item_status,
          item_notes: item.item_notes,
          evidences: evidencesWithUrls.filter(ev => ev.item_key === item.item_key),
        })
      );
      const itemsByCategory = groupItemsByCategory(itemsWithEvidences);

      logger.info('mechanics_checklist_found_via_items', {
        vehicleId: vehicleId.slice(0, 8),
        itemsCount: itemsWithEvidences.length,
      });

      return NextResponse.json({
        type: 'mechanics',
        checklist: {
          id: 'direct-items',
          vehicle_id: vehicleId,
          partner: {
            id: 'unknown',
            name: 'Mecânica',
            type: 'mechanic',
          },
          status: 'in_progress',
          notes: null,
          created_at: firstItem.created_at,
        },
        itemsByCategory,
        stats: {
          totalItems: itemsWithEvidences.length,
        },
      });
    }

    // Continuar com o fluxo normal se encontrou checklist principal...

    // Buscar itens do checklist (por inspection_id ou quote_id)
    let itemsQuery = supabase
      .from('mechanics_checklist_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (checklist.quote_id) {
      itemsQuery = itemsQuery.eq('quote_id', checklist.quote_id);
    } else if (checklist.inspection_id) {
      itemsQuery = itemsQuery.eq('inspection_id', checklist.inspection_id);
    } else {
      return null; // Sem identificador válido
    }

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      logger.error('error_fetching_items_direct', { error: itemsError });
      return null;
    }

    // Buscar evidências
    let evidencesQuery = supabase.from('mechanics_checklist_evidences').select('*');

    if (checklist.quote_id) {
      evidencesQuery = evidencesQuery.eq('quote_id', checklist.quote_id);
    } else if (checklist.inspection_id) {
      evidencesQuery = evidencesQuery.eq('inspection_id', checklist.inspection_id);
    }

    const { data: evidences, error: evidencesError } = await evidencesQuery;

    if (evidencesError) {
      logger.error('error_fetching_evidences_direct', { error: evidencesError });
      return null;
    }

    // Gerar signed URLs para as evidências
    const evidencesWithUrls = await Promise.all(
      ((evidences as EvidenceRow[]) || []).map(async evidence => {
        try {
          logger.info('attempting_signed_url_legacy', {
            evidenceId: evidence.id.slice(0, 8),
            storage_path: evidence.storage_path,
          });

          const { data: urlData, error: urlError } = await supabase.storage
            .from('vehicle-media')
            .createSignedUrl(evidence.storage_path, 3600);

          if (urlError) {
            logger.error('signed_url_error_legacy', {
              evidenceId: evidence.id.slice(0, 8),
              error: urlError.message,
              storage_path: evidence.storage_path,
            });
          }

          return {
            id: evidence.id,
            item_key: evidence.item_key,
            media_url: urlData?.signedUrl || '',
            description: evidence.description || '',
          };
        } catch (err) {
          logger.error('exception_generating_signed_url_legacy', {
            evidenceId: evidence.id.slice(0, 8),
            error: err instanceof Error ? err.message : String(err),
          });
          return {
            id: evidence.id,
            item_key: evidence.item_key,
            media_url: '',
            description: evidence.description || '',
          };
        }
      })
    );

    // Agrupar itens com suas evidências
    const itemsWithEvidences: ItemWithEvidences[] = ((items as ChecklistItemRow[]) || []).map(
      item => ({
        id: item.id,
        item_key: item.item_key,
        item_status: item.item_status,
        item_notes: item.item_notes,
        evidences: evidencesWithUrls.filter(ev => ev.item_key === item.item_key),
      })
    );

    // Agrupar por categoria
    const itemsByCategory = groupItemsByCategory(itemsWithEvidences);

    logger.info('mechanics_checklist_found_direct', {
      vehicleId: vehicleId.slice(0, 8),
      itemsCount: itemsWithEvidences.length,
    });

    return NextResponse.json({
      type: 'mechanics',
      checklist: {
        id: checklist.id,
        vehicle_id: checklist.vehicle_id,
        partner: {
          id: 'unknown',
          name: 'Mecânica',
          type: 'mechanic',
        },
        status: checklist.status,
        notes: checklist.notes,
        created_at: checklist.created_at,
      },
      itemsByCategory,
      stats: {
        totalItems: itemsWithEvidences.length,
      },
    });
  } catch (error) {
    logger.error('error_in_get_mechanics_checklist_direct', { error });
    return null;
  }
}

/**
 * Busca anomalias diretamente (sem quote - dados legados)
 */
async function getAnomaliesChecklistDirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string
): Promise<NextResponse | null> {
  try {
    // Buscar anomalias do veículo
    const { data: anomalies, error: anomaliesError } = await supabase
      .from('vehicle_anomalies')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (anomaliesError || !anomalies || anomalies.length === 0) {
      return null;
    }

    // Gerar signed URLs para as fotos
    const anomaliesWithUrls = await Promise.all(
      ((anomalies as AnomalyRow[]) || []).map(async anomaly => {
        const photosWithUrls = await Promise.all(
          (anomaly.photos || []).map(async (photoPath: string) => {
            try {
              const { data: urlData } = await supabase.storage
                .from('vehicle-media')
                .createSignedUrl(photoPath, 3600);

              return urlData?.signedUrl || '';
            } catch {
              logger.warn('error_generating_signed_url_for_photo', { photoPath });
              return '';
            }
          })
        );

        return {
          id: anomaly.id,
          description: anomaly.description,
          photos: photosWithUrls.filter(url => url !== ''),
          severity: anomaly.severity || 'medium',
          status: anomaly.status || 'pending',
          created_at: anomaly.created_at,
        };
      })
    );

    logger.info('anomalies_found_direct', {
      vehicleId: vehicleId.slice(0, 8),
      count: anomaliesWithUrls.length,
    });

    return NextResponse.json({
      type: 'anomalies',
      checklist: {
        vehicle_id: vehicleId,
        partner: {
          id: 'unknown',
          name: 'Parceiro',
          type: 'other',
        },
      },
      anomalies: anomaliesWithUrls,
      stats: {
        totalAnomalies: anomaliesWithUrls.length,
      },
    });
  } catch (error) {
    logger.error('error_in_get_anomalies_checklist_direct', { error });
    return null;
  }
}
