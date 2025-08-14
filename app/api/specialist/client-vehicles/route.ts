import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || '';

    if (!validateUUID(clientId)) {
      return NextResponse.json({ error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Authorization: ensure this specialist is linked to the client
    const { data: link, error: linkError } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('client_id', clientId)
      .eq('specialist_id', req.user.id)
      .maybeSingle();

    if (linkError) {
      return NextResponse.json({ error: 'Erro ao verificar vínculo' }, { status: 500 });
    }

    if (!link) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Fetch vehicles for the client
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, color, year, status')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, vehicles: vehicles || [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
