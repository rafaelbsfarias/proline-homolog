import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthPage =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/cadastro');

    const isProtectedRoute =
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/admin');

    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (error) {
    // Em caso de erro, é mais seguro redirecionar para o login
    console.error('Error in middleware:', error);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'session_error');
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/test-).*)'],
};
