import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ClientAddressService } from '@/modules/client/services/ClientAddressService';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { getLogger } from '@/modules/logger';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { handleRouteError } from '@/modules/common/utils/apiError';

const logger = getLogger('api.client.update-address');

export const PUT = withClientAuth(async (req: AuthenticatedRequest) => {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = '/api/client/update-address';
  const method = 'PUT';
  try {
    const body = await req.json();
    logger.info('request_received', { requestId, path, method, hasBody: !!body });

    const { id, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: 'ID do endereço é obrigatório', code: 'INVALID_INPUT' }, { status: 400 });
    }

    const service = new ClientAddressService();
    const updated = await service.updateAddress({
      addressId: id,
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

    logger.info('success', { requestId, path, method, userId: req.user.id, addressId: updated?.id });
    return NextResponse.json({ success: true, message: 'Endereço atualizado com sucesso!', address: updated });
  } catch (error) {
    return handleRouteError(error, logger, { requestId, path, method });
  }
});
