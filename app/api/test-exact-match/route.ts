import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    console.log('🚀 TEST_EXACT_MATCH: Testing exact address matching');

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

    // 1) Obter e formatar endereço exatamente como no endpoint original
    const { data: addr, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();

    if (addrErr || !addr) {
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }

    const addressLabel = formatAddressLabel(addr);
    const normalizedLabel = normalizeAddressLabel(addressLabel);

    console.log('🏷️ FORMATTED_ADDRESS:', {
      addressLabel,
      normalizedLabel,
      rawAddress: addr,
    });

    // 2) Query EXATA do endpoint original
    console.log('🔍 TESTING_EXACT_QUERY:');
    const { data: pricedRows, error: pricedErr } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel) // ← EXATA correspondência
      .in('status', ['requested', 'approved'])
      .not('collection_fee_per_vehicle', 'is', null)
      .gt('collection_fee_per_vehicle', 0)
      .order('collection_date', { ascending: false, nullsLast: true })
      .limit(1)
      .maybeSingle();

    console.log('📊 EXACT_QUERY_RESULT:', {
      found: !!pricedRows,
      pricedRows,
      error: pricedErr?.message,
    });

    // 3) Verificar todos os registros para comparar
    const { data: allCollections } = await admin
      .from('vehicle_collections')
      .select('id, collection_address, collection_fee_per_vehicle, status')
      .eq('client_id', clientId)
      .in('status', ['requested', 'approved']);

    console.log('📋 ALL_COLLECTIONS_FOR_CLIENT:', {
      total: allCollections?.length || 0,
      collections: allCollections?.map(
        (c: {
          id: string;
          collection_address: string;
          collection_fee_per_vehicle: number;
          status: string;
        }) => ({
          id: c.id,
          address: c.collection_address,
          normalizedAddress: normalizeAddressLabel(c.collection_address),
          fee: c.collection_fee_per_vehicle,
          status: c.status,
          exactMatch: c.collection_address === addressLabel,
          normalizedMatch: normalizeAddressLabel(c.collection_address) === normalizedLabel,
        })
      ),
    });

    // 4) Testar busca mais ampla (como no endpoint de teste que funcionou)
    const { data: broadSearch } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, status, collection_address')
      .eq('client_id', clientId)
      .in('status', ['requested', 'approved']);

    const validBroad =
      broadSearch?.filter(
        (c: { collection_fee_per_vehicle: number }) =>
          typeof c.collection_fee_per_vehicle === 'number' && c.collection_fee_per_vehicle > 0
      ) || [];

    console.log('🔄 BROAD_SEARCH_RESULT:', {
      totalFound: broadSearch?.length || 0,
      validWithFee: validBroad.length,
      validCollections: validBroad.map(
        (c: {
          id: string;
          collection_address: string;
          collection_fee_per_vehicle: number;
          status: string;
        }) => ({
          id: c.id,
          address: c.collection_address,
          fee: c.collection_fee_per_vehicle,
          status: c.status,
        })
      ),
    });

    return NextResponse.json({
      success: true,
      analysis: {
        formattedAddressLabel: addressLabel,
        normalizedAddressLabel: normalizedLabel,
        exactQueryFound: !!pricedRows,
        exactQueryResult: pricedRows,
        totalCollectionsForClient: allCollections?.length || 0,
        collectionsWithExactMatch:
          allCollections?.filter(
            (c: { collection_address: string }) => c.collection_address === addressLabel
          ).length || 0,
        broadSearchFoundValid: validBroad.length > 0,
        diagnosis: pricedRows ? 'EXACT_MATCH_WORKS' : 'EXACT_MATCH_FAILS_BUT_BROAD_WORKS',
      },
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('❌ TEST_EXACT_MATCH_ERROR:', error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno' },
      { status: 500 }
    );
  }
});
