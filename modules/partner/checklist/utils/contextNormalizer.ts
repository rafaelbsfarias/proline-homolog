/**
 * Anti-Corruption Layer para normalização de contexto
 * Centraliza a lógica de decisão entre quote_id e inspection_id
 * Política: "quote-first" quando existir quote_id; senão inspection_id
 */

export type ContextId = {
  type: 'quote' | 'inspection';
  id: string;
};

export type ContextParams = {
  quoteId?: string | null;
  inspectionId?: string | null;
};

/**
 * Normaliza parâmetros de contexto para ContextId
 * @param params - Parâmetros com quoteId e/ou inspectionId
 * @returns ContextId normalizado ou null se nenhum contexto válido
 */
export function normalizeContext(params: ContextParams): ContextId | null {
  const { quoteId, inspectionId } = params;

  // Política: quote-first
  if (quoteId && typeof quoteId === 'string' && quoteId.trim()) {
    return { type: 'quote', id: quoteId.trim() };
  }

  if (inspectionId && typeof inspectionId === 'string' && inspectionId.trim()) {
    return { type: 'inspection', id: inspectionId.trim() };
  }

  return null;
}

/**
 * Valida se o contexto é consistente
 * @param context - ContextId a validar
 * @returns true se válido
 */
export function isValidContext(context: ContextId | null): context is ContextId {
  return context !== null && typeof context.id === 'string' && context.id.length > 0;
}

/**
 * Converte ContextId para parâmetros de query
 * @param context - ContextId
 * @returns Objeto com quote_id ou inspection_id
 */
export function contextToQueryParams(
  context: ContextId
): { quote_id: string } | { inspection_id: string } {
  if (context.type === 'quote') {
    return { quote_id: context.id };
  }
  return { inspection_id: context.id };
}

/**
 * Extrai ContextId de uma entidade que pode ter quote_id ou inspection_id
 * @param entity - Entidade com campos opcionais quote_id/inspection_id
 * @returns ContextId ou null
 */
export function extractContextFromEntity(entity: {
  quote_id?: string | null;
  inspection_id?: string | null;
}): ContextId | null {
  return normalizeContext({
    quoteId: entity.quote_id,
    inspectionId: entity.inspection_id,
  });
}
