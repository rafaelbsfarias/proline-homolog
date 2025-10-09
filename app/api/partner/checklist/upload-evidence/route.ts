import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const logger = getLogger('api:partner:checklist:upload-evidence');

// Validação do FormData
const UploadEvidenceSchema = z.object({
  vehicle_id: z.string().uuid('ID do veículo inválido'),
  item_key: z.string().min(1, 'item_key é obrigatório'),
});

async function uploadEvidenceHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();
    const userId = req.user.id;

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const vehicle_id = String(form.get('vehicle_id') || '');
    const item_key = String(form.get('item_key') || '');

    // Validar entrada
    const validation = UploadEvidenceSchema.safeParse({ vehicle_id, item_key });
    if (!validation.success) {
      logger.warn('validation_error', { errors: validation.error.errors });
      return NextResponse.json(
        { ok: false, error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ ok: false, error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/gi, '') || 'jpg';
    const filename = `checklist-${item_key}-${Date.now()}.${safeExt}`;
    const objectPath = `${vehicle_id}/${userId}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const { data: up, error: upErr } = await supabase.storage
      .from('vehicle-media')
      .upload(objectPath, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (upErr) {
      logger.error('upload_error', { error: upErr.message });
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from('vehicle-media')
      .createSignedUrl(objectPath, 60 * 60);

    return NextResponse.json({
      ok: true,
      storage_path: up?.path || objectPath,
      url: signed?.signedUrl || null,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error('unexpected', { error: error.message });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(uploadEvidenceHandler);
