import { NextRequest } from 'next/server';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export interface User {
  id: string;
  email: string;
  role: string;
  profile_id: string;
  full_name?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: User;
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: SupabaseUser;
  error?: string;
}

// Single Responsibility: Verificação de autenticação
async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return { isAuthenticated: false, error: 'Token de autorização requerido' };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = SupabaseService.getInstance().getClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { isAuthenticated: false, error: 'Token inválido' };
    }

    const bannedUntil = (user as any).banned_until as string | null | undefined;
    if (bannedUntil && new Date(bannedUntil) > new Date()) {
      return { isAuthenticated: false, error: 'Usuário suspenso' };
    }

    return { isAuthenticated: true, user };
  } catch (error) {
    return { isAuthenticated: false, error: 'Erro interno de autenticação' };
  }
}

// Single Responsibility: Verificação de role (COMPATIBILIDADE GARANTIDA)
export async function verifyUserRole(
  request: NextRequest,
  expectedRole: string
): Promise<AuthResult & { hasRole?: boolean }> {
  const authResult = await verifyAuth(request);

  if (!authResult.isAuthenticated) {
    return { ...authResult, hasRole: false };
  }

  // PRIMEIRA TENTATIVA: user_metadata.role (compatibilidade com código existente)
  let userRole = authResult.user?.user_metadata?.role;
  let hasRole = userRole === expectedRole;

  // SEGUNDA TENTATIVA: Se não encontrou no metadata, buscar na tabela profiles
  if (!hasRole && authResult.user) {
    try {
      const supabase = SupabaseService.getInstance().getClient();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', authResult.user.id)
        .single();

      if (!profileError && profile) {
        userRole = profile.user_role;
        hasRole = userRole === expectedRole;
      }
    } catch {
      // Silenciar erro e manter resultado da primeira tentativa
    }
  }

  return {
    ...authResult,
    hasRole,
  };
}

// withAdminAuth: REMOVIDOS LOGS DE DEBUG (Production-Ready)
export function withAdminAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authResult = await verifyUserRole(request, 'admin');

      if (!authResult.isAuthenticated || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Token inválido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!authResult.hasRole) {
        return new Response(
          JSON.stringify({
            error: 'Acesso negado',
            details: 'Permissões de administrador necessárias',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      (request as any).user = {
        id: authResult.user.id,
        email: authResult.user.email!,
        role: authResult.user.user_metadata?.role || 'admin',
        profile_id: authResult.user.id,
      };

      return handler(request as AuthenticatedRequest, ...args);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno de autenticação' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

// Manter outras funções inalteradas para não quebrar compatibilidade
export function withSpecialistAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authResult = await verifyUserRole(request, 'specialist');

      if (!authResult.isAuthenticated || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Token inválido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!authResult.hasRole) {
        return new Response(JSON.stringify({ error: 'Acesso negado - Especialista requerido' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      (request as any).user = {
        id: authResult.user.id,
        email: authResult.user.email!,
        role: authResult.user.user_metadata?.role || 'specialist',
        profile_id: authResult.user.id,
      };

      return handler(request as AuthenticatedRequest, ...args);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno de autenticação' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

export function withPartnerAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authResult = await verifyUserRole(request, 'partner');

      if (!authResult.isAuthenticated || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Token inválido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!authResult.hasRole) {
        return new Response(JSON.stringify({ error: 'Acesso negado - Parceiro requerido' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      (request as any).user = {
        id: authResult.user.id,
        email: authResult.user.email!,
        role: authResult.user.user_metadata?.role || 'partner',
        profile_id: authResult.user.id,
      };

      return handler(request as AuthenticatedRequest, ...args);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno de autenticação' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

export function withClientAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const authHeader = request.headers.get('authorization');

      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Token de acesso requerido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.split(' ')[1];
      const supabase = SupabaseService.getInstance().getAdminClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Token inválido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const bannedUntil = (user as any).banned_until as string | null | undefined;
      if (bannedUntil && new Date(bannedUntil) > new Date()) {
        return new Response(JSON.stringify({ error: 'Usuário suspenso' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: 'Perfil não encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const allowedRoles = ['client', 'specialist', 'partner', 'admin'];
      if (!allowedRoles.includes(profile.role)) {
        return new Response(JSON.stringify({ error: 'Acesso negado' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: user.id,
        email: user.email!,
        role: profile.role,
        profile_id: profile.id,
        full_name: profile.full_name,
      };

      return handler(authenticatedRequest, ...args);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno de autenticação' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

// withAnyAuth: Aceita qualquer usuário autenticado (admin, specialist ou client)
export function withAnyAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authResult = await verifyAuth(request);

      if (!authResult.isAuthenticated || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Não autenticado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Buscar role e profile_id do usuário
      let userRole = authResult.user.user_metadata?.role;
      const profileId = authResult.user.id;
      let fullName = authResult.user.user_metadata?.full_name;

      // Se não encontrou role no metadata, buscar na tabela profiles
      if (!userRole) {
        try {
          const supabase = SupabaseService.getInstance().getClient();
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_role, full_name')
            .eq('id', authResult.user.id)
            .single();

          if (profile) {
            userRole = profile.user_role;
            fullName = profile.full_name || fullName;
          }
        } catch {
          // Silenciar erro
        }
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: authResult.user.id,
        email: authResult.user.email!,
        role: userRole || 'unknown',
        profile_id: profileId,
        full_name: fullName,
      };

      return handler(authenticatedRequest, ...args);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno de autenticação' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
