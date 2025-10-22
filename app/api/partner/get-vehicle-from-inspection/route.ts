import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:get-vehicle-from-inspection');

// Schema de validação
const GetVehicleSchema = z
  .object({
    inspectionId: z.string().uuid().optional(),
    vehicleId: z.string().uuid().optional(),
    quoteId: z.string().uuid().optional(),
  })
  .refine(data => data.inspectionId || data.vehicleId || data.quoteId, {
    message: 'Pelo menos um ID deve ser fornecido (inspectionId, vehicleId ou quoteId)',
  });

async function getVehicleFromInspectionHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Aceitar inspectionId, vehicleId ou quoteId
    const inspectionId = searchParams.get('inspectionId');
    const vehicleId = searchParams.get('vehicleId');
    const quoteId = searchParams.get('quoteId');

    // Validação com Zod
    const validation = GetVehicleSchema.safeParse({
      inspectionId: inspectionId || undefined,
      vehicleId: vehicleId || undefined,
      quoteId: quoteId || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const partnerId = req.user.id;
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

    logger.info('get_vehicle_request', {
      partner_id: partnerId,
      inspection_id: inspectionId,
      vehicle_id: vehicleId,
      quote_id: quoteId,
    });

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Buscar categoria do parceiro
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('category')
      .eq('profile_id', partnerId)
      .single();

    if (partnerError) {
      logger.error('partner_category_fetch_error', { partnerId, error: partnerError.message });
      return NextResponse.json({ error: 'Erro ao buscar categoria do parceiro' }, { status: 500 });
    }

    const partnerCategory = partnerData?.category;
    logger.info('partner_category_found', { partnerCategory });

    // Helper function para buscar observações específicas do serviço
    const getPartnerServiceNotes = async (inspectionId: string): Promise<string | undefined> => {
      if (!partnerCategory) return undefined;

      // Mapear categoria do parceiro para categoria do serviço
      const categoryMapping: Record<string, string> = {
        Mecânica: 'mechanics',
        'Funilaria/Pintura': 'body_paint',
        Lavagem: 'washing',
        Pneu: 'tires',
        Loja: 'loja',
        'Pátio Atacado': 'patio_atacado',
      };

      const serviceCategory = categoryMapping[partnerCategory];
      if (!serviceCategory) return undefined;

      const { data: serviceNotes, error: serviceNotesError } = await supabase
        .from('inspection_services')
        .select('notes')
        .eq('inspection_id', inspectionId)
        .eq('category', serviceCategory)
        .single();

      if (serviceNotesError) {
        return undefined;
      }

      return serviceNotes?.notes || undefined;
    };

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
            source_inspection_id,
            vehicles (
              id,
              brand,
              model,
              year,
              plate,
              color
            ),
            inspections!source_inspection_id (
              id,
              inspection_date,
              odometer,
              fuel_level,
              observations,
              finalized,
              created_at
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

      const inspection = quote.service_orders.inspections;

      // Buscar observações específicas do serviço se houver inspeção
      let partnerServiceNotes: string | undefined;
      if (inspection?.id) {
        partnerServiceNotes = await getPartnerServiceNotes(inspection.id);
      }

      return NextResponse.json({
        vehicle: quote.service_orders.vehicles,
        inspection: inspection
          ? {
              ...inspection,
              partnerServiceNotes,
            }
          : null,
        quoteId,
        serviceOrderId: quote.service_orders.id,
        vehicleId: quote.service_orders.vehicle_id,
        inspectionId: quote.service_orders.source_inspection_id,
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

    // Buscar observações específicas do serviço
    const partnerServiceNotes = await getPartnerServiceNotes(inspectionId);

    return NextResponse.json({
      vehicle: inspection.vehicles,
      inspection: {
        id: inspection.id,
        inspection_date: inspection.inspection_date,
        odometer: inspection.odometer,
        fuel_level: inspection.fuel_level,
        observations: inspection.observations,
        partnerServiceNotes,
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

export const GET = withPartnerAuth(getVehicleFromInspectionHandler);
