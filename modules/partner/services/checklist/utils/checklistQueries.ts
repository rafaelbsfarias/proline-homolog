import { LoadChecklistOptions } from '../types';

/**
 * Aplica filtros de inspection_id ou quote_id em uma query
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function applyIdFilters(query: any, options: LoadChecklistOptions): any {
  const { inspection_id, quote_id } = options;

  if (!inspection_id && !quote_id) {
    throw new Error('inspection_id ou quote_id deve ser fornecido');
  }

  // Usar quote_id se disponível, senão inspection_id
  if (quote_id) {
    return query.eq('quote_id', quote_id);
  } else if (inspection_id) {
    return query.eq('inspection_id', inspection_id);
  }

  return query;
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
