import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ClientAddressService } from '@/modules/client/services/ClientAddressService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:create-address');
const addressService = new ClientAddressService();

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    logger.info('request_received', {
      userId: req.user.id.slice(0, 8),
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

    // Validação de campos obrigatórios
    if (!street || !number || !neighborhood || !city || !state || !zip_code) {
      logger.warn('missing_required_fields', {
        userId: req.user.id.slice(0, 8),
        missing: [
          !street && 'street',
          !number && 'number',
          !neighborhood && 'neighborhood',
          !city && 'city',
          !state && 'state',
          !zip_code && 'zip_code',
        ]
          .filter(Boolean)
          .join(', '),
      });
      return NextResponse.json({ error: 'Campos obrigatórios não informados.' }, { status: 400 });
    }

    const clientId = req.user.id;
    logger.info('creating_address', {
      userId: clientId.slice(0, 8),
      street,
      city,
      is_collect_point,
      is_main_address,
    });

    const address = await addressService.createAddress({
      clientId,
      street: street as string,
      number: number as string,
      neighborhood: neighborhood as string,
      city: city as string,
      state: state as string,
      zip_code: zip_code as string,
      complement: complement as string,
      is_collect_point: !!is_collect_point,
      is_main_address: !!is_main_address,
    });

    logger.info('success', {
      userId: clientId.slice(0, 8),
      addressId: address.id.slice(0, 8),
    });

    return NextResponse.json({
      success: true,
      message: 'Endereço criado com sucesso!',
      address: {
        id: address.id,
        street: address.street,
        number: address.number,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        complement: address.complement,
        is_collect_point: address.is_collect_point,
        is_main_address: address.is_main_address,
        created_at: address.created_at,
      },
    });
  } catch (error: unknown) {
    logger.error('unhandled_error', {
      userId: req.user.id.slice(0, 8),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});
