import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateFinalizeChecklist(vehicleId) {
  try {
    console.log('🧪 Simulando finalização de checklist...');

    // 1. Get latest non-finalized inspection for this vehicle
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, vehicle_id, specialist_id')
      .eq('vehicle_id', vehicleId)
      .eq('finalized', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!inspection) {
      console.log('❌ Nenhuma análise em andamento encontrada');
      return;
    }

    console.log('✅ Inspeção encontrada:', inspection.id);

    // 2. Mark as finalized
    const { error: updErr } = await supabase
      .from('inspections')
      .update({ finalized: true })
      .eq('id', inspection.id);

    if (updErr) {
      console.log('❌ Erro ao finalizar análise:', updErr);
      return;
    }

    console.log('✅ Inspeção finalizada');

    // 3. Update vehicle status
    await supabase.from('vehicles').update({ status: 'Análise Finalizada' }).eq('id', vehicleId);

    console.log('✅ Status do veículo atualizado');

    // 4. Get vehicle details
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('client_id')
      .eq('id', vehicleId)
      .single();

    if (!vehicle) {
      console.log('❌ Veículo não encontrado');
      return;
    }

    console.log('✅ Veículo encontrado, cliente:', vehicle.client_id);

    // 5. Get inspection services
    const { data: inspectionServices } = await supabase
      .from('inspection_services')
      .select('category')
      .eq('inspection_id', inspection.id)
      .eq('required', true);

    console.log('📋 Serviços encontrados:', inspectionServices?.length || 0);

    if (inspectionServices && inspectionServices.length > 0) {
      // Map categories
      const categoryMapping = {
        mechanics: 'mechanics',
        bodyPaint: 'body_paint',
        washing: 'washing',
        tires: 'tires',
        loja: 'loja',
        patioAtacado: 'patio_atacado',
      };

      const categories = Array.from(new Set(inspectionServices.map(s => s.category)));
      const dbCategories = categories.map(cat => categoryMapping[cat] || cat).filter(Boolean);

      console.log('📋 Categorias:', categories);
      console.log('📋 Categorias mapeadas:', dbCategories);

      // Process each category
      for (const category of dbCategories) {
        console.log(`🔧 Processando categoria: ${category}`);
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
      console.log('⚠️  Nenhum serviço obrigatório encontrado');
    }

    console.log('🎉 Simulação concluída!');
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  }
}

// Helper function to create service order and quotes for a category
async function createServiceOrderAndQuotes({
  supabase,
  inspectionId,
  vehicleId,
  clientId,
  specialistId,
  category,
}) {
  try {
    // Get service category ID
    const { data: serviceCategory } = await supabase
      .from('service_categories')
      .select('id')
      .eq('key', category)
      .single();

    if (!serviceCategory) {
      console.log(`⚠️  Categoria de serviço não encontrada: ${category}`);
      return;
    }

    console.log(`✅ Categoria encontrada: ${serviceCategory.id}`);

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
      console.log('❌ Erro ao criar service order:', soError);
      return;
    }

    console.log(`✅ Service order criada: ${serviceOrder.id}`);

    // Find partners for this category
    const { data: partners } = await supabase
      .from('partners_service_categories')
      .select(
        `
        partner_id,
        partners!inner(profile_id)
      `
      )
      .eq('category_id', serviceCategory.id);

    console.log(`📋 Parceiros encontrados: ${partners?.length || 0}`);

    if (partners && partners.length > 0) {
      // Create quotes for each partner
      const quotesToInsert = partners.map(partnerRelation => ({
        service_order_id: serviceOrder.id,
        partner_id: partnerRelation.partners[0]?.profile_id || partnerRelation.partner_id,
        status: 'pending_admin_approval',
        total_value: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: quotesError } = await supabase.from('quotes').insert(quotesToInsert);

      if (quotesError) {
        console.log('❌ Erro ao criar quotes:', quotesError);
      } else {
        console.log(`✅ Criadas ${partners.length} quotes para service order ${serviceOrder.id}`);
      }
    } else {
      console.log(`⚠️  Nenhum parceiro encontrado para categoria: ${category}`);
    }
  } catch (error) {
    console.log('❌ Erro ao processar categoria de serviço:', error);
  }
}

// Execute with the vehicle ID
simulateFinalizeChecklist('04b93f8c-c6c6-416e-bdae-94e2ef182bcf');
