import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:execution-evidences');

const EvidenceSchema = z.object({
  quote_item_id: z.string().uuid('ID do item inválido'),
  image_url: z.string().url('URL da imagem inválida'),
  description: z.string().nullable().optional(),
});

const SaveSchema = z.object({
  quote_id: z.string().uuid('ID do orçamento inválido'),
  evidences: z.array(EvidenceSchema),
});

async function saveHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = SaveSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('validation_error', { errors: validation.error.errors });
      return NextResponse.json(
        { ok: false, error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { quote_id, evidences } = validation.data;
    const partnerId = req.user.id;
    const admin = SupabaseService.getInstance().getAdminClient();

    // Verificar propriedade do orçamento
    const { data: quote, error: quoteError } = await admin
      .from('quotes')
      .select('id, partner_id, status')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote || quote.partner_id !== partnerId) {
      logger.warn('quote_not_found_or_forbidden', { quote_id, partnerId });
      return NextResponse.json(
        { ok: false, error: 'Orçamento não encontrado ou sem permissão' },
        { status: 403 }
      );
    }

    // Buscar itens vinculados ao orçamento (compat: quote_id ou budget_id)
    const { data: quoteItems, error: itemsError } = await admin
      .from('quote_items')
      .select('id')
      .or(`quote_id.eq.${quote_id},budget_id.eq.${quote_id}`);

    if (itemsError) {
      logger.error('fetch_items_error', { error: itemsError.message });
      return NextResponse.json(
        { ok: false, error: 'Erro ao buscar itens do orçamento' },
        { status: 500 }
      );
    }

    const allowedIds = new Set((quoteItems || []).map(i => i.id as string));
    const filtered = evidences.filter(ev => allowedIds.has(ev.quote_item_id));

    // Limpar antigas evidências dos itens
    if (allowedIds.size > 0) {
      const ids = Array.from(allowedIds);
      const { error: delErr } = await admin
        .from('execution_evidences')
        .delete()
        .in('quote_item_id', ids);
      if (delErr) {
        logger.error('delete_old_evidences_error', { error: delErr.message });
        return NextResponse.json(
          { ok: false, error: 'Erro ao limpar evidências antigas' },
          { status: 500 }
        );
      }
    }

    // Inserir novas evidências
    if (filtered.length > 0) {
      const rows = filtered.map(ev => ({
        quote_id: quote_id,
        quote_item_id: ev.quote_item_id,
        image_url: ev.image_url,
        description: ev.description ?? null,
      }));
      const { error: insErr } = await admin.from('execution_evidences').insert(rows);
      if (insErr) {
        logger.error('insert_evidences_error', { error: insErr.message });
        return NextResponse.json(
          { ok: false, error: 'Erro ao salvar evidências' },
          { status: 500 }
        );
      }
    }

    logger.info('save_evidences_success', {
      quote_id,
      inserted: filtered.length,
      itemCount: allowedIds.size,
    });

    return NextResponse.json({ ok: true, inserted: filtered.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error('unexpected_error', { error: msg });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(saveHandler);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
