import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ConflictError, DatabaseError, ValidationError, AppError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('UserInvitationService');

interface UserInvitationData {
  email: string;
  name: string;
  role: string;
}

export class UserInvitationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('UserInvitationService initialized.');
  }

  async inviteUser(data: UserInvitationData): Promise<string> {
    const { email, name, role } = data;
    logger.info(`Attempting to invite user with email: ${email}, name: ${name}, role: ${role}`);
    logger.debug('Invitation data:', data);

    // Check if user already exists (Supabase will also check, but this provides a cleaner error)
    logger.info('Checking for existing user with this email.');
    const { data: existingUsers, error: existingUserError } = 
      await this.supabase.auth.admin.listUsers();
    if (existingUserError) {
      logger.error('Error checking existing users:', existingUserError);
      throw new DatabaseError('Erro ao verificar usuários existentes.');
    }
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      logger.warn(`User invitation failed: Email ${email} already in use.`);
      throw new ConflictError('Este e-mail já está em uso.');
    }
    logger.info('Email is not in use, proceeding with user invitation.');

    const redirectToUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.prolineauto.com.br'}/login?welcome=true&action=set-password`;
    logger.debug(`Redirect URL for invitation: ${redirectToUrl}`);

    logger.info(`Inviting user ${email} by email.`);
    const { data: user, error: inviteError } = await this.supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name: name,
          role: role,
          created_by_admin: true,
          created_at: new Date().toISOString(),
        },
        redirectTo: redirectToUrl,
      }
    );

    if (inviteError || !user?.user?.id) {
      logger.error(`Error inviting user ${email}:`, inviteError);
      throw new DatabaseError(
        `Erro ao convidar usuário: ${inviteError?.message || 'User object or ID is missing'}`
      );
    }
    logger.info(`User ${email} invited successfully. User ID: ${user.user.id}`);

    // Create profile in 'profiles' table
    logger.info(`Creating profile for invited user ID: ${user.user.id}`);
    const { error: profileError } = await this.supabase.from('profiles').insert([
      {
        id: user.user.id,
        full_name: name,
        role: role,
      },
    ]);

    if (profileError) {
      logger.error(`Error creating profile for invited user ${user.user.id}:`, profileError);
      // Rollback: If profile creation fails, delete the invited user from auth
      await this.supabase.auth.admin.deleteUser(user.user.id);
      logger.warn(`Auth user ${user.user.id} deleted as part of rollback.`);
      throw new DatabaseError(`Erro ao criar perfil do usuário: ${profileError?.message}`);
    }
    logger.info(`Profile created for invited user ID: ${user.user.id}`);

    logger.info(`User ${user.user.id} invited and profile created successfully.`);
    return user.user.id;
  }
}