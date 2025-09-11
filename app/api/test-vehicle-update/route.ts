import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { STATUS } from '@/modules/common/constants/status';

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const addressId: string | undefined = body?.addressId;

    if (!clientId || !addressId) {
      return NextResponse.json(
        { success: false, error: 'clientId e addressId são obrigatórios' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Verificar veículos para este endereço
    const { data: allVehiclesForAddress } = await admin
      .from('vehicles')
      .select('id, status, estimated_arrival_date')
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId);

    console.log('VEHICLES_DEBUG:', {
      clientId,
      addressId,
      totalVehicles: allVehiclesForAddress?.length || 0,
      vehicles: allVehiclesForAddress?.map(
        (v: { id: string; status: string; estimated_arrival_date: string }) => ({
          id: v.id,
          status: v.status,
          estimated_arrival_date: v.estimated_arrival_date,
        })
      ),
    });

    // Verificar veículos em aprovação
    const { data: vehiclesInApproval } = await admin
      .from('vehicles')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.APROVACAO_NOVA_DATA);

    console.log('VEHICLES_IN_APPROVAL:', {
      count: vehiclesInApproval?.length || 0,
      vehicles: vehiclesInApproval,
    });

    let allowedPrev: string[];
    let newStatus: string;

    if (vehiclesInApproval && vehiclesInApproval.length > 0) {
      allowedPrev = [STATUS.APROVACAO_NOVA_DATA];
      newStatus = STATUS.SOLICITACAO_MUDANCA_DATA;
    } else {
      allowedPrev = [STATUS.PONTO_COLETA_SELECIONADO, STATUS.AGUARDANDO_APROVACAO];
      newStatus = STATUS.SOLICITACAO_MUDANCA_DATA;
    }

    console.log('UPDATE_STRATEGY:', {
      allowedPrev,
      newStatus,
      context: vehiclesInApproval && vehiclesInApproval.length > 0 ? 'response' : 'initial',
    });

    // Tentar atualização
    const { error: vehErr } = await admin
      .from('vehicles')
      .update({ status: newStatus })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .in('status', allowedPrev);

    console.log('UPDATE_RESULT:', {
      error: vehErr?.message,
      errorCode: vehErr?.code,
      allowedPrev,
      newStatus,
    });

    if (vehErr) {
      // Verificar status atuais dos veículos
      const { data: allVehiclesCheck } = await admin
        .from('vehicles')
        .select('id, status')
        .eq('client_id', clientId)
        .eq('pickup_address_id', addressId);

      const vehiclesByStatus = allVehiclesCheck?.reduce(
        (acc: Record<string, number>, v: { status: string }) => {
          acc[v.status] = (acc[v.status] || 0) + 1;
          return acc;
        },
        {}
      );

      console.log('VEHICLES_STATUS_ANALYSIS:', {
        totalVehicles: allVehiclesCheck?.length || 0,
        vehiclesByStatus,
        allowedPrev,
        newStatus,
      });

      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar veículos', details: vehErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle update test successful',
      data: {
        clientId,
        addressId,
        totalVehicles: allVehiclesForAddress?.length || 0,
        vehiclesInApproval: vehiclesInApproval?.length || 0,
        allowedPrev,
        newStatus,
        updatedVehicles:
          allVehiclesForAddress?.filter((v: { status: string }) => allowedPrev.includes(v.status))
            .length || 0,
      },
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('TEST_VEHICLE_UPDATE_ERROR:', error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno' },
      { status: 500 }
    );
  }
});
