import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next(); // const em vez de let

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
  } catch (e) {}

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/test-).*)'],
};
