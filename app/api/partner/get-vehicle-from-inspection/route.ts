import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:get-vehicle-from-inspection');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Aceitar inspectionId, vehicleId ou quoteId
    const inspectionId = searchParams.get('inspectionId');
    const vehicleId = searchParams.get('vehicleId');
    const quoteId = searchParams.get('quoteId');

    const targetId = inspectionId || vehicleId || quoteId;
    const isVehicleId = !!vehicleId;
    const isQuoteId = !!quoteId;

    if (!targetId || !validateUUID(targetId)) {
      let errorType = 'ID inválido';
      if (isVehicleId) errorType = 'vehicleId inválido';
      else if (isQuoteId) errorType = 'quoteId inválido';
      else errorType = 'inspectionId inválido';

      return NextResponse.json({ error: errorType }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // FLUXO 1: Busca direta por vehicleId
    if (isVehicleId) {
      logger.info('fetching_vehicle_directly', { vehicleId });

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, brand, model, year, plate, color')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) {
        logger.error('vehicle_fetch_error', { vehicleId, error: vehicleError.message });
        return NextResponse.json({ error: 'Erro ao buscar dados do veículo' }, { status: 500 });
      }

      if (!vehicle) {
        return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
      }

      return NextResponse.json({
        vehicle,
        vehicleId,
        source: 'direct_vehicle_lookup',
      });
    }

    // FLUXO 2: Busca por quoteId
    if (isQuoteId) {
      logger.info('fetching_vehicle_from_quote', { quoteId });

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(
          `
          id,
          service_order_id,
          service_orders (
            id,
            vehicle_id,
            vehicles (
              id,
              brand,
              model,
              year,
              plate,
              color
            )
          )
        `
        )
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        logger.error('quote_fetch_error', { quoteId, error: quoteError.message });
        return NextResponse.json({ error: 'Erro ao buscar dados do orçamento' }, { status: 500 });
      }

      if (!quote || !quote.service_orders || !quote.service_orders.vehicles) {
        logger.warn('quote_or_vehicle_not_found', { quoteId });
        return NextResponse.json({ error: 'Orçamento ou veículo não encontrado' }, { status: 404 });
      }

      return NextResponse.json({
        vehicle: quote.service_orders.vehicles,
        quoteId,
        serviceOrderId: quote.service_orders.id,
        vehicleId: quote.service_orders.vehicle_id,
        source: 'quote_lookup',
      });
    }

    // FLUXO 3: Busca por inspectionId
    logger.info('fetching_vehicle_from_inspection', { inspectionId });

    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select(
        `
        id,
        vehicle_id,
        inspection_date,
        odometer,
        fuel_level,
        observations,
        finalized,
        created_at,
        vehicles (
          id,
          brand,
          model,
          year,
          plate,
          color
        )
      `
      )
      .eq('id', inspectionId)
      .single();

    if (inspectionError) {
      logger.error('inspection_fetch_error', { inspectionId, error: inspectionError.message });
      return NextResponse.json({ error: 'Erro ao buscar dados da inspeção' }, { status: 500 });
    }

    if (!inspection || !inspection.vehicles) {
      logger.warn('inspection_or_vehicle_not_found', { inspectionId });
      return NextResponse.json({ error: 'Inspeção ou veículo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      vehicle: inspection.vehicles,
      inspection: {
        id: inspection.id,
        inspection_date: inspection.inspection_date,
        odometer: inspection.odometer,
        fuel_level: inspection.fuel_level,
        observations: inspection.observations,
        finalized: inspection.finalized,
        created_at: inspection.created_at,
      },
      inspectionId,
      vehicleId: inspection.vehicle_id,
      source: 'inspection_lookup',
    });
  } catch (error) {
    logger.error('unexpected_error', { error });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
