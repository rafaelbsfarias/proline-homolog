import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { ValidationError, NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';

const logger = getLogger('api:specialist:get-media-url');
const supabase = SupabaseService.getInstance().getAdminClient();

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get('path');
    const vehicleId = searchParams.get('vehicleId');

    logger.info('request_received', {
      userId: req.user?.id?.slice(0, 8),
      storagePath: storagePath?.slice(0, 20),
      vehicleId: vehicleId?.slice(0, 8),
    });

    if (!storagePath || !vehicleId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: path e vehicleId', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const specialistId = req.user.id;

    // Verificar se o especialista tem acesso ao veículo através de uma inspeção
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('specialist_id', specialistId)
      .maybeSingle();

    if (inspectionError) {
      logger.error('inspection_lookup_error', {
        userId: specialistId.slice(0, 8),
        vehicleId: vehicleId.slice(0, 8),
        error: inspectionError.message,
      });
      return NextResponse.json(
        { error: 'Erro ao verificar acesso ao veículo', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (!inspection) {
      logger.warn('access_denied', {
        userId: specialistId.slice(0, 8),
        vehicleId: vehicleId.slice(0, 8),
      });
      return NextResponse.json(
        { error: 'Acesso negado ao veículo', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Se o especialista tem acesso à inspeção do veículo, ele pode ver a mídia.
    // A verificação extra na tabela inspection_media foi removida.

    // Gerar URL assinada com expiração de 1 hora
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from('vehicle-media')
      .createSignedUrl(storagePath, 3600); // 1 hora

    if (signedUrlError || !signedUrl) {
      logger.error('signed_url_error', {
        userId: specialistId.slice(0, 8),
        storagePath: storagePath.slice(0, 20),
        error: signedUrlError?.message,
      });
      return NextResponse.json(
        { error: 'Erro ao gerar URL da mídia', code: 'STORAGE_ERROR' },
        { status: 500 }
      );
    }

    logger.info('success', {
      userId: specialistId.slice(0, 8),
      storagePath: storagePath.slice(0, 20),
    });

    return NextResponse.json({
      success: true,
      signedUrl: signedUrl.signedUrl,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora a partir de agora
    });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      logger.warn('validation_error', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as ValidationError).message,
      });
      return NextResponse.json(
        { error: (error as ValidationError).message, code: 'INVALID_INPUT' },
        { status: (error as ValidationError).statusCode }
      );
    }
    if (error instanceof NotFoundError) {
      logger.warn('not_found_error', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as NotFoundError).message,
      });
      return NextResponse.json(
        { error: (error as NotFoundError).message, code: 'NOT_FOUND' },
        { status: (error as NotFoundError).statusCode }
      );
    }
    if (error instanceof DatabaseError) {
      logger.error('db_error', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as DatabaseError).message,
      });
      return NextResponse.json(
        { error: (error as DatabaseError).message, code: 'DATABASE_ERROR' },
        { status: (error as DatabaseError).statusCode }
      );
    }
    if (error instanceof AppError) {
      logger.error('app_error', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as AppError).message,
      });
      return NextResponse.json(
        { error: (error as AppError).message, code: 'APP_ERROR' },
        { status: (error as AppError).statusCode }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('unhandled_error', {
      userId: req.user?.id?.slice(0, 8),
      error: errorMessage,
    });
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
});
