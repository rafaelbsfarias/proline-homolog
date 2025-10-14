import type { AnomalyRow, ChecklistItemRow, EvidenceRow } from '../../checklist/schemas';
import { createSignedUrl } from '../utils/signedUrlService';
import { groupItemsByCategory } from '../utils/groupByCategory';

export async function mapEvidencesWithUrls(evidences: EvidenceRow[]) {
  const results = await Promise.all(
    (evidences || []).map(async e => {
      // FIX: media_url pode ser um path (precisa de signed URL) ou já ser uma URL completa
      const isFullUrl = e.media_url?.startsWith('http');
      let finalUrl = e.media_url;

      if (!isFullUrl && e.media_url) {
        const { url } = await createSignedUrl({ bucket: 'vehicle-media', path: e.media_url });
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
  return (items || []).map(item => ({
    id: item.id,
    item_key: item.item_key,
    item_status: item.item_status,
    item_notes: item.item_notes,
    evidences: evidencesWithUrls.filter(ev => ev.item_key === item.item_key),
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
