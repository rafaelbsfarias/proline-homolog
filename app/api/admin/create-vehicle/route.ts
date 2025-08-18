import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { VehicleCreationService } from '@/modules/admin/services/VehicleCreationService';
import { getLogger, ILogger } from '@/modules/logger';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';

const logger: ILogger = getLogger('AdminCreateVehicleAPI');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const vehicleSchema = z.object({
  clientId: z.string().uuid({ message: 'ID de cliente inválido' }),
  plate: z.string().min(7, { message: 'Placa inválida' }),
  brand: z.string().min(2, { message: 'Marca inválida' }),
  model: z.string().min(2, { message: 'Modelo inválido' }),
  color: z.string().min(3, { message: 'Cor inválida' }),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1, { message: 'Ano inválido' }),
  fipe_value: z.number().nonnegative().optional(),
  estimated_arrival_date: z.string().optional(),
});

async function createVehicleHandler(req: AuthenticatedRequest) {
  const adminUser = req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await req.json();
    logger.debug('Received raw data for new vehicle:', rawData);

    const parsed = vehicleSchema.safeParse(rawData);

    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      const message = first?.message || 'Dados inválidos';
      return NextResponse.json({ error: message, code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const { clientId, plate, brand, model, color, year, fipe_value, estimated_arrival_date } =
      parsed.data;

    let createdBy: string | undefined = undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
      } = await SupabaseService.getInstance().getAdminClient().auth.getUser(token);
      createdBy = user?.id;
      logger.debug(`Vehicle created by user ID: ${createdBy}`);
    }

    const vehicleCreationService = new VehicleCreationService();
    const vehicle = await vehicleCreationService.createVehicle({
      clientId,
      plate,
      brand,
      model,
      color,
      year,
      fipe_value,
      estimated_arrival_date,
      createdBy,
    });

    logger.info(`Vehicle ${vehicle.plate} created successfully for client ${clientId}.`);
    return NextResponse.json({
      success: true,
      message: 'Veículo cadastrado com sucesso!',
      vehicle: vehicle,
    });
  } catch (error: unknown) {
    logger.error('Error in createVehicleHandler:', error);
    return handleApiError(error);
  }
}

export const POST = withAdminAuth(createVehicleHandler);
