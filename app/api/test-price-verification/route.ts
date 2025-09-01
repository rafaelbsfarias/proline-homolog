import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { writeFileSync } from 'fs';
import { join } from 'path';

const logger = getLogger('test:price-verification');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { clientId, addressId } = body;

    const logData = {
      timestamp: new Date().toISOString(),
      clientId,
      addressId,
      testMode: true,
    };

    logger.info('TEST_PRICE_VERIFICATION_START', logData);

    // Escrever log em arquivo para verificação
    const logFile = join(process.cwd(), 'test-price-verification.log');
    writeFileSync(logFile, JSON.stringify(logData, null, 2) + '\n', { flag: 'a' });

    // Simular a lógica de verificação de preço
    const mockVcRow = {
      id: 'test-id',
      collection_fee_per_vehicle: null, // Simulando que não há preço definido
    };

    const hasFee =
      typeof mockVcRow.collection_fee_per_vehicle === 'number' &&
      mockVcRow.collection_fee_per_vehicle > 0;

    const analysisData = {
      timestamp: new Date().toISOString(),
      clientId,
      addressId,
      vcRowFee: mockVcRow.collection_fee_per_vehicle,
      vcRowFeeType: typeof mockVcRow.collection_fee_per_vehicle,
      vcRowFeeIsNumber: typeof mockVcRow.collection_fee_per_vehicle === 'number',
      vcRowFeeGreaterThanZero: mockVcRow.collection_fee_per_vehicle
        ? mockVcRow.collection_fee_per_vehicle > 0
        : false,
      hasFee,
      decision: !mockVcRow.id || !hasFee ? 'NEEDS_PRICING' : 'HAS_VALID_FEE',
    };

    logger.info('TEST_PRICE_VERIFICATION_ANALYSIS', analysisData);

    // Escrever análise em arquivo
    writeFileSync(logFile, JSON.stringify(analysisData, null, 2) + '\n', { flag: 'a' });

    // LOG EXTRA: Usar console.log para garantir visibilidade
    console.log('🔍 TEST_PRICE_VERIFICATION_ANALYSIS:', analysisData);

    if (!mockVcRow.id || !hasFee) {
      const failureData = {
        timestamp: new Date().toISOString(),
        clientId,
        addressId,
        vcRowFee: mockVcRow.collection_fee_per_vehicle,
        hasFee,
        errorMessage: 'Precifique o endereço antes de propor uma data de coleta.',
        troubleshooting: {
          check1: 'Verificar se o endereço foi precificado no admin',
          check2: 'Verificar se o client_id está correto',
          check3: 'Verificar se a formatação do endereço está consistente',
        },
      };

      logger.error('TEST_FINAL_PRICE_VERIFICATION_FAILURE', failureData);

      // Escrever falha em arquivo
      writeFileSync(logFile, JSON.stringify(failureData, null, 2) + '\n', { flag: 'a' });

      // LOG EXTRA: Console log para garantir visibilidade
      console.error('🚨 TEST_FINAL_PRICE_VERIFICATION_FAILURE:', failureData);

      return NextResponse.json(
        { success: false, error: 'Precifique o endereço antes de propor uma data de coleta.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Test completed successfully' });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('test_error', { error: error?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};
