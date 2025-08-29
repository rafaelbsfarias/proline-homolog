import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';
import { z } from 'zod';

const logger: ILogger = getLogger('AdminSetCollectionFeeAPI');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const setCollectionFeeSchema = z.object({
  collectionId: z.string().uuid({ message: 'ID da coleta inválido' }),
  collectionFeePerVehicle: z
    .number()
    .nonnegative({ message: 'Valor da coleta deve ser um número não negativo' }),
});

async function setCollectionFeeHandler(req: AuthenticatedRequest) {
  const adminUser = req.user;
  logger.info(
    `Handler started by admin: ${adminUser?.email} (${adminUser?.id}) to set collection fee.`
  );

  try {
    const rawData = await req.json();
    logger.debug('Received raw data for setting collection fee:', rawData);

    const parsed = setCollectionFeeSchema.safeParse(rawData);

    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      const message = first?.message || 'Dados inválidos';
      logger.warn(`Validation error for setting collection fee: ${message}`);
      return NextResponse.json({ error: message, code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const { collectionId, collectionFeePerVehicle } = parsed.data;

    const supabase = SupabaseService.getInstance().getAdminClient();

    logger.info(`Updating collection ${collectionId} with fee ${collectionFeePerVehicle}.`);
    const { data, error } = await supabase
      .from('vehicle_collections')
      .update({
        collection_fee_per_vehicle: collectionFeePerVehicle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectionId)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating collection fee for ${collectionId}:`, error);
      return NextResponse.json(
        { error: `Erro ao atualizar valor da coleta: ${error.message}` },
        { status: 500 }
      );
    }

    logger.info(`Collection fee for ${collectionId} updated successfully.`);
    return NextResponse.json({
      success: true,
      message: 'Valor da coleta atualizado com sucesso!',
      collection: data,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in setCollectionFeeHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(setCollectionFeeHandler);
