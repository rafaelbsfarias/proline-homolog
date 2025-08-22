import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// Tipos de dados para os serviços
export interface ServiceData {
  name: string;
  description: string;
  price: number;
  category?: string; // Categoria como texto livre e opcional
}

export interface ImportResult {
  addedCount: number;
  failedCount: number;
}

/**
 * Adiciona um novo serviço para um parceiro.
 * @param authenticatedFetch A função de fetch autenticada.
 * @param serviceData Os dados do serviço a ser criado.
 */
export async function addService(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>['authenticatedFetch'],
  serviceData: ServiceData
): Promise<void> {
  await authenticatedFetch('/api/partner/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
}

/**
 * Importa serviços de um arquivo CSV.
 * @param authenticatedFetch A função de fetch autenticada.
 * @param csvFile O arquivo CSV a ser importado.
 */
export async function importServicesFromCsv(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>['authenticatedFetch'],
  csvFile: File
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('csvFile', csvFile);

  const result = await authenticatedFetch<ImportResult>('/api/partner/services/import-csv', {
    method: 'POST',
    body: formData,
  });

  if (!result.data) {
    throw new Error('A resposta da importação não continha os dados esperados.');
  }

  return result.data;
}
