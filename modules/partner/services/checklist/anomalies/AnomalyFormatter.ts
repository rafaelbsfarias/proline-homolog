import { AnomalyRecord, FormattedAnomaly } from '../types';

export class AnomalyFormatter {
  /**
   * Formata anomalia para UI
   */
  public static format(anomaly: AnomalyRecord, signedPhotos: string[]): FormattedAnomaly {
    return {
      id: anomaly.id,
      description: anomaly.description,
      photos: signedPhotos,
      partRequest: this.formatPartRequest(anomaly),
    };
  }

  /**
   * Formata part request se existir
   */
  private static formatPartRequest(anomaly: AnomalyRecord) {
    if (!anomaly.part_requests || anomaly.part_requests.length === 0) {
      return undefined;
    }

    const partRequest = anomaly.part_requests[0];

    return {
      partName: partRequest.part_name,
      partDescription: partRequest.part_description || undefined,
      quantity: partRequest.quantity,
      estimatedPrice: partRequest.estimated_price
        ? parseFloat(partRequest.estimated_price)
        : undefined,
    };
  }
}
