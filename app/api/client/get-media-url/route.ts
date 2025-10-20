import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { ValidationError, NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';

const logger = getLogger('api:client:get-media-url');
const supabase = SupabaseService.getInstance().getAdminClient();

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
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

    const clientId = req.user.id;

    // Verificar se o cliente tem acesso ao veículo
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('client_id', clientId)
      .maybeSingle();

    if (vehicleError) {
      logger.error('vehicle_lookup_error', {
        userId: clientId.slice(0, 8),
        vehicleId: vehicleId.slice(0, 8),
        error: vehicleError.message,
      });
      return NextResponse.json(
        { error: 'Erro ao verificar acesso ao veículo', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (!vehicle) {
      logger.warn('access_denied', {
        userId: clientId.slice(0, 8),
        vehicleId: vehicleId.slice(0, 8),
      });
      return NextResponse.json(
        { error: 'Acesso negado ao veículo', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Se o usuário tem acesso ao veículo, ele pode ver a mídia.
    // A verificação extra no banco de dados foi removida.

    // Gerar URL assinada com expiração de 1 hora
    logger.info('generating_signed_url', {
      userId: clientId.slice(0, 8),
      storagePath: storagePath,
      bucket: 'vehicle-media',
    });

    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from('vehicle-media')
      .createSignedUrl(storagePath, 3600); // 1 hora

    if (signedUrlError || !signedUrl) {
      logger.error('signed_url_error', {
        userId: clientId.slice(0, 8),
        storagePath: storagePath,
        errorName: signedUrlError?.name,
        errorMessage: signedUrlError?.message,
        errorStack: signedUrlError?.stack,
        hasData: !!signedUrl,
      });
      return NextResponse.json(
        {
          error: 'Erro ao gerar URL da mídia',
          code: 'STORAGE_ERROR',
          details: signedUrlError?.message || 'Signed URL data is null',
        },
        { status: 500 }
      );
    }

    logger.info('success', {
      userId: clientId.slice(0, 8),
      storagePath: storagePath.slice(0, 30),
      urlGenerated: true,
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
