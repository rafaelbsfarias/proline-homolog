import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeObject,
} from '@/modules/common/utils/inputSanitization';
import { AdminVehicleRegistrationService } from '@/modules/admin/services/AdminVehicleRegistrationService'; // New import
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  AppError,
} from '@/modules/common/errors';
import { PLATE_ERROR_MESSAGES } from '@/modules/common/utils/plateValidation'; // Keep for specific error messages

async function cadastrarVeiculoHandler(req: NextRequest) {
  try {
    const rawData = await req.json();
    const sanitizedData = sanitizeObject(rawData);

    const { clientId, plate, model, color, year, fipe_value, brand } = sanitizedData;

    // Validação de campos obrigatórios
    if (!clientId || !plate || !model || !color || !year || !fipe_value) {
      throw new ValidationError('Preencha todos os campos obrigatórios.');
    }

    // Sanitize and validate types
    const sanitizedClientId = sanitizeString(clientId as string);
    const sanitizedModel = sanitizeString(model as string);
    const sanitizedColor = sanitizeString(color as string);
    const parsedYear = sanitizeNumber(year as number);
    const parsedfipe_value = sanitizeNumber(fipe_value as number);
    const sanitizedBrand = sanitizeString((brand as string) || 'N/A'); // Ensure brand is always a string

    const adminVehicleRegistrationService = new AdminVehicleRegistrationService();
    await adminVehicleRegistrationService.registerVehicle({
      clientId: sanitizedClientId,
      plate: plate as string, // Service will handle plate validation
      model: sanitizedModel,
      color: sanitizedColor,
      year: parsedYear,
      fipe_value: parsedfipe_value,
      brand: sanitizedBrand,
    });

    return NextResponse.json({ success: true, message: 'Veículo cadastrado com sucesso.' });
  } catch (error: unknown) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: error.message, code: 'DUPLICATE_PLATE' },
        { status: error.statusCode }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message, code: 'CLIENT_NOT_FOUND' },
        { status: error.statusCode }
      );
    }
    if (error instanceof ValidationError) {
      // Use specific PLATE_ERROR_MESSAGES if the validation error is about the plate
      const errorCode = error.message.includes('placa') ? 'INVALID_PLATE' : 'INVALID_INPUT';
      return NextResponse.json(
        { error: error.message, code: errorCode },
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
      { error: 'Erro interno do servidor.', code: 'INTERNAL_ERROR', details: errorMessage },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(cadastrarVeiculoHandler);
