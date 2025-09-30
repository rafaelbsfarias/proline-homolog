import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:checklist:load');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toFrontStatus(db?: string): 'ok' | 'attention' {
  const s = (db || '').toLowerCase();
  if (s === 'ok') return 'ok';
  if (s === 'nok') return 'attention';
  return 'ok';
}

export async function POST(request: Request) {
  try {
    const { inspectionId } = await request.json();

    if (!inspectionId) {
      return NextResponse.json({ ok: false, error: 'inspectionId é obrigatório' }, { status: 400 });
    }

    const supabase = createApiClient();

    // 1) Carregar mechanics_checklist por inspection_id
    const { data: checklist, error: checklistError } = await supabase
      .from('mechanics_checklist')
      .select('*')
      .eq('inspection_id', inspectionId)
      .single();

    if (checklistError && checklistError.code !== 'PGRST116') {
      return NextResponse.json({ ok: false, error: checklistError.message }, { status: 500 });
    }

    // 2) Carregar evidências e gerar URLs públicas
    const { data: evidences, error: evError } = await supabase
      .from('mechanics_checklist_evidences')
      .select('item_key, storage_path')
      .eq('inspection_id', inspectionId);

    if (evError) {
      return NextResponse.json({ ok: false, error: evError.message }, { status: 500 });
    }

    const evidenceMap: Record<string, { url: string }> = {};
    if (Array.isArray(evidences) && evidences.length > 0) {
      for (const row of evidences) {
        try {
          const { data: signed } = await supabase.storage
            .from('vehicle-media')
            .createSignedUrl(row.storage_path, 60 * 60); // 1h
          const url = signed?.signedUrl || '';
          if (url) evidenceMap[row.item_key] = { url };
        } catch {}
      }
    }

    // 3) Carregar itens por inspeção e montar objeto para UI
    const { data: items, error: itemsError } = await supabase
      .from('mechanics_checklist_items')
      .select('item_key, item_status, item_notes')
      .eq('inspection_id', inspectionId);

    if (itemsError) {
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
    }

    // 4) Construir formPartial: observações gerais e itens persistidos
    const formPartial: Record<string, any> = {};

    if (checklist) {
      formPartial.observations = checklist.general_observations || '';
      formPartial.fluidsNotes = checklist.fluids_notes || '';
    }

    if (Array.isArray(items)) {
      for (const it of items) {
        formPartial[it.item_key] = toFrontStatus(it.item_status);
        // Mapear notesKey como `${item_key}Notes`
        const notesKey = `${it.item_key}Notes`;
        formPartial[notesKey] = it.item_notes || '';
      }
    }

    logger.info('load_ok', {
      inspection_id: inspectionId,
      hasChecklist: !!checklist,
      itemsCount: Array.isArray(items) ? items.length : 0,
      evidencesCount: Array.isArray(evidences) ? evidences.length : 0,
    });
    return NextResponse.json({ ok: true, data: { form: formPartial, evidences: evidenceMap } });
  } catch (e) {
    logger.error('load_unexpected_error', { error: (e as any)?.message || String(e) });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
