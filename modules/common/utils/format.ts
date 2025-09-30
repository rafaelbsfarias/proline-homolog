/**
 * Utilitários de formatação comuns para exibição de dados
 */

/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * @param value - Valor numérico a ser formatado
 * @returns Valor formatado em Real ou '-' se inválido
 */
export function formatCurrencyBR(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Calcula e formata o total de um item (unitValue * qty)
 * @param unitValue - Valor unitário
 * @param qty - Quantidade
 * @returns Total formatado em Real ou '-' se inválido
 */
export function formatTotalCurrencyBR(unitValue: number | null | undefined, qty: number): string {
  if (typeof unitValue !== 'number' || Number.isNaN(unitValue)) return '-';
  const total = unitValue * (qty || 0);
  return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um valor numérico para moeda brasileira (alias para compatibilidade)
 * @param value - Valor numérico a ser formatado
 * @returns Valor formatado em Real ou 'N/A' se inválido
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata uma data para o padrão brasileiro
 * @param dateString - String da data a ser formatada
 * @returns Data formatada ou 'N/A' se inválida
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'N/A';
  }
};

/**
 * Mapeia e formata o status de uma cotação/orçamento
 * @param status - Status da cotação
 * @returns Status formatado em português
 */
export const formatQuoteStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending_admin_approval: 'Aguardando Admin',
    admin_review: 'Aguardando Admin',
    pending_client_approval: 'Aguardando Cliente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  };
  return statusMap[status] || 'Desconhecido';
};

/**
 * Formata informações do veículo (placa + marca/modelo se disponível)
 * @param vehicle - Objeto com dados do veículo
 * @returns String formatada com placa e marca/modelo
 */
export const formatVehicleInfo = (vehicle: {
  vehicle_plate?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
}): string => {
  if (vehicle.vehicle_plate) {
    const brandModel =
      vehicle.vehicle_brand && vehicle.vehicle_model
        ? ` (${vehicle.vehicle_brand} ${vehicle.vehicle_model})`
        : '';
    return `${vehicle.vehicle_plate}${brandModel}`;
  }
  return 'N/A';
};
