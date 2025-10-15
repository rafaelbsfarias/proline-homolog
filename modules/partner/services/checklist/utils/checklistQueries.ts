import { LoadChecklistOptions } from '../types';

/**
 * Aplica filtros de inspection_id ou quote_id em uma query
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function applyIdFilters(query: any, options: LoadChecklistOptions): any {
  const { inspection_id, quote_id, partner_id } = options;

  if (!inspection_id && !quote_id) {
    throw new Error('inspection_id ou quote_id deve ser fornecido');
  }

  let q = query;

  // Usar quote_id se disponível, senão inspection_id
  if (quote_id) {
    q = q.eq('quote_id', quote_id);
  } else if (inspection_id) {
    q = q.eq('inspection_id', inspection_id);
  }

  // Filtrar por partner_id se fornecido
  if (partner_id) {
    q = q.eq('partner_id', partner_id);
  }

  return q;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Valida que pelo menos um ID foi fornecido
 */
export function validateIds(options: LoadChecklistOptions): void {
  const { inspection_id, quote_id } = options;

  if (!inspection_id && !quote_id) {
    throw new Error('inspection_id ou quote_id deve ser fornecido');
  }
}
