import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { createVehicleActionHandler } from '@/modules/specialist/utils/apiUtils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:specialist:finalize-checklist');

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  // Get latest non-finalized inspection for this vehicle
  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, vehicle_id, specialist_id')
    .eq('vehicle_id', vehicleId)
    .eq('finalized', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inspection) {
    return { json: { error: 'Nenhuma análise em andamento' }, status: 404 };
  }

  // Mark as finalized with timestamp
  const { error: updErr } = await supabase
    .from('inspections')
    .update({
      finalized: true,
      finalized_at: new Date().toISOString(),
    })
    .eq('id', inspection.id);

  if (updErr) {
    return { json: { error: 'Erro ao finalizar análise' }, status: 500 };
  }

  // Update vehicle status
  await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.ANALISE_FINALIZADA })
    .eq('id', vehicleId);

  // Get vehicle details for service order creation
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('client_id')
    .eq('id', vehicleId)
    .single();

  if (!vehicle) {
    return { json: { error: 'Veículo não encontrado' }, status: 404 };
  }

  // Get inspection services to determine categories
  const { data: inspectionServices } = await supabase
    .from('inspection_services')
    .select('category')
    .eq('inspection_id', inspection.id)
    .eq('required', true);

  logger.info(`Serviços encontrados para inspeção ${inspection.id}:`, {
    count: inspectionServices?.length,
    services: inspectionServices,
  });

  if (inspectionServices && inspectionServices.length > 0) {
    // Map frontend category names to database keys
    const categoryMapping: { [key: string]: string } = {
      mechanics: 'mechanics',
      bodyPaint: 'body_paint',
      washing: 'washing',
      tires: 'tires',
      loja: 'loja',
      patioAtacado: 'patio_atacado',
    };

    // Get unique categories and map to database keys
    const categories = Array.from(new Set(inspectionServices.map(s => s.category)));
    const dbCategories = categories.map(cat => categoryMapping[cat] || cat).filter(Boolean);

    logger.info(`Categorias do frontend:`, { categories });
    logger.info(`Categorias mapeadas para DB:`, { dbCategories });

    // Process each category
    for (const category of dbCategories) {
      logger.info(`Processando categoria: ${category}`);
      await createServiceOrderAndQuotes({
        supabase,
        inspectionId: inspection.id,
        vehicleId,
        clientId: vehicle.client_id,
        specialistId: inspection.specialist_id,
        category,
      });
    }
  } else {
    logger.warn(`Nenhum serviço obrigatório encontrado para inspeção ${inspection.id}`);
  }

  return { json: { success: true }, status: 200 };
});

// Helper function to create service order and quotes for a category
async function createServiceOrderAndQuotes({
  supabase,
  inspectionId,
  vehicleId,
  clientId,
  specialistId,
  category,
}: {
  supabase: SupabaseClient;
  inspectionId: string;
  vehicleId: string;
  clientId: string;
  specialistId: string;
  category: string;
}) {
  try {
    // Get service category ID
    const { data: serviceCategory } = await supabase
      .from('service_categories')
      .select('id')
      .eq('key', category)
      .single();

    if (!serviceCategory) {
      logger.warn(`Categoria de serviço não encontrada: ${category}`);
      return;
    }

    // Generate order code
    const orderCode = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create service order
    const { data: serviceOrder, error: soError } = await supabase
      .from('service_orders')
      .insert({
        vehicle_id: vehicleId,
        client_id: clientId,
        specialist_id: specialistId,
        status: 'pending_quote',
        order_code: orderCode,
        source_inspection_id: inspectionId,
        category_id: serviceCategory.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (soError || !serviceOrder) {
      logger.error('Erro ao criar service order:', { error: soError, inspectionId, vehicleId });
      return;
    }

    // Find partners for this category
    logger.info(`Buscando parceiros para categoria ${category}`, {
      service_category_id: serviceCategory.id,
      service_category_key: category,
    });

    const { data: partners, error: partnersError } = await supabase
      .from('partners_service_categories')
      .select(
        `
        partner_id,
        partners!inner(profile_id)
      `
      )
      .eq('category_id', serviceCategory.id);

    if (partnersError) {
      logger.error(`Erro ao buscar parceiros para categoria ${category}:`, {
        error: partnersError,
        service_category_id: serviceCategory.id,
      });
    }

    logger.info(`Parceiros encontrados para categoria ${category}:`, {
      count: partners?.length,
      service_category_id: serviceCategory.id,
      partners: partners?.map(p => ({ partner_id: p.partner_id, partners: p.partners })),
    });

    if (partners && partners.length > 0) {
      // Create quotes for each partner
      // Status = 'pending_partner' indica que o parceiro precisa preencher o orçamento
      // Após preenchimento, muda para 'admin_review' (aguardando aprovação do admin)
      const quotesToInsert = partners.map(
        (partnerRelation: {
          partner_id: string;
          partners: { profile_id: string } | { profile_id: string }[];
        }) => {
          // O Supabase pode retornar partners como objeto ou array dependendo da relação
          const profileId = Array.isArray(partnerRelation.partners)
            ? partnerRelation.partners[0]?.profile_id
            : (partnerRelation.partners as { profile_id: string })?.profile_id;

          return {
            service_order_id: serviceOrder.id,
            partner_id: profileId, // Sempre usar o profile_id, não o partner_id da tabela partners
            status: 'pending_partner', // Aguardando parceiro preencher o orçamento
            total_value: 0, // Will be updated when partner submits quote
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      );

      logger.info(`Quotes a serem inseridas:`, {
        quotes: quotesToInsert.map(q => ({
          service_order_id: q.service_order_id,
          partner_id: q.partner_id,
        })),
      });

      const { error: quotesError } = await supabase.from('quotes').insert(quotesToInsert);

      if (quotesError) {
        logger.error('Erro ao criar quotes:', {
          error: quotesError,
          serviceOrderId: serviceOrder.id,
        });
      } else {
        logger.info(`Criadas ${partners.length} quotes para service order ${serviceOrder.id}`);
      }
    } else {
      logger.warn(`Nenhum parceiro encontrado para categoria: ${category}`);
    }
  } catch (error) {
    logger.error('Erro ao processar categoria de serviço:', { error, category, inspectionId });
  }
}
