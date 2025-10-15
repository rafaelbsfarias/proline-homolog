import type { AnomalyRow, ChecklistItemRow, EvidenceRow } from '../../checklist/schemas';
import { createSignedUrl } from '../utils/signedUrlService';
import { groupItemsByCategory } from '../utils/groupByCategory';

export async function mapEvidencesWithUrls(evidences: EvidenceRow[]) {
  const results = await Promise.all(
    (evidences || []).map(async e => {
      // FIX: storage_path pode ser um path (precisa de signed URL) ou já ser uma URL completa
      const isFullUrl = e.storage_path?.startsWith('http');
      let finalUrl = e.storage_path;

      if (!isFullUrl && e.storage_path) {
        const { url } = await createSignedUrl({ bucket: 'vehicle-media', path: e.storage_path });
        finalUrl = url;
      }

      return {
        id: e.id,
        item_key: e.item_key,
        media_url: finalUrl || '',
        description: e.description ?? '',
      };
    })
  );
  return results;
}

export function mapItemsWithEvidences(
  items: ChecklistItemRow[],
  evidencesWithUrls: Awaited<ReturnType<typeof mapEvidencesWithUrls>>
) {
  const normalizePartRequest = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return undefined;
    const obj = raw as Record<string, unknown>;
    const name = (obj.partName || obj.part_name) as string | undefined;
    const desc = (obj.partDescription || obj.part_description) as string | undefined;
    const qty = (obj.quantity ?? obj.qty) as number | string | undefined;
    const price = (obj.estimatedPrice || obj.estimated_price) as number | string | undefined;
    const quantity = qty != null ? Number(qty) : undefined;
    const estimatedPrice = price != null ? Number(price) : undefined;
    if (!name && !desc && quantity == null && estimatedPrice == null) return undefined;
    return {
      partName: name || 'Peça',
      partDescription: desc,
      quantity: quantity ?? 1,
      estimatedPrice: isNaN(Number(estimatedPrice)) ? undefined : (estimatedPrice as number),
    };
  };

  return (items || []).map(item => ({
    id: item.id,
    item_key: item.item_key,
    item_status: item.item_status,
    item_notes: item.item_notes,
    evidences: evidencesWithUrls.filter(ev => ev.item_key === item.item_key),
    part_request: normalizePartRequest(item.part_request),
  }));
}

export function mapItemsByCategory(itemsWithEvidences: ReturnType<typeof mapItemsWithEvidences>) {
  return groupItemsByCategory(itemsWithEvidences);
}

export async function mapAnomaliesWithUrls(anomalies: AnomalyRow[]) {
  const mapped = await Promise.all(
    (anomalies || []).map(async a => {
      const photos = await Promise.all(
        (a.photos || []).map(async photoPath => {
          const { url } = await createSignedUrl({ bucket: 'vehicle-media', path: photoPath });
          return url;
        })
      );
      return {
        id: a.id,
        description: a.description,
        photos: photos.filter(Boolean),
        severity: a.severity ?? 'medium',
        status: a.status ?? 'pending',
        created_at: a.created_at,
      };
    })
  );
  return mapped;
}
