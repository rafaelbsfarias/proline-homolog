import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getErrorMessage } from '@/modules/common/constants/messages'; // mantém só no messages.ts
import { EmailServiceFactory } from '@/modules/common/services/EmailServiceFactory';
import { EmailServiceInterface } from '@/modules/common/services/EmailServiceInterface';

const supabase = SupabaseService.getInstance().getAdminClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { fullName, companyName, cnpj, email, phone, password } = data;

    if (!fullName || !companyName || !cnpj || !email || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'missing_fields',
          message: 'Preencha todos os campos obrigatórios.',
        },
        { status: 400 }
      );
    }

    // Normaliza doc (só dígitos)
    const normalizedDoc = String(cnpj).replace(/\D/g, '');

    // Auth
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName, phone },
    });

    if (userError) {
      if ((userError as any).code === 'email_exists') {
        return NextResponse.json(
          {
            success: false,
            errorCode: 'user_already_registered',
            message: getErrorMessage('user_already_registered'),
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, errorCode: 'user_creation_failed', message: 'Erro ao criar usuário.' },
        { status: 500 }
      );
    }

    // Profile
    if (user?.user?.id) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.user.id,
          full_name: fullName,
          role: 'client',
        },
      ]);

      if (profileError) {
        return NextResponse.json(
          {
            success: false,
            errorCode: 'profile_creation_failed',
            message: 'Erro ao criar perfil.',
          },
          { status: 500 }
        );
      }

      // Client (UNIQUE em document_number)
      const { error: clientError } = await supabase.from('clients').insert([
        {
          profile_id: user.user.id,
          document_type: 'cnpj',
          document_number: normalizedDoc,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (clientError) {
        const msg = (clientError as any).message ?? '';
        const code = (clientError as any).code;

        const isUnique = code === '23505' || /clients_document_number_key/i.test(msg);

        if (isUnique) {
          return NextResponse.json(
            {
              success: false,
              errorCode: 'document_already_exists',
              message: getErrorMessage('document_already_exists'),
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            errorCode: 'client_creation_failed',
            message: 'Erro ao criar cliente.',
          },
          { status: 500 }
        );
      }
    }

    // Envio de email de confirmação de solicitação de cadastro
    try {
      const emailService: EmailServiceInterface = EmailServiceFactory.getInstance();
      await emailService.sendRegistrationSuccessEmail(email, fullName);
    } catch (emailError) {
      // Logar o erro do email, mas não impedir o sucesso do cadastro
      console.error('Erro ao enviar email de confirmação de cadastro:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso! Sua solicitação está em análise.',
    });
  } catch {
    return NextResponse.json(
      { success: false, errorCode: 'internal_error', message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
