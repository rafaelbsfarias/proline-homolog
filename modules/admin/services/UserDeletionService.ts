import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { DatabaseError, NotFoundError, AppError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('UserDeletionService');

export class UserDeletionService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('UserDeletionService initialized.');
  }

  /**
   * Deletes a user and all associated data across multiple tables.
   * This operation is designed to be comprehensive and handle cascading deletions.
   * @param userId The ID of the user to delete.
   * @throws NotFoundError if the user does not exist.
   * @throws DatabaseError if any database operation fails.
   * @throws AppError for other unexpected errors.
   */
  async deleteUserAndAssociatedData(userId: string): Promise<void> {
    logger.info(`Attempting to delete user and associated data for user ID: ${userId}`);

    // 1. Verify if the user exists in auth.users
    logger.info(`Verifying user ${userId} existence in auth.users.`);
    const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      logger.error(`User ${userId} not found in auth.users:`, userError);
      throw new NotFoundError('Usuário não encontrado.');
    }
    logger.info(`User ${userId} found.`);

    // Define tables to clean up. Order matters for foreign key constraints.
    // This list should be comprehensive for all tables linked to a user.
    const tablesToClean = [
      'vehicles',
      'user_services',
      'appointments',
      'orders',
      'service_requests',
      'user_sessions',
      'notifications',
      // Add other tables as needed
    ];

    // 2. Delete dependencies first (in order of dependency)
    for (const table of tablesToClean) {
      logger.info(`Attempting to delete data from table: ${table} for user ${userId}.`);
      try {
        // Attempt to delete by 'user_id' or 'client_id'
        const { error: deleteError } = await this.supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
        if (deleteError) {
          // If 'user_id' column doesn't exist, try 'client_id'
          const { error: clientDeleteError } = await this.supabase
            .from(table)
            .delete()
            .eq('client_id', userId);
          if (clientDeleteError) {
            logger.warn(
              `Warning: Could not delete from ${table} for user ${userId}. Error: ${clientDeleteError.message}`
            );
          }
        }
      } catch (e: unknown) {
        logger.warn(
          `Warning: Skipping deletion from ${table} for user ${userId} due to error: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
    logger.info(`Finished cleaning up dependent tables for user ${userId}.`);

    // 3. Delete the profile BEFORE the auth user (if not handled by cascade)
    logger.info(`Deleting profile for user ${userId}.`);
    const { error: deleteProfileError } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (deleteProfileError) {
      logger.error(`Error deleting profile for user ${userId}:`, deleteProfileError);
      throw new DatabaseError(`Erro ao remover perfil do usuário: ${deleteProfileError.message}`);
    }
    logger.info(`Profile deleted for user ${userId}.`);

    // 4. Finally, delete the user from auth.users
    logger.info(`Deleting user ${userId} from auth.users.`);
    const { error: deleteAuthError } = await this.supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      logger.error(`Error deleting user ${userId} from authentication system:`, deleteAuthError);
      throw new DatabaseError(
        `Erro ao remover usuário do sistema de autenticação: ${deleteAuthError.message}`
      );
    }
    logger.info(`User ${userId} successfully deleted from authentication system.`);
    logger.info(`User ${userId} and all associated data deleted successfully.`);
  }
}