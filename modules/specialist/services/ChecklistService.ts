import { ChecklistForm } from '../checklist/types';
import { supabase } from '@/modules/common/services/supabaseClient';

export interface ServiceCategory {
  id: string;
  key: string;
  name: string;
  type: string;
}

export interface ChecklistData {
  inspection: {
    inspection_date: string;
    odometer: number;
    fuel_level: string;
    observations: string;
    finalized: boolean;
    mediaPaths: string[];
  };
  services: Array<{
    category: string;
    required: boolean;
    notes: string;
  }>;
}

export interface SaveChecklistPayload {
  vehicleId: string;
  date: string;
  odometer: number;
  fuelLevel: string;
  observations: string;
  services: ChecklistForm['services'];
  mediaPaths: string[];
}

/**
 * Serviço para operações relacionadas ao checklist de veículos
 * Centraliza todas as chamadas de API seguindo o padrão de serviços
 * Implementa responsabilidade única para operações de checklist
 */
export class ChecklistService {
  /**
   * Busca as categorias de serviço disponíveis
   * @returns Lista de categorias de serviço
   */
  async getServiceCategories(): Promise<ServiceCategory[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/specialist/service-categories', {
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service categories');
    }

    const data = await response.json();
    return data?.categories || [];
  }

  /**
   * Carrega os dados de um checklist existente para um veículo
   * @param vehicleId ID do veículo
   * @returns Dados do checklist ou null se não existir
   */
  async loadChecklist(vehicleId: string): Promise<ChecklistData | null> {
    const url = `/api/specialist/get-checklist?vehicleId=${vehicleId}`;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data || null;
  }

  /**
   * Salva um checklist (modo rascunho)
   * @param payload Dados do checklist a salvar
   * @returns Promise<void>
   */
  async saveChecklist(payload: SaveChecklistPayload): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const response = await fetch('/api/specialist/save-checklist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || 'Erro ao salvar checklist');
    }
  }

  /**
   * Finaliza um checklist (torna read-only)
   * @param vehicleId ID do veículo
   * @returns Promise<void>
   */
  async finalizeChecklist(vehicleId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const response = await fetch('/api/specialist/finalize-checklist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ vehicleId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || 'Erro ao finalizar checklist');
    }
  }

  /**
   * Gera URLs assinadas para imagens armazenadas
   * @param paths Lista de caminhos das imagens
   * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
   * @returns Lista de objetos com path e URL assinada
   */
  async generateSignedUrls(
    paths: string[],
    expiresIn: number = 3600
  ): Promise<Array<{ path: string; url: string }>> {
    const signedUrlPromises = paths.map(async (path: string) => {
      const { data, error } = await supabase.storage
        .from('vehicle-media')
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(`Erro ao gerar URL para ${path}: ${error.message}`);
      }

      return { path, url: data.signedUrl };
    });

    return Promise.all(signedUrlPromises);
  }
}
