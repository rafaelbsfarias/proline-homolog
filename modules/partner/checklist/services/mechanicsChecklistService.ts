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
import { NotFoundError } from '../errors';

export async function getMechanicsChecklist(vehicleId: string, partner: Partner) {
  const checklist = await getLatestChecklistByVehicle(vehicleId);
  if (!checklist) throw new NotFoundError('Checklist de mecânica não encontrado');

  const items = await getItemsByContext({
    quote_id: checklist.quote_id,
    inspection_id: checklist.inspection_id,
    vehicle_id: checklist.quote_id || checklist.inspection_id ? undefined : vehicleId,
  });
  const evidences = await getEvidencesByContext({
    quote_id: checklist.quote_id,
    inspection_id: checklist.inspection_id,
  });
  const evidencesWithUrls = await mapEvidencesWithUrls(evidences);
  const itemsWithEvs = mapItemsWithEvidences(items, evidencesWithUrls);
  const itemsByCategory = mapItemsByCategory(itemsWithEvs);

  return {
    type: 'mechanics' as const,
    checklist: {
      id: checklist.id,
      vehicle_id: checklist.vehicle_id,
      partner: { id: partner.id, name: partner.name, type: partner.partner_type },
      status: checklist.status,
      notes: checklist.notes,
      created_at: checklist.created_at,
    },
    itemsByCategory,
    stats: { totalItems: itemsWithEvs.length },
  };
}

export async function getMechanicsChecklistDirect(vehicleId: string) {
  // Primeiro, tentar via itens diretos por vehicle_id (legado)
  const directItems = await getDirectItemsByVehicle(vehicleId);
  if (directItems.length > 0) {
    const firstItem = directItems[0];
    const evidences = await getEvidencesByContext({
      quote_id: firstItem.quote_id ?? undefined,
      inspection_id: firstItem.inspection_id ?? undefined,
    });
    const evidencesWithUrls = await mapEvidencesWithUrls(evidences);
    const itemsWithEvs = mapItemsWithEvidences(directItems, evidencesWithUrls);
    const itemsByCategory = mapItemsByCategory(itemsWithEvs);
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
      stats: { totalItems: itemsWithEvs.length },
    };
  }

  // Em seguida, tentar checklist principal + contexto
  const checklist = await getLatestChecklistByVehicle(vehicleId);
  if (!checklist) return null;
  const items = await getItemsByContext({
    quote_id: checklist.quote_id,
    inspection_id: checklist.inspection_id,
  });
  const evidences = await getEvidencesByContext({
    quote_id: checklist.quote_id,
    inspection_id: checklist.inspection_id,
  });
  const evidencesWithUrls = await mapEvidencesWithUrls(evidences);
  const itemsWithEvs = mapItemsWithEvidences(items, evidencesWithUrls);
  const itemsByCategory = mapItemsByCategory(itemsWithEvs);
  return {
    type: 'mechanics' as const,
    checklist: {
      id: checklist.id,
      vehicle_id: checklist.vehicle_id,
      partner: { id: 'unknown', name: 'Mecânica', type: 'mechanic' },
      status: checklist.status,
      notes: checklist.notes,
      created_at: checklist.created_at,
    },
    itemsByCategory,
    stats: { totalItems: itemsWithEvs.length },
  };
}
