import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';

const logger = getLogger('api:test:full-flow');

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    console.log('🚀 FULL_FLOW_TEST_START: Testing complete endpoint flow');

    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const addressId: string | undefined = body?.addressId;
    const new_date: string | undefined = body?.new_date;

    console.log('📝 FULL_FLOW_PARAMS:', { clientId, addressId, new_date });

    if (!clientId || !addressId || !new_date) {
      console.log('❌ FULL_FLOW_VALIDATION_FAILED');
      return NextResponse.json(
        { success: false, error: 'clientId, addressId e new_date são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('✅ FULL_FLOW_VALIDATION_PASSED');

    const admin = SupabaseService.getInstance().getAdminClient();

    // STEP 1: Get address
    console.log('🏠 STEP_1: Getting address data');
    const { data: addr, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();

    if (addrErr || !addr) {
      console.log('❌ STEP_1_FAILED: Address not found');
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }

    const addressLabel = formatAddressLabel(addr);
    console.log('✅ STEP_1_SUCCESS:', { addressLabel });

    // STEP 2: Check pricing (simplified)
    console.log('💰 STEP_2: Checking pricing');
    const { data: collections, error: collectionsErr } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, status, collection_address')
      .eq('client_id', clientId)
      .in('status', ['requested', 'approved']);

    if (collectionsErr) {
      console.log('❌ STEP_2_FAILED: Collections query error');
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar coleções' },
        { status: 500 }
      );
    }

    const validCollections =
      collections?.filter(
        (c: { collection_fee_per_vehicle: number }) =>
          typeof c.collection_fee_per_vehicle === 'number' && c.collection_fee_per_vehicle > 0
      ) || [];

    console.log('📊 STEP_2_COLLECTIONS:', {
      total: collections?.length || 0,
      valid: validCollections.length,
    });

    if (validCollections.length === 0) {
      console.log('❌ STEP_2_FAILED: No valid collections with fee');
      return NextResponse.json(
        { success: false, error: 'Precifique o endereço antes de propor uma data de coleta.' },
        { status: 400 }
      );
    }

    const vcRow = validCollections[0];
    console.log('✅ STEP_2_SUCCESS: Found valid collection', {
      id: vcRow.id,
      fee: vcRow.collection_fee_per_vehicle,
    });

    // STEP 3: Update collection date
    console.log('🔄 STEP_3: Updating collection date');
    const { error: updateErr } = await admin
      .from('vehicle_collections')
      .update({ collection_date: new_date })
      .eq('id', vcRow.id);

    if (updateErr) {
      console.log('❌ STEP_3_FAILED: Update collection error', updateErr.message);
      return NextResponse.json(
        { success: false, error: 'Falha ao atualizar proposta' },
        { status: 500 }
      );
    }

    console.log('✅ STEP_3_SUCCESS: Collection date updated');

    // STEP 4: Update vehicles
    console.log('🚗 STEP_4: Updating vehicles');

    const { data: vehiclesInApproval } = await admin
      .from('vehicles')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.APROVACAO_NOVA_DATA);

    let allowedPrev: string[];
    let newStatus: string;

    if (vehiclesInApproval && vehiclesInApproval.length > 0) {
      allowedPrev = [STATUS.APROVACAO_NOVA_DATA];
      newStatus = STATUS.SOLICITACAO_MUDANCA_DATA;
      console.log('📋 STEP_4_CONTEXT: Responding to client proposal');
    } else {
      allowedPrev = [STATUS.PONTO_COLETA_SELECIONADO, STATUS.AGUARDANDO_APROVACAO];
      newStatus = STATUS.SOLICITACAO_MUDANCA_DATA;
      console.log('📋 STEP_4_CONTEXT: Initial admin proposal');
    }

    const { error: vehErr } = await admin
      .from('vehicles')
      .update({ status: newStatus })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .in('status', allowedPrev);

    if (vehErr) {
      console.log('❌ STEP_4_FAILED: Vehicle update error', vehErr.message);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar veículos' },
        { status: 500 }
      );
    }

    console.log('✅ STEP_4_SUCCESS: Vehicles updated');

    // STEP 5: Success
    console.log('🎉 FULL_FLOW_SUCCESS: All steps completed');

    return NextResponse.json({
      success: true,
      message: 'Full flow test successful',
      data: {
        clientId,
        addressId,
        addressLabel,
        collectionUpdated: vcRow.id,
        newDate: new_date,
        vehiclesUpdated: vehiclesInApproval?.length || 0,
        context: vehiclesInApproval && vehiclesInApproval.length > 0 ? 'response' : 'initial',
      },
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('❌ FULL_FLOW_UNHANDLED_ERROR:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
