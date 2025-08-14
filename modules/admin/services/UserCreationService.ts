import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ConflictError, DatabaseError, ValidationError, AppError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('UserCreationService');

interface UserCreationData {
  email: string;
  fullName: string;
  role: 'admin' | 'specialist';
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  logger.debug('Generated temporary password.');
  return out;
}

export class UserCreationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('UserCreationService initialized.');
  }

  async createUser(data: UserCreationData): Promise<{ userId: string; temporaryPassword: string }> {
    const { email, fullName, role } = data;
    logger.info(`Attempting to create new user with email: ${email} and role: ${role}`);
    logger.debug('User creation data:', data);

    // 1. Check if user already exists (Supabase will also check, but this provides a cleaner error)
    logger.info('Checking for existing user with this email.');
    const { data: existingUsers, error: existingUserError } =
      await this.supabase.auth.admin.listUsers();
    if (existingUserError) {
      logger.error('Error checking existing users:', existingUserError);
      throw new DatabaseError('Erro ao verificar usuários existentes.');
    }
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      logger.warn(`User creation failed: Email ${email} already in use.`);
      throw new ConflictError('Este e-mail já foi cadastrado.');
    }
    logger.info('Email is not in use, proceeding with user creation.');

    // 2. Create user in Supabase Auth
    const tempPassword = generateTemporaryPassword();
    logger.info('Creating user in Supabase Auth.');
    const { data: created, error: createErr } = await this.supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // Admin created users will receive welcome email with temp password
      user_metadata: {
        full_name: fullName,
        role: role,
        created_by_admin: true,
      },
    });

    if (createErr || !created?.user?.id) {
      logger.error('Error creating user in Supabase Auth:', createErr);
      throw new DatabaseError(
        `Erro ao criar usuário na autenticação: ${createErr?.message || 'ID do usuário não retornado.'}`
      );
    }

    const userId = created.user.id;
    logger.info(`User created in Supabase Auth with ID: ${userId}`);

    try {
      // 3. Create profile
      logger.info(`Creating profile for user ID: ${userId} with role: ${role}`);
      const { error: profileErr } = await this.supabase.from('profiles').insert({
        id: userId,
        full_name: fullName,
        role: role,
        status: 'active',
      });
      if (profileErr) {
        // Enhanced logging for RLS or other profile creation errors
        if (
          profileErr.message.includes('violates row-level security policy') ||
          profileErr.code === '42501'
        ) {
          logger.error(
            `RLS Policy Violation: Failed to create profile for user ID ${userId} with role ${role}. ` +
              `Check RLS policies on \'profiles\' table. Supabase error:`,
            profileErr
          );
        } else {
          logger.error(`Error creating profile for user ${userId}:`, profileErr);
        }
        throw new DatabaseError(`Erro ao criar profile: ${profileErr.message}`);
      }
      logger.info(`Profile created for user ID: ${userId}`);

      // 4. Create role-specific record (if applicable)
      if (role === 'specialist') {
        logger.info(`Creating specialist record for user ID: ${userId}`);
        const { error: specErr } = await this.supabase
          .from('specialists')
          .insert({ profile_id: userId });
        if (specErr) {
          logger.error(`Error creating specialist record for user ${userId}:`, specErr);
          throw new DatabaseError(`Erro ao criar especialista: ${specErr.message}`);
        }
        logger.info(`Specialist record created for user ID: ${userId}`);
      }
      // Admin does not need a specific table

      logger.info(`User ${userId} created successfully with role ${role}.`);
      return { userId, temporaryPassword: tempPassword };
    } catch (error) {
      logger.error(`User creation failed for user ID ${userId}. Attempting rollback.`, error);
      // Rollback: If any step after auth user creation fails, delete the auth user.
      await this.supabase.auth.admin.deleteUser(userId);
      logger.warn(`Auth user ${userId} deleted as part of rollback.`);
      throw error; // Re-throw the original error
    }
  }
}
