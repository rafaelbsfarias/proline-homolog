import { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { AnomalyRepository } from './AnomalyRepository';
import { AnomalyFormatter } from './AnomalyFormatter';
import { SignedUrlGenerator } from '../evidences/SignedUrlGenerator';
import { FormattedAnomaly, LoadChecklistOptions } from '../types';

const logger = getLogger('services:anomaly');

export class AnomalyService {
  private readonly repository: AnomalyRepository;
  private readonly urlGenerator: SignedUrlGenerator;

  constructor(supabase: SupabaseClient) {
    this.repository = new AnomalyRepository(supabase);
    this.urlGenerator = new SignedUrlGenerator(supabase);
  }

  /**
   * Carrega anomalias com URLs assinadas
   */
  async loadWithSignedUrls(
    vehicle_id: string,
    options: LoadChecklistOptions,
    partner_id?: string
  ): Promise<FormattedAnomaly[]> {
    try {
      logger.info('loading_anomalies', { vehicle_id, ...options });

      const anomalies = await this.repository.findWithPartRequests(vehicle_id, options, partner_id);

      logger.info('anomalies_loaded', {
        count: anomalies.length,
        sample_photos: anomalies[0]?.photos,
      });

      // Gerar URLs assinadas e formatar
      const formatted = await Promise.all(
        anomalies.map(async anomaly => {
          const signedPhotos = await this.urlGenerator.generateBatch(anomaly.photos);
          return AnomalyFormatter.format(anomaly, signedPhotos);
        })
      );

      logger.info('anomalies_formatted', {
        count: formatted.length,
      });

      return formatted;
    } catch (error) {
      logger.error('load_with_signed_urls_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verifica se existem anomalias submetidas para o checklist
   */
  async hasSubmittedAnomalies(
    vehicle_id: string,
    options: LoadChecklistOptions,
    partner_id?: string
  ): Promise<boolean> {
    return this.repository.existsAnomalies(vehicle_id, options, partner_id);
  }
}
