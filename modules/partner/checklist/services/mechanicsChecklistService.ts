import {
  getLatestChecklistByVehicle,
  getItemsByContext,
  getEvidencesByContext,
  getDirectItemsByVehicle,
} from '../repositories/MechanicsChecklistRepository';
import {
  mapEvidencesWithUrls,
  mapItemsByCategory,
  mapItemsWithEvidences,
} from '../mappers/ChecklistMappers';
import type { Partner } from '../schemas';
import type { ChecklistItemRow } from '../../checklist/schemas';
import { NotFoundError } from '../errors';

// Helper: processa items + evidences em um formato comum
async function processChecklistData(
  items: ChecklistItemRow[],
  quoteId?: string | null,
  inspectionId?: string | null
) {
  const evidences = await getEvidencesByContext({
    quote_id: quoteId,
    inspection_id: inspectionId,
  });
  const evidencesWithUrls = await mapEvidencesWithUrls(evidences);
  const itemsWithEvs = mapItemsWithEvidences(items, evidencesWithUrls);
  const itemsByCategory = mapItemsByCategory(itemsWithEvs);

  return { itemsByCategory, totalItems: itemsWithEvs.length };
}

export async function getMechanicsChecklist(vehicleId: string, partner: Partner) {
  const checklist = await getLatestChecklistByVehicle(vehicleId);
  if (!checklist) throw new NotFoundError('Checklist de mecânica não encontrado');

  const items = await getItemsByContext({
    quote_id: checklist.quote_id as string | null | undefined,
    inspection_id: checklist.inspection_id as string | null | undefined,
    vehicle_id: checklist.quote_id || checklist.inspection_id ? undefined : vehicleId,
  });

  const { itemsByCategory, totalItems } = await processChecklistData(
    items,
    checklist.quote_id as string | null | undefined,
    checklist.inspection_id as string | null | undefined
  );

  return {
    type: 'mechanics' as const,
    checklist: {
      id: checklist.id as string,
      vehicle_id: checklist.vehicle_id as string,
      partner: { id: partner.id, name: partner.name, type: partner.partner_type },
      status: checklist.status as string,
      notes: checklist.notes as string | null,
      created_at: checklist.created_at as string,
    },
    itemsByCategory,
    stats: { totalItems },
  };
}

export async function getMechanicsChecklistDirect(vehicleId: string) {
  // Primeiro, tentar via itens diretos por vehicle_id (legado)
  const directItems = await getDirectItemsByVehicle(vehicleId);
  if (directItems.length > 0) {
    const firstItem = directItems[0];
    const { itemsByCategory, totalItems } = await processChecklistData(
      directItems,
      firstItem.quote_id ?? undefined,
      firstItem.inspection_id ?? undefined
    );
    return {
      type: 'mechanics' as const,
      checklist: {
        id: 'direct-items',
        vehicle_id: vehicleId,
        partner: { id: 'unknown', name: 'Mecânica', type: 'mechanic' },
        status: 'in_progress',
        notes: null,
        created_at: firstItem.created_at,
      },
      itemsByCategory,
      stats: { totalItems },
    };
  }

  // Em seguida, tentar checklist principal + contexto
  const checklist = await getLatestChecklistByVehicle(vehicleId);
  if (!checklist) return null;

  const items = await getItemsByContext({
    quote_id: checklist.quote_id as string | null | undefined,
    inspection_id: checklist.inspection_id as string | null | undefined,
  });

  const { itemsByCategory, totalItems } = await processChecklistData(
    items,
    checklist.quote_id as string | null | undefined,
    checklist.inspection_id as string | null | undefined
  );

  return {
    type: 'mechanics' as const,
    checklist: {
      id: checklist.id as string,
      vehicle_id: checklist.vehicle_id as string,
      partner: { id: 'unknown', name: 'Mecânica', type: 'mechanic' },
      status: checklist.status as string,
      notes: checklist.notes as string | null,
      created_at: checklist.created_at as string,
    },
    itemsByCategory,
    stats: { totalItems },
  };
}
