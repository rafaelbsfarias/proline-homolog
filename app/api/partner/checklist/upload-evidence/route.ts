import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const logger = getLogger('api:partner:checklist:upload-evidence');

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;

    const supabase = createApiClient();

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { data: userInfo } = await supabase.auth.getUser(token);
    const userId = userInfo.user?.id;
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Usuário não autenticado' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const vehicle_id = String(form.get('vehicle_id') || '');
    const item_key = String(form.get('item_key') || '');

    if (!file || !vehicle_id || !item_key) {
      return NextResponse.json({ ok: false, error: 'Parâmetros inválidos' }, { status: 400 });
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
    logger.error('unexpected', { error: (e as any)?.message || String(e) });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
