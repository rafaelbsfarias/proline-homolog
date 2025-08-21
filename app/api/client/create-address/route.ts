import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ClientAddressService } from '@/modules/client/services/ClientAddressService';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { getLogger } from '@/modules/logger';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { handleRouteError } from '@/modules/common/utils/apiError';

const logger = getLogger('api.client.create-address');

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = '/api/client/create-address';
  const method = 'POST';
  try {
    const body = await req.json();
    logger.info('request_received', {
      requestId,
      path,
      method,
      hasBody: !!body,
    });

    const {
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code,
      complement,
      is_collect_point,
      is_main_address,
    } = body ?? {};

    const service = new ClientAddressService();
    const inserted = await service.createAddress({
      clientId: req.user.id,
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code,
      complement,
      is_collect_point,
      is_main_address,
    });

    logger.info('success', { requestId, path, method, userId: req.user.id, addressId: inserted?.id });
    return NextResponse.json({ success: true, message: 'Endereço criado com sucesso!', address: inserted });
  } catch (error) {
    return handleRouteError(error, logger, { requestId, path, method });
  }
});
