import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { MediaUploadService, UploadError } from '@/modules/common/services/MediaUploadService';
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
    const mediaService = MediaUploadService.getInstance();
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

    // Usar MediaUploadService
    const uploadResult = await mediaService.uploadSingleFile(
      file,
      {
        bucket: 'vehicle-media',
        folder: `${vehicle_id}/${userId}`,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        cacheControl: '3600',
        upsert: true,
      },
      {
        vehicle_id,
        item_key,
        partner_id: userId,
      }
    );

    return NextResponse.json({
      ok: true,
      storage_path: uploadResult.path,
      url: uploadResult.signedUrl || null,
    });
  } catch (e) {
    if (e instanceof UploadError) {
      logger.warn('upload_validation_error', { code: e.code, message: e.message });
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }

    const error = e instanceof Error ? e : new Error(String(e));
    logger.error('unexpected', { error: error.message });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(uploadEvidenceHandler);
