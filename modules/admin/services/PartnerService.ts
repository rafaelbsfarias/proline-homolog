import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ConflictError, DatabaseError, AppError } from '@/modules/common/errors';
import { EmailServiceFactory } from '@/modules/common/services/EmailServiceFactory';
import { EmailServiceInterface } from '@/modules/common/services/EmailServiceInterface';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('PartnerService');

interface PartnerData {
  name: string;
  email: string;
  cnpj: string;
  companyName: string;
  phone: string | null;
}

interface AuthUserRpc {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  raw_user_meta_data: any;
  created_at: string;
  updated_at: string;
}

export class PartnerService {
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;
  private emailService: EmailServiceInterface;

  constructor() {
    this.supabase = SupabaseService.getInstance().getClient();
    this.adminSupabase = SupabaseService.getInstance().getAdminClient();
    this.emailService = EmailServiceFactory.getInstance();
    logger.info('PartnerService initialized.');
  }

  async createPartner(partnerData: PartnerData): Promise<any> {
    logger.info(`Attempting to create new partner with email: ${partnerData.email}`);
    logger.debug('Partner data:', partnerData);

    try {
      logger.info('Checking for existing user with this email via RPC.');
      const { data: usersData, error: rpcError } = await this.supabase.rpc('get_all_auth_users');
      const users: AuthUserRpc[] = usersData || [];

      if (rpcError) {
        logger.error('Error checking existing users in Auth via RPC:', rpcError);
        throw new DatabaseError(
          `Erro ao verificar usuários existentes no Auth: ${rpcError.message}`
        );
      }

      const userExists = users.some(u => u.email === partnerData.email);
      if (userExists) {
        logger.warn(`Partner creation failed: Email ${partnerData.email} already in use.`);
        throw new ConflictError('E-mail já cadastrado no sistema de autenticação.');
      }
      logger.info('Email is not in use, proceeding with partner creation.');

      const tempPassword = `TempPass${Math.random().toString(36).substring(2, 15)}!`;
      logger.debug('Generated temporary password.');

      logger.info('Creating user in Supabase Auth.');
      const { data: createdUser, error: createUserError } =
        await this.adminSupabase.auth.admin.createUser({
          email: partnerData.email,
          password: tempPassword,
          email_confirm: false,
          user_metadata: {
            full_name: partnerData.name,
            role: 'partner',
          },
        });

      if (createUserError || !createdUser.user) {
        logger.error('Error creating user in Supabase Auth:', createUserError);
        throw new DatabaseError(
          `Erro ao criar usuário: ${createUserError?.message || 'User object or ID is missing'}`
        );
      }
      const invitedUser = createdUser.user;
      logger.info(`User created in Supabase Auth with ID: ${invitedUser.id}`);

      try {
        logger.info(`Creating profile for user ID: ${invitedUser.id}`);
        const { error: profileError } = await this.supabase.from('profiles').insert({
          id: invitedUser.id,
          full_name: partnerData.name,
          role: 'partner',
        });
        if (profileError) {
          // Enhanced logging for RLS or other profile creation errors
          if (
            profileError.message.includes('violates row-level security policy') ||
            profileError.code === '42501'
          ) {
            logger.error(
              `RLS Policy Violation: Failed to create profile for user ID ${invitedUser.id} with role 'partner'. ` +
                `Check RLS policies on 'profiles' table. Supabase error:`,
              profileError
            );
          } else {
            logger.error(`Error creating profile for user ${invitedUser.id}:`, profileError);
          }
          throw new DatabaseError(`Erro ao criar perfil: ${profileError.message}`);
        }
        logger.info(`Profile created for user ID: ${invitedUser.id}`);

        logger.info(`Creating partner record for user ID: ${invitedUser.id}`);
        const { data: partner, error: partnerError } = await this.supabase
          .from('partners')
          .insert({
            profile_id: invitedUser.id,
            company_name: partnerData.companyName,
            cnpj: partnerData.cnpj,
          })
          .select()
          .single();
        if (partnerError) {
          logger.error(`Error creating partner record for user ${invitedUser.id}:`, partnerError);
          throw new DatabaseError(`Erro ao criar parceiro: ${partnerError.message}`);
        }
        logger.info(`Partner record created for user ID: ${invitedUser.id}`);

        logger.info(`Sending welcome email to ${partnerData.email}.`);
        await this.emailService.sendWelcomeEmailWithTemporaryPassword(
          partnerData.email,
          partnerData.name,
          tempPassword,
          'Parceiro'
        );
        logger.info(`Welcome email sent to ${partnerData.email}.`);

        logger.info(`Partner ${invitedUser.id} created successfully.`);
        return partner;
      } catch (innerError: unknown) {
        logger.error(
          `Partner creation failed for user ID ${invitedUser.id}. Attempting rollback.`,
          innerError
        );
        await this.adminSupabase.auth.admin.deleteUser(invitedUser.id);
        logger.warn(`Auth user ${invitedUser.id} deleted as part of rollback.`);
        throw innerError;
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        logger.error('Caught AppError during partner creation:', error);
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Unexpected error during partner creation:', errorMessage, error);
      throw new AppError('Erro interno ao criar parceiro.', 500);
    }
  }
}
