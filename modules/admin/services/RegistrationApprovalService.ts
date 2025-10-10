import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { EmailServiceFactory } from '@/modules/common/services/EmailServiceFactory'; // Importar EmailServiceFactory
import { DatabaseError, NotFoundError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('RegistrationApprovalService');

interface ApprovalData {
  userId: string;
  parqueamento: string;
  taxaOperacao: number;
}

export class RegistrationApprovalService {
  private supabase: SupabaseClient;
  private emailService: ReturnType<typeof EmailServiceFactory.getInstance>; // Usar EmailServiceFactory

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    this.emailService = EmailServiceFactory.getInstance(); // Obter instância do EmailService
    logger.info('RegistrationApprovalService initialized.');
  }

  async approveRegistration(data: ApprovalData): Promise<void> {
    const { userId, parqueamento, taxaOperacao } = data;
    logger.info(`Attempting to approve registration for user ID: ${userId}`);
    logger.debug('Approval data:', data);

    // 1. Update client data in 'clients' table
    logger.info(`Updating client data for user ID: ${userId}`);
    const { error: clientError } = await this.supabase
      .from('clients')
      .update({
        parqueamento: parqueamento,
        taxa_operacao: taxaOperacao,
      })
      .eq('profile_id', userId);

    if (clientError) {
      logger.error(`Error updating client data for user ${userId}:`, clientError);
      throw new DatabaseError(`Erro ao atualizar dados do cliente: ${clientError.message}`);
    }
    logger.info(`Client data updated for user ID: ${userId}`);

    // 2. Fetch user email and name
    logger.info(`Fetching user email and name for user ID: ${userId}`);
    const { data: authUser, error: authUserError } =
      await this.supabase.auth.admin.getUserById(userId);

    if (authUserError || !authUser || !authUser.user || !authUser.user.email) {
      logger.error(`User email not found in auth.users for ID ${userId}:`, authUserError);
      throw new NotFoundError('Email do usuário não encontrado em auth.users.');
    }
    logger.info(`User email found: ${authUser.user.email}`);

    let userName = '';
    const { data: profileData } = await this.supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    if (profileData && profileData.full_name) {
      userName = profileData.full_name;
      logger.info(`User full name found: ${userName}`);
    } else {
      logger.warn(`Full name not found for user ID: ${userId}.`);
    }

    // 3. Update email confirmation status in auth.users
    logger.info(`Updating email confirmation status for user ID: ${userId}`);
    const confirmationTimestamp = new Date().toISOString();
    const { error: profileUpdateError } = await this.supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: {
        ...authUser.user.user_metadata,
        email_confirmed_at: confirmationTimestamp,
        email_confirmed_by_approval: true,
        email_confirmation_method: 'admin_approval',
      },
    });

    if (profileUpdateError) {
      logger.error(
        `Error updating email confirmation status for user ${userId}:`,
        profileUpdateError
      );
      throw new DatabaseError(
        `Erro ao atualizar status de confirmação de email do usuário: ${profileUpdateError.message}`
      );
    }
    logger.info(`Email confirmation status updated for user ID: ${userId}`);

    // 4. Send approval email
    logger.info(`Sending approval email to ${authUser.user.email}.`);
    await this.emailService.sendSignupApprovalEmail(authUser.user.email, userName);
    logger.info(`Approval email sent successfully to ${authUser.user.email}.`);
    logger.info(`Registration for user ${userId} approved successfully.`);
  }
}
