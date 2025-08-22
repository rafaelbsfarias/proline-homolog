import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/cadastro', '/recuperar-senha', '/signup'];
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...(options as CookieOptions) });
          });
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[middleware] pathname:', pathname, '| user:', user ? user.email : null);

    // Se não autenticado e não está em rota pública, redireciona para login
    if (!user && !isPublic) {
      console.log('[middleware] Usuário não autenticado, redirecionando para /login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Se autenticado e está em rota pública, redireciona para dashboard
    if (user && isPublic) {
      console.log('[middleware] Usuário autenticado acessando rota pública, redirecionando para /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    console.error('[middleware] Erro ao verificar autenticação:', error);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/test-).*)'],
};
