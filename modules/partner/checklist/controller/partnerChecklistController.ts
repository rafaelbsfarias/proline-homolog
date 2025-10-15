import { QuerySchema, Partner } from '../schemas';
import { getApprovedQuoteByVehicle } from '../repositories/QuotesRepository';
import {
  getMechanicsChecklist,
  getMechanicsChecklistDirect,
} from '../services/mechanicsChecklistService';
import { getAnomaliesChecklist, getAnomaliesChecklistDirect } from '../services/anomaliesService';
import { AppError, NotFoundError, ValidationError } from '../errors';

export async function handleGetPartnerChecklist(query: URLSearchParams) {
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
      return await getMechanicsChecklist(vehicleId, partnerData);
    }
    return await getAnomaliesChecklist(vehicleId, partnerData);
  }

  // Fallback legados
  const mech = await getMechanicsChecklistDirect(vehicleId);
  if (mech) return mech;
  const anomalies = await getAnomaliesChecklistDirect(vehicleId);
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
