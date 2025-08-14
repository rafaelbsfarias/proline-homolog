import { SupabaseService } from '@/modules/common/services/SupabaseService';

/**
 * Service layer para lógicas de negócio do Especialista.
 */
export class SpecialistService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  // Métodos futuros aqui (ex: getAssignedVehicles)
}
