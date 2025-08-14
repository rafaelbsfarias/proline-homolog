import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminUsersWithProfilesStatusAPI');

export const GET = withAdminAuth(async (_req: NextRequest) => {
  logger.info('Handler started');
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    logger.info('Listing users via Supabase Admin API');
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      logger.error('Error listing users from Supabase Admin API:', listError);
      return NextResponse.json(
        { error: `Erro ao listar usuários: ${listError.message}` },
        { status: 500 }
      );
    }

    type AdminUser = {
      id: string;
      email?: string | null;
      created_at?: string | null;
      user_metadata?: Record<string, any> | null;
      [key: string]: any;
    };

    const usersArr: AdminUser[] = (listData?.users ?? []) as AdminUser[];
    const ids = usersArr.map((u: AdminUser) => u.id);
    logger.info(`Found ${usersArr.length} users from auth.admin.listUsers.`);

    logger.info(`Fetching profiles for ${ids.length} user IDs.`);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, status, role')
      .in('id', ids);

    if (profilesError) {
      logger.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: `Erro ao buscar perfis: ${profilesError.message}` },
        { status: 500 }
      );
    }
    logger.info(`Found ${profiles?.length || 0} profiles.`);

    type ProfileRow = {
      id: string;
      full_name?: string | null;
      status?: string | null;
      role?: string | null;
    };

    const profileById = new Map<string, ProfileRow>(
      ((profiles as ProfileRow[]) || []).map((p: ProfileRow) => [p.id, p])
    );

    const result = usersArr
      .map((u: AdminUser) => {
        const p = profileById.get(u.id);
        return {
          id: u.id,
          email: u.email ?? '',
          full_name:
            p?.full_name ??
            (u.user_metadata?.name || u.user_metadata?.full_name || 'Nome não informado'),
          user_role: p?.role ?? u.user_metadata?.role ?? 'client',
          role: p?.role ?? u.user_metadata?.role ?? 'client',
          status: p?.status ?? '',
          created_at: u.created_at ?? null,
          last_sign_in_at: (u as any).last_sign_in_at ?? null,
        };
      })
      .sort((a, b) => {
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        return bt - at;
      });

    logger.info(`Returning ${result.length} users with profile status.`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      'Internal server error in users-with-profiles-status handler:',
      errorMessage,
      error
    );
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
