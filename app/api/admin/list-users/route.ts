import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminListUsersAPI');

interface AuthenticatedRequest extends NextRequest {
  user: unknown;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
  status: string;
}

type AdminUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: Record<string, any> | null;
  [key: string]: any;
};

async function listUsersHandler(request: AuthenticatedRequest) {
  logger.info('Handler started');
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    const q = (searchParams.get('q') || '').trim();
    logger.info(`Query params: role=${roleParam}, q=${q}`);

    const supabase = SupabaseService.getInstance().getAdminClient();

    let authById = new Map<string, { email?: string | null; created_at?: string | null }>();
    logger.info('Fetching auth users with RPC "get_all_auth_users"');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_auth_users');
    if (!rpcError && Array.isArray(rpcData)) {
      authById = new Map(
        (rpcData as any[]).map(r => [
          r.id as string,
          { email: (r.email as string) ?? '', created_at: (r.created_at as string) ?? null },
        ])
      );
      logger.info(`Successfully fetched ${authById.size} users via RPC.`);
    } else {
      logger.warn('RPC "get_all_auth_users" failed, falling back to admin.listUsers()', rpcError);
      const { data: authList, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authError) {
        logger.error('Error fetching users from auth.admin.listUsers()', authError);
        return NextResponse.json(
          { error: `Erro ao buscar usuários (auth): ${authError.message}` },
          { status: 500 }
        );
      }
      const authUsers: AdminUser[] = (authList?.users ?? []) as AdminUser[];
      authById = new Map(
        authUsers.map(u => [u.id, { email: u.email ?? '', created_at: u.created_at ?? null }])
      );
      logger.info(`Successfully fetched ${authById.size} users via admin.listUsers().`);
    }

    logger.info('Fetching profiles');
    let query = supabase.from('profiles').select('id, full_name, role, status');

    if (roleParam) {
      query = query.eq('role', roleParam);
    }

    if (q) {
      const term = `%${q}%`;
      query = query.ilike('full_name', term);
    }

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) {
      logger.error('Error fetching profiles', error);
      return NextResponse.json(
        { error: `Erro ao buscar usuários: ${error.message}` },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as ProfileRow[];
    logger.info(`Found ${rows.length} profiles.`);

    let users = rows.map(r => {
      const au = authById.get(r.id);
      return {
        id: r.id,
        full_name: r.full_name,
        email: (au?.email as string | undefined) ?? '',
        user_role: r.role,
        status: r.status,
        created_at: (au?.created_at as string | undefined) ?? null,
      };
    });

    if (q) {
      const qLower = q.toLowerCase();
      const initialCount = users.length;
      users = users.filter(
        u =>
          (u.full_name || '').toLowerCase().includes(qLower) ||
          (u.email || '').toLowerCase().includes(qLower)
      );
      logger.info(`Filtered users by query "${q}", from ${initialCount} to ${users.length}.`);
    }

    logger.info(`Returning ${users.length} users.`);
    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    logger.error('Internal server error in listUsersHandler', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAdminAuth(listUsersHandler);
