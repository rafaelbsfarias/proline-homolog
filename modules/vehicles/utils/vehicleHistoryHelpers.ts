import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export function validateVehicleId(vehicleId: string | null) {
  if (!vehicleId) {
    return NextResponse.json({ success: false, error: 'vehicleId é obrigatório' }, { status: 400 });
  }
  return null;
}

type Ctx = 'admin' | 'specialist' | 'partner' | 'client';

export async function fetchVehicleHistory({
  supabase,
  vehicleId,
  logger,
  context,
}: {
  supabase: SupabaseClient;
  vehicleId: string;
  logger?: {
    info?: (...a: any[]) => void;
    warn?: (...a: any[]) => void;
    error?: (...a: any[]) => void;
  };
  context: Ctx;
}) {
  const { data: history, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });

  if (error) {
    logger?.error?.('history_fetch_error', { context, error: error.message });
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar histórico do veículo' },
      { status: 500 }
    );
  }

  logger?.info?.('raw_vehicle_history_data', {
    context,
    vehicleId: vehicleId.slice(0, 8),
    data: history,
  });

  logger?.info?.('history_fetched', {
    context,
    vehicleId: vehicleId.slice(0, 8),
    count: history?.length || 0,
  });

  return NextResponse.json({ success: true, history: history || [] });
}
