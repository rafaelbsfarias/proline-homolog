import { NextResponse } from 'next/server';
import type { AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { withClientAuth } from '@/modules/common/utils/authMiddleware';
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
  checklist_item_id: string;
  storage_path: string;
  description: string | null;
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

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId é obrigatório' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Buscar qual parceiro trabalhou no veículo (via quotes aprovados)
    const { data: quote, error: quoteError } = await supabase
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
      .single();

    if (quoteError || !quote || !quote.partners) {
      logger.warn('partner_not_found', { vehicleId: vehicleId.slice(0, 8) });
      return NextResponse.json(
        { error: 'Nenhum parceiro encontrado para este veículo' },
        { status: 404 }
      );
    }

    // partners é um array, pegar o primeiro
    const partnerData = Array.isArray(quote.partners) ? quote.partners[0] : quote.partners;
    const partner: Partner = partnerData as Partner;

    // 2. Detectar tipo e buscar dados apropriados
    if (partner.partner_type === 'mechanic') {
      return getMechanicsChecklist(supabase, vehicleId, partner);
    } else {
      return getAnomaliesChecklist(supabase, vehicleId, partner);
    }
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

    // Buscar itens do checklist
    const { data: items, error: itemsError } = await supabase
      .from('mechanics_checklist_items')
      .select('*')
      .eq('checklist_id', checklist.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    // Buscar evidências de todos os itens
    const itemIds = (items as ChecklistItemRow[] | null)?.map(item => item.id) || [];
    let evidences: EvidenceRow[] = [];

    if (itemIds.length > 0) {
      const { data: evidencesData, error: evidencesError } = await supabase
        .from('mechanics_checklist_evidences')
        .select('*')
        .in('checklist_item_id', itemIds);

      if (evidencesError) {
        throw evidencesError;
      }

      evidences = (evidencesData as EvidenceRow[]) || [];
    }

    // Gerar signed URLs para as evidências
    const evidencesWithUrls = await Promise.all(
      evidences.map(async evidence => {
        try {
          const { data: urlData } = await supabase.storage
            .from('vehicle-media')
            .createSignedUrl(evidence.storage_path, 3600);

          return {
            id: evidence.id,
            checklist_item_id: evidence.checklist_item_id,
            media_url: urlData?.signedUrl || '',
            description: evidence.description || '',
          };
        } catch {
          logger.warn('error_generating_signed_url', { evidenceId: evidence.id });
          return {
            id: evidence.id,
            checklist_item_id: evidence.checklist_item_id,
            media_url: '',
            description: evidence.description || '',
          };
        }
      })
    );

    // Agrupar itens com suas evidências por categoria
    const itemsWithEvidences: ItemWithEvidences[] = ((items as ChecklistItemRow[]) || []).map(
      item => ({
        id: item.id,
        item_key: item.item_key,
        item_status: item.item_status,
        item_notes: item.item_notes,
        evidences: evidencesWithUrls.filter(ev => ev.checklist_item_id === item.id),
      })
    );

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
