import { AuthService } from './AuthService';

/**
 * Compatibilidade com código existente
 * Exporta a implementação do AuthService como SupabaseAuthService
 */
export class SupabaseAuthService extends AuthService {
  // Herda todas as funcionalidades do AuthService
  // Mantém compatibilidade com código existente
}

/**
 * Instância padrão para compatibilidade
 */
export const authService = new SupabaseAuthService();
