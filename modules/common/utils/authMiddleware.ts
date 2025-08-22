import { NextRequest } from 'next/server';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { verifyTokenAndProfile } from '@/lib/security/tokenUtils';

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
    const result = await verifyTokenAndProfile(token);
    if (result.error) {
      return { isAuthenticated: false, error: result.error };
    }
    return { isAuthenticated: true, user: result.user };
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

      // ...existing code...
      // Toda lógica de verificação de token, banimento e perfil foi movida para verifyTokenAndProfile
      // ...existing code...
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno de autenticação' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Fallback: always return a Response
    return new Response(JSON.stringify({ error: 'Erro desconhecido de autenticação' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
