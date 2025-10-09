/**
 * Utilitário compartilhado para buscar histórico de veículos
 * Usado por endpoints de diferentes roles (partner, specialist, admin, client)
 */

import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Logger = any;

export interface VehicleHistoryOptions {
  /**
   * Cliente Supabase (já autenticado)
   */
  supabase: SupabaseClient;

  /**
   * ID do veículo para buscar histórico
   */
  vehicleId: string;

  /**
   * Logger para registrar operações
   */
  logger: Logger;

  /**
   * Contexto para logs (ex: 'partner', 'specialist')
   */
  context: string;
}

/**
 * Busca o histórico de um veículo
 *
 * @param options Opções de configuração
 * @returns Response com histórico ou erro
 */
export async function fetchVehicleHistory(options: VehicleHistoryOptions): Promise<NextResponse> {
  const { supabase, vehicleId, logger, context } = options;

  try {
    // Buscar histórico do veículo
    const { data: history, error: historyError } = await supabase
      .from('vehicle_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: true });

    if (historyError) {
      logger.error('history_fetch_error', { error: historyError.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar histórico do veículo' },
        { status: 500 }
      );
    }

    logger.info('history_fetched', {
      vehicleId: vehicleId.slice(0, 8),
      context,
      count: history?.length || 0,
    });

    return NextResponse.json({
      success: true,
      history: history || [],
    });
  } catch (error) {
    logger.error('unexpected_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Valida se o vehicleId foi fornecido
 *
 * @param vehicleId ID do veículo
 * @returns Response de erro ou null se válido
 */
export function validateVehicleId(vehicleId: string | null): NextResponse | null {
  if (!vehicleId) {
    return NextResponse.json({ success: false, error: 'vehicleId é obrigatório' }, { status: 400 });
  }
  return null;
}
