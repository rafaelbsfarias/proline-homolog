import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Preencha e-mail e senha.' }, { status: 400 });
  }

  const supabase = SupabaseService.getInstance().getAdminClient();

  // Buscar usuário no Auth
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  const user = usersData.users.find(
    (u: { email: string; confirmed_at: string }) => u.email === email
  );
  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }
  if (!user.confirmed_at) {
    return NextResponse.json(
      { error: 'Cadastro pendente de aprovação. Aguarde liberação pela equipe.' },
      { status: 403 }
    );
  }

  // Tenta autenticar
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Login realizado com sucesso!',
    user: signInData.user,
    session: signInData.session,
  });
}
