import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { CreateClientDTO } from '@/modules/admin/types/ClientDTO';
import { ConflictError, DatabaseError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('ClientService');

export class ClientService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('ClientService initialized.');
  }

  /**
   * Creates a new client, including the auth user, profile, and client records.
   * Throws domain-specific errors on failure.
   * @param clientData - The DTO for the new client.
   * @returns The ID of the newly created user.
   */
  async createClient(clientData: CreateClientDTO): Promise<string> {
    logger.info(`Attempting to create new client with email: ${clientData.email}`);
    logger.debug('Client data:', clientData);

    // 1. Check if user already exists
    logger.info('Checking for existing user with this email.');
    const { data: existingUsersData, error: existingUserError } =
      await this.supabase.auth.admin.listUsers();

    if (existingUserError) {
      logger.error('Error checking existing users:', existingUserError);
      throw new DatabaseError('Erro ao verificar usuários existentes.');
    }

    const emailExists = existingUsersData?.users?.some(
      u => u.email !== undefined && u.email === clientData.email
    );

    if (emailExists) {
      logger.warn(`Client creation failed: Email ${clientData.email} already in use.`);
      throw new ConflictError('Email já está em uso.');
    }
    logger.info('Email is not in use, proceeding with client creation.');

    // 2. Create user in Supabase Auth
    logger.info('Creating user in Supabase Auth.');
    const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
      email: clientData.email,
      password: `TempPass${Math.random().toString(36).substring(2, 15)}!`,
      email_confirm: true, // Assuming admin-created clients are confirmed
    });

    if (authError || !authUser.user) {
      logger.error('Error creating user in Supabase Auth:', authError);
      throw new DatabaseError('Erro ao criar usuário na autenticação.');
    }

    const userId = authUser.user.id;
    logger.info(`User created in Supabase Auth with ID: ${userId}`);

    try {
      // 3. Create profile
      logger.info(`Creating profile for user ID: ${userId}`);
      const { error: profileError } = await this.supabase.from('profiles').insert({
        id: userId,
        full_name: clientData.name,
        role: 'client',
        status: 'ativo',
      });

      if (profileError) {
        logger.error(`Error creating profile for user ${userId}:`, profileError);
        throw new DatabaseError(`Erro ao criar perfil do cliente: ${profileError.message}`);
      }
      logger.info(`Profile created for user ID: ${userId}`);

      // 4. Create client record
      logger.info(`Creating client record for user ID: ${userId}`);
      const { error: clientError } = await this.supabase.from('clients').insert({
        profile_id: userId,
        document_type: clientData.documentType,
        document_number: clientData.document,
        parqueamento: clientData.parqueamento,
        quilometragem: clientData.quilometragem,
        percentual_fipe: clientData.percentualFipe,
        taxa_operacao: clientData.taxaOperacao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (clientError) {
        logger.error(`Error creating client data for user ${userId}:`, clientError);
        throw new DatabaseError(`Erro ao criar dados do cliente: ${clientError.message}`);
      }
      logger.info(`Client record created for user ID: ${userId}`);

      logger.info(`Client ${userId} created successfully.`);
      return userId;
    } catch (error) {
      logger.error(`Client creation failed for user ID ${userId}. Attempting rollback.`, error);
      // Rollback: If any step after auth user creation fails, delete the auth user.
      await this.supabase.auth.admin.deleteUser(userId);
      logger.warn(`Auth user ${userId} deleted as part of rollback.`);
      // Re-throw the original, more specific error
      throw error;
    }
  }
}
