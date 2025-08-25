import { NextRequest, NextResponse } from 'next/server';
import { SignupService } from '@/modules/common/services/SignupService';
import { getErrorMessage } from '@/modules/common/constants/messages';
import { ConflictError, DatabaseError } from '@/modules/common/errors';

// Instancia o serviço de signup
const signupService = new SignupService();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // A validação de campos agora pode ser delegada ou simplificada,
    // mas manteremos uma verificação básica por segurança.
    const { fullName, companyName, cnpj, email, phone, password } = data;
    if (!fullName || !companyName || !cnpj || !email || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'missing_fields',
          message: getErrorMessage('missing_fields'),
        },
        { status: 400 }
      );
    }

    // Delega a lógica de negócio para o SignupService
    await signupService.registerUser(data);

    // Retorna sucesso
    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso! Sua solicitação está em análise.',
    });
  } catch (error) {
    // Trata erros específicos lançados pelo serviço
    if (error instanceof ConflictError) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'user_already_registered',
          message: error.message,
        },
        { status: 409 } // Conflict
      );
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'database_error',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Erro genérico
    return NextResponse.json(
      {
        success: false,
        errorCode: 'internal_error',
        message: getErrorMessage('internal_error'),
      },
      { status: 500 }
    );
  }
}
