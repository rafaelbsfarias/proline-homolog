import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminService');

/**
 * Service layer para lógicas de negócio do Administrador.
 */
export class AdminService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
    logger.info('AdminService initialized.');
  }

  async assignSpecialistsToClient(clientId: string, specialistIds: string[]): Promise<void> {
    logger.info(
      `Attempting to assign specialists to client ${clientId}. Specialist IDs: ${specialistIds.join(', ')}`
    );
    const supabase = this.supabaseService.getAdminClient();

    const records = specialistIds.map(specialistId => ({
      client_id: clientId,
      specialist_id: specialistId,
    }));

    const { error } = await supabase.from('client_specialists').insert(records);

    if (error) {
      if (error.code === '23505') {
        logger.warn(
          `Attempted to assign already linked specialists to client ${clientId}. Error: ${error.message}`
        );
        throw new Error('Um ou mais especialistas já estão vinculados a este cliente.');
      }
      logger.error(`Error assigning specialists to client ${clientId}:`, error);
      throw new Error('Erro ao vincular especialistas: ' + error.message);
    }
    logger.info(`Specialists successfully assigned to client ${clientId}.`);
  }

  // Métodos futuros aqui (ex: approveRegistration)
}
