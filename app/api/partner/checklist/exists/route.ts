import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { quoteId } = await request.json();

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID é obrigatório' }, { status: 400 });
    }

    const supabase = createServerComponentClient({
      cookies: async () => await cookies(),
    });

    // Buscar o vehicle_id através da quote (forma robusta, objeto ou array)
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        service_order_id,
        service_orders!inner (
          id,
          vehicle_id
        )
      `
      )
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ hasChecklist: false });
    }

    const so = (quote as any).service_orders;
    const vehicleId: string | undefined = Array.isArray(so) ? so[0]?.vehicle_id : so?.vehicle_id;

    if (!vehicleId) {
      return NextResponse.json({ hasChecklist: false });
    }

    // Verificar se existe pelo menos um checklist com status 'submitted' para este veículo
    const { data: rows, error: checklistError } = await supabase
      .from('mechanics_checklist')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'submitted')
      .limit(1);

    if (checklistError) {
      return NextResponse.json({ hasChecklist: false });
    }

    const hasSubmittedChecklist = Array.isArray(rows) && rows.length > 0;

    return NextResponse.json({ hasChecklist: hasSubmittedChecklist });
  } catch {
    return NextResponse.json({ hasChecklist: false });
  }
}
