import { NextRequest, NextResponse } from 'next/server';
import { ClientVehicleService } from '@/modules/client/services/ClientVehicleService'; // New import
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  AppError,
} from '@/modules/common/errors';
import { sanitizeNumber } from '@/modules/common/utils/inputSanitization';

async function createVehicleHandler(req: NextRequest) {
  try {
    const rawData = await req.json();
    const { plate, brand, model, color, year, initialKm, fipe_value, observations } = rawData;

    // Validação de campos obrigatórios
    if (!plate || !brand || !model || !color || !year) {
      throw new ValidationError('Campos obrigatórios não informados.');
    }

    // Obtain the authenticated user's ID from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização não fornecido.' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const {
      data: { user },
      error: userError,
    } = await SupabaseService.getInstance().getClient().auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado ou inválido.' }, { status: 401 });
    }

    const clientId = user.id;

    const clientVehicleService = new ClientVehicleService();
    const vehicle = await clientVehicleService.createVehicle({
      plate: plate as string,
      brand: brand as string,
      model: model as string,
      color: color as string,
      year: year as number,
      initialKm: initialKm ? sanitizeNumber(initialKm) : undefined,
      fipe_value: fipe_value ? sanitizeNumber(fipe_value) : undefined,
      observations: observations as string,
      clientId: clientId,
    });

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year,
        status: vehicle.status,
      },
      message: 'Veículo cadastrado com sucesso!',
    });
  } catch (error: unknown) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: error.message, code: 'DUPLICATE_PLATE' },
        { status: error.statusCode }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message, code: 'ACCESS_DENIED' },
        { status: error.statusCode }
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: 'INVALID_INPUT' },
        { status: error.statusCode }
      );
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: 'DATABASE_ERROR' },
        { status: error.statusCode }
      );
    }
    if (error instanceof AppError) {
      // Catch any other custom AppError
      return NextResponse.json(
        { error: error.message, code: 'APP_ERROR' },
        { status: error.statusCode }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const POST = createVehicleHandler;
