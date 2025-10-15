import { NextResponse } from 'next/server';
import { withAnyAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { z } from 'zod';
import { getLogger } from '@/modules/logger';
import { ChecklistService } from '@/modules/partner/services/ChecklistService';
import { groupItemsByCategory } from '@/modules/partner/checklist/utils/groupByCategory';

const logger = getLogger('api:checklist:mechanics:view');

const QuerySchema = z.object({
  vehicle_id: z.string().uuid('vehicle_id inválido'),
  inspection_id: z.string().uuid('inspection_id inválido').optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      vehicle_id: searchParams.get('vehicle_id') || undefined,
      inspection_id: searchParams.get('inspection_id') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Parâmetros inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { vehicle_id, inspection_id } = parsed.data;

    // Usar ChecklistService (admin client) para evitar impactos de RLS/SSR cookies
    const svc = ChecklistService.getInstance();
    const details = await svc.loadChecklistWithDetails(inspection_id || null, null, undefined);

    if (!details.success || !details.data) {
      return NextResponse.json(
        { ok: false, error: 'Checklist de mecânica não encontrado' },
        { status: 404 }
      );
    }

    // details.data.items (array) e evidences (map { [item_key]: { urls: string[] } })
    const items = (details.data.items || []) as Array<{
      id?: string;
      item_key: string;
      item_status: string;
      item_notes: string | null;
      part_request?: unknown;
    }>;
    const evidenceMap = (details.data.evidences || {}) as Record<string, { urls: string[] }>;

    // Montar evidências por item como lista de objetos
    const itemsWithEvidences = items.map(it => {
      const urls = evidenceMap[it.item_key]?.urls || [];
      return {
        id: it.id || `${it.item_key}`,
        item_key: it.item_key,
        item_status: it.item_status,
        item_notes: it.item_notes,
        evidences: urls.map((u, idx) => ({
          id: `${it.item_key}-${idx}`,
          media_url: u,
          description: '',
        })),
        part_request: (it as any).part_request,
      };
    });

    const itemsByCategory = groupItemsByCategory(itemsWithEvidences as any);
    const totalItems = itemsWithEvidences.length;

    return NextResponse.json(
      {
        type: 'mechanics' as const,
        checklist: {
          id: 'mechanics-view',
          vehicle_id,
          partner: { id: 'unknown', name: 'Mecânica', type: 'mechanic' },
          status: 'submitted',
          notes: null,
          created_at: new Date().toISOString(),
        },
        itemsByCategory,
        stats: { totalItems },
      },
      { status: 200 }
    );
  } catch (e) {
    const error = e as Error;
    logger.error('unexpected_error', { error: error.message || String(e) });
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 500 });
  }
}

export const GET = withAnyAuth(handler);
