import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { EmailServiceFactory } from '@/modules/common/services/EmailServiceFactory';
import { DatabaseError, NotFoundError, ValidationError, AppError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('RegistrationRejectionService');

interface RejectionData {
  userId: string;
  reason?: string;
}

export class RegistrationRejectionService {
  private supabase: SupabaseClient;
  private emailService: ReturnType<typeof EmailServiceFactory.getInstance>;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    this.emailService = EmailServiceFactory.getInstance();
    logger.info('RegistrationRejectionService initialized.');
  }

  async rejectRegistration(data: RejectionData): Promise<void> {
    const { userId, reason } = data;
    logger.info(
      `Attempting to reject registration for user ID: ${userId}. Reason: "${reason || 'No reason provided'}"`
    );

    // 1. Fetch user data before deleting
    logger.info(`Fetching user data for user ID: ${userId}.`);
    const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      logger.error(`User not found for ID ${userId}:`, userError);
      throw new NotFoundError('Usuário não encontrado.');
    }

    const userEmail = userData.user.email;
    logger.info(`User email found: ${userEmail}`);

    // 2. Fetch profile for full name
    let userFullName = 'Usuário';
    logger.info(`Fetching profile for full name for user ID: ${userId}.`);
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (profile && profile.full_name) {
      userFullName = profile.full_name;
      logger.info(`User full name found: ${userFullName}.`);
    } else {
      logger.warn(`Full name not found for user ID: ${userId}. Defaulting to "Usuário".`);
    }

    // 3. Send rejection email if email is available
    if (userEmail) {
      logger.info(`Attempting to send rejection email to ${userEmail}.`);
      try {
        const rejectionEmailHtml = `
          <h2>Cadastro Rejeitado</h2>
          <p>Olá ${userFullName},</p>
          <p>Infelizmente, seu cadastro no ProLine foi rejeitado.</p>
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          <p>Se você acredita que isso foi um erro, entre em contato conosco.</p>
          <p>Atenciosamente,<br>Equipe ProLine</p>
        `;

        await this.emailService.sendEmail({
          to: userEmail,
          subject: 'Cadastro Rejeitado - ProLine',
          html: rejectionEmailHtml,
        });
        logger.info(`Rejection email sent successfully to ${userEmail}.`);
      } catch (emailError: unknown) {
        logger.error('Error sending rejection email:', emailError);
        // Log email sending failure but don't block deletion
      }
    } else {
      logger.warn(`User email not available for ID ${userId}. Skipping rejection email.`);
    }

    // 4. Delete the user from auth.users (this also deletes the profile via trigger/cascade)
    logger.info(`Deleting user ${userId} from auth.users.`);
    const { error: deleteError } = await this.supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      logger.error(`Error deleting user ${userId}:`, deleteError);
      throw new DatabaseError(`Erro ao deletar usuário: ${deleteError.message}`);
    }
    logger.info(`User ${userId} deleted successfully.`);
    logger.info(`Registration for user ${userId} rejected successfully.`);
  }
}
