import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';

const logger = getLogger('api:test:propose-collection-date');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    console.log('🚀 TEST_PROPOSE_START: Endpoint called', {
      timestamp: new Date().toISOString(),
      user: req.user?.email,
    });

    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const addressId: string | undefined = body?.addressId;
    const new_date: string | undefined = body?.new_date;

    console.log('📝 TEST_PROPOSE_PARAMS:', {
      clientId,
      addressId,
      new_date,
      hasClientId: !!clientId,
      hasAddressId: !!addressId,
      hasNewDate: !!new_date,
    });

    if (!clientId || !addressId || !new_date) {
      console.log('❌ TEST_PROPOSE_VALIDATION_FAILED: Missing required parameters');
      return NextResponse.json(
        { success: false, error: 'clientId, addressId e new_date são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('✅ TEST_PROPOSE_VALIDATION_PASSED: All parameters present');

    const admin = SupabaseService.getInstance().getAdminClient();
    console.log('🔧 TEST_PROPOSE_SUPABASE_CLIENT: Created admin client');

    // 1) Obter label do endereço
    console.log('🏠 TEST_PROPOSE_STEP_1: Fetching address data');
    const { data: addr, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();

    if (addrErr || !addr) {
      console.log('❌ TEST_PROPOSE_ADDRESS_ERROR:', { addressId, error: addrErr });
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }

    console.log('✅ TEST_PROPOSE_ADDRESS_FOUND:', addr);

    const addressLabel = formatAddressLabel(addr);
    const normalizedLabel = normalizeAddressLabel(addressLabel);

    console.log('🏷️ TEST_PROPOSE_ADDRESS_LABELS:', {
      addressLabel,
      normalizedLabel,
      addressData: addr,
    });

    // 2) Verificar precificação (simplificada)
    console.log('💰 TEST_PROPOSE_STEP_2: Checking pricing');

    // Buscar QUALQUER registro para este endereço (simplificada)
    const { data: collections, error: collectionsErr } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, status, collection_address')
      .eq('client_id', clientId)
      .in('status', ['requested', 'approved']);

    if (collectionsErr) {
      logger.error('load_collections_failed', {
        error: collectionsErr.message,
        clientId,
        addressLabel,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar coleções' },
        { status: 500 }
      );
    }

    // Filtrar apenas registros com fee válido (> 0)
    const validCollections =
      collections?.filter(
        (c: { collection_fee_per_vehicle: number }) =>
          typeof c.collection_fee_per_vehicle === 'number' && c.collection_fee_per_vehicle > 0
      ) || [];

    logger.info('price_verification_simplified', {
      clientId,
      addressLabel,
      totalCollections: collections?.length || 0,
      validCollections: validCollections.length,
      validCollectionsDetails: validCollections.map(
        (c: {
          id: string;
          collection_fee_per_vehicle: number;
          status: string;
          collection_address: string;
        }) => ({
          id: c.id,
          fee: c.collection_fee_per_vehicle,
          status: c.status,
          address: c.collection_address,
        })
      ),
    });

    if (validCollections.length === 0) {
      logger.warn('no_valid_collections_found', {
        clientId,
        addressLabel,
        totalCollections: collections?.length || 0,
      });

      return NextResponse.json(
        { success: false, error: 'Precifique o endereço antes de propor uma data de coleta.' },
        { status: 400 }
      );
    }

    console.log('✅ TEST_PROPOSE_VALIDATION_SUCCESS: Found valid collection with fee');

    // Usar a primeira coleção válida encontrada
    const vcRow = validCollections[0];

    logger.info('using_valid_collection', {
      collectionId: vcRow.id,
      collectionFee: vcRow.collection_fee_per_vehicle,
      collectionStatus: vcRow.status,
      collectionAddress: vcRow.collection_address,
    });

    return NextResponse.json({
      success: true,
      message: 'Test successful',
      data: {
        clientId,
        addressId,
        addressLabel,
        collectionFound: {
          id: vcRow.id,
          fee: vcRow.collection_fee_per_vehicle,
          status: vcRow.status,
        },
        wouldUpdateDate: new_date,
      },
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('❌ TEST_PROPOSE_UNHANDLED_ERROR:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
