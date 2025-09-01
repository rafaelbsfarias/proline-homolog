import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';

const logger = getLogger('services:api-helpers');

interface AuthenticatedRequest {
  user?: { id: string };
}

/**
 * Serviço auxiliar para operações comuns em APIs
 */
export class ApiHelperService {
  private static instance: ApiHelperService;

  static getInstance(): ApiHelperService {
    if (!ApiHelperService.instance) {
      ApiHelperService.instance = new ApiHelperService();
    }
    return ApiHelperService.instance;
  }

  /**
   * Valida autenticação e retorna userId
   */
  validateAuth(req: AuthenticatedRequest): { userId: string } | { error: NextResponse } {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('missing-user-id');
      return {
        error: NextResponse.json(
          { success: false, error: 'Usuário não autenticado' },
          { status: 401 }
        ),
      };
    }
    return { userId };
  }

  /**
   * Retorna cliente admin do Supabase
   */
  getAdminClient(): SupabaseClient {
    const { SupabaseService } = require('@/modules/common/services/SupabaseService');
    return SupabaseService.getInstance().getAdminClient();
  }

  /**
   * Headers comuns para respostas de API
   */
  getCommonHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Resposta de erro padronizada
   */
  errorResponse(message: string, status: number = 500) {
    return NextResponse.json(
      { success: false, error: message },
      { status, headers: this.getCommonHeaders() }
    );
  }

  /**
   * Resposta de sucesso padronizada
   */
  successResponse(data: unknown = null) {
    const response: { success: boolean; data?: unknown } = { success: true };
    if (data !== null) {
      response.data = data;
    }
    return NextResponse.json(response, { headers: this.getCommonHeaders() });
  }
}
