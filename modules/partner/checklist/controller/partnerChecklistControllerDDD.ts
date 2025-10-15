/**
 * Controller DDD para Checklist - Migração Gradual
 * Usa a nova arquitetura DDD mantendo compatibilidade externa
 */

import { QuerySchema, Partner } from '../schemas';
import { getApprovedQuoteByVehicle } from '../repositories/QuotesRepository';
import { checklistApplicationService } from '../application/real-services';
import { realInfrastructure } from '../infrastructure/real-config';
import { AppError, NotFoundError, ValidationError } from '../errors';
import type { ContextId } from '../utils/contextNormalizer';

/**
 * Handler que usa a nova arquitetura DDD
 * Mantém interface externa compatível para migração gradual
 */
export async function handleGetPartnerChecklistDDD(query: URLSearchParams) {
  const parsed = QuerySchema.safeParse({ vehicleId: query.get('vehicleId') });
  if (!parsed.success)
    throw new ValidationError(parsed.error.errors[0]?.message || 'Parâmetros inválidos');
  const { vehicleId } = parsed.data;

  // Determinar contexto (quote vs inspection) usando o normalizer
  const quote = await getApprovedQuoteByVehicle(vehicleId);
  const contextId: ContextId = quote?.id
    ? { type: 'quote', id: quote.id }
    : { type: 'inspection', id: '' }; // Fallback para inspection vazia

  const partnerData = quote?.partners
    ? Array.isArray(quote.partners)
      ? (quote.partners[0] as Partner)
      : (quote.partners as Partner)
    : null;

  if (!partnerData) {
    throw new NotFoundError('Nenhum parceiro encontrado para este veículo');
  }

  // Usar a nova arquitetura DDD
  try {
    // Verificar se já existe um checklist para este contexto
    const existingChecklist = await realInfrastructure.repositories.checklist.findByContext(
      contextId,
      vehicleId
    );

    if (existingChecklist) {
      // Retornar checklist existente no formato legado para compatibilidade
      return await formatChecklistForLegacyResponse(existingChecklist, vehicleId);
    }

    // Se não existe, criar um novo checklist usando a arquitetura DDD
    const createResult = await checklistApplicationService.createChecklist({
      vehicleId,
      contextId,
      partnerId: partnerData.id,
    });

    if (!createResult.success) {
      throw new AppError(createResult.error || 'Erro ao criar checklist', 500);
    }

    // Retornar no formato legado
    return await formatChecklistForLegacyResponse(createResult.checklist!, vehicleId);
  } catch (error) {
    // Fallback para lógica legada se houver erro na nova arquitetura
    throw error;
  }
}

/**
 * Formata a resposta do checklist DDD para o formato legado esperado
 * Mantém compatibilidade externa durante a migração
 */
async function formatChecklistForLegacyResponse(
  checklist: {
    id: string;
    vehicleId: string;
    contextId: ContextId;
    partnerId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  },
  vehicleId: string
): Promise<Record<string, unknown>> {
  // Buscar itens do checklist
  const items = await realInfrastructure.repositories.checklistItem.findByChecklistId(checklist.id);

  // Buscar evidências do checklist
  const evidences = await realInfrastructure.repositories.evidence.findByChecklistId(checklist.id);

  // Formatar no padrão legado esperado pelas APIs existentes
  return {
    vehicle_id: vehicleId,
    checklist_id: checklist.id,
    status: checklist.status,
    partner_type: 'mechanic', // A Fazer: Determinar baseado no partner
    items: items.map(item => ({
      key: item.itemKey,
      status: item.status,
      notes: item.notes || undefined,
    })),
    evidences: evidences.map(evidence => ({
      key: evidence.evidenceKey,
      path: evidence.storagePath,
      media_type: evidence.mediaType,
      description: evidence.description,
    })),
    created_at: checklist.createdAt.toISOString(),
    updated_at: checklist.updatedAt.toISOString(),
  };
}

export function toHttpResponse(result: Record<string, unknown>) {
  return {
    status: 200,
    body: result,
  } as const;
}

export function toHttpError(err: unknown) {
  if (err instanceof AppError) {
    return { status: err.statusCode, body: { error: err.message } } as const;
  }
  return { status: 500, body: { error: 'Erro interno' } } as const;
}
