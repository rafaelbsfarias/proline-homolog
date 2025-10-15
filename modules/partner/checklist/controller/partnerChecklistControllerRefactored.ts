/**
 * Controller Refatorado para Fase 2
 * Usa os novos serviços mantendo interface externa compatível
 */

import { QuerySchema, Partner } from '../schemas';
import { getApprovedQuoteByVehicle } from '../repositories/QuotesRepository';
import {
  RefactoredMechanicsChecklistService,
  RefactoredAnomaliesService,
} from '../application/legacy-services';
import { AppError, NotFoundError, ValidationError } from '../errors';

// Instâncias singleton dos serviços refatorados
const mechanicsService = new RefactoredMechanicsChecklistService();
const anomaliesService = new RefactoredAnomaliesService();

export async function handleGetPartnerChecklistRefactored(query: URLSearchParams) {
  const parsed = QuerySchema.safeParse({ vehicleId: query.get('vehicleId') });
  if (!parsed.success)
    throw new ValidationError(parsed.error.errors[0]?.message || 'Parâmetros inválidos');
  const { vehicleId } = parsed.data;

  const quote = await getApprovedQuoteByVehicle(vehicleId);
  const partnerData = quote?.partners
    ? Array.isArray(quote.partners)
      ? (quote.partners[0] as Partner)
      : (quote.partners as Partner)
    : null;

  if (partnerData) {
    if (partnerData.partner_type === 'mechanic') {
      return await mechanicsService.getMechanicsChecklist(vehicleId, partnerData);
    }
    return await anomaliesService.getAnomaliesChecklist(vehicleId, partnerData);
  }

  // Fallback legados usando serviços refatorados
  const mech = await mechanicsService.getMechanicsChecklistDirect(vehicleId);
  if (mech) return mech;
  const anomalies = await anomaliesService.getAnomaliesChecklistDirect(vehicleId);
  if (anomalies) return anomalies;

  throw new NotFoundError('Nenhum parceiro encontrado para este veículo');
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
