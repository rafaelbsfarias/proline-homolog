import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';
import { writeFileSync } from 'fs';
import { join } from 'path';

const logger = getLogger('test:real-price-verification');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { clientId, addressId } = body;

    const logFile = join(process.cwd(), 'real-price-verification-debug.log');

    logger.info('REAL_PRICE_VERIFICATION_START', {
      clientId,
      addressId,
      timestamp: new Date().toISOString(),
    });

    // Usar admin client para bypass de autenticação
    const admin = SupabaseService.getInstance().getAdminClient();

    // 1) Obter label do endereço
    const { data: addr, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();

    if (addrErr || !addr) {
      const errorData = {
        timestamp: new Date().toISOString(),
        error: 'Address not found',
        addressId,
        addrErr: addrErr?.message,
      };
      writeFileSync(logFile, JSON.stringify(errorData, null, 2) + '\n', { flag: 'a' });
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }

    const addressLabel = formatAddressLabel(addr);
    const normalizedLabel = normalizeAddressLabel(addressLabel);

    // Verificar precificação
    let vcRow = null;

    // PRIMEIRA TENTATIVA: Buscar apenas registros com fee > 0
    const { data: pricedRows } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, status, collection_address')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .in('status', ['requested', 'approved'])
      .not('collection_fee_per_vehicle', 'is', null)
      .gt('collection_fee_per_vehicle', 0)
      .order('collection_date', { ascending: false, nullsLast: true })
      .limit(1)
      .maybeSingle();

    if (pricedRows) {
      vcRow = pricedRows;
    } else {
      // SEGUNDA TENTATIVA: Se não encontrou com preço, buscar qualquer registro para o endereço
      const { data: anyRows } = await admin
        .from('vehicle_collections')
        .select('id, collection_fee_per_vehicle, status, collection_address')
        .eq('client_id', clientId)
        .eq('collection_address', addressLabel)
        .in('status', ['requested', 'approved'])
        .order('collection_date', { ascending: false, nullsLast: true })
        .limit(1)
        .maybeSingle();

      vcRow = anyRows;
    }

    const hasFee =
      typeof vcRow?.collection_fee_per_vehicle === 'number' && vcRow.collection_fee_per_vehicle > 0;

    // LOG DETALHADO
    const analysisData = {
      timestamp: new Date().toISOString(),
      clientId,
      addressId,
      addressLabel,
      normalizedLabel,
      vcRowFound: !!vcRow,
      vcRowData: vcRow,
      vcRowFee: vcRow?.collection_fee_per_vehicle,
      vcRowFeeType: typeof vcRow?.collection_fee_per_vehicle,
      vcRowFeeIsNumber: typeof vcRow?.collection_fee_per_vehicle === 'number',
      vcRowFeeGreaterThanZero: vcRow?.collection_fee_per_vehicle
        ? vcRow.collection_fee_per_vehicle > 0
        : false,
      hasFee,
      decision: !vcRow?.id || !hasFee ? 'NEEDS_PRICING' : 'HAS_VALID_FEE',
    };

    logger.info('REAL_PRICE_VERIFICATION_ANALYSIS', analysisData);
    writeFileSync(logFile, JSON.stringify(analysisData, null, 2) + '\n', { flag: 'a' });
    console.log('🔍 REAL_PRICE_VERIFICATION_ANALYSIS:', analysisData);

    // Buscar todas as collections para debug
    const { data: allCollections } = await admin
      .from('vehicle_collections')
      .select('id, collection_address, collection_fee_per_vehicle, status, client_id')
      .eq('client_id', clientId);

    const allCollectionsData = {
      timestamp: new Date().toISOString(),
      totalCollections: allCollections?.length || 0,
      collections: allCollections?.map(
        (c: {
          id: string;
          collection_address: string;
          collection_fee_per_vehicle: number | null;
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
    };

    writeFileSync(logFile, JSON.stringify(allCollectionsData, null, 2) + '\n', { flag: 'a' });

    if (!vcRow?.id || !hasFee) {
      const failureData = {
        timestamp: new Date().toISOString(),
        clientId,
        addressId,
        addressLabel,
        vcRowFee: vcRow?.collection_fee_per_vehicle,
        hasFee,
        errorMessage: 'Precifique o endereço antes de propor uma data de coleta.',
      };

      logger.error('REAL_FINAL_PRICE_VERIFICATION_FAILURE', failureData);
      writeFileSync(logFile, JSON.stringify(failureData, null, 2) + '\n', { flag: 'a' });
      console.error('🚨 REAL_FINAL_PRICE_VERIFICATION_FAILURE:', failureData);

      return NextResponse.json(
        { success: false, error: 'Precifique o endereço antes de propor uma data de coleta.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Price verification successful',
      data: analysisData,
    });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('real_test_error', { error: error?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};
