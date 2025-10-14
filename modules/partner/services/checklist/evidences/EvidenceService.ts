import { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { EvidenceRepository } from './EvidenceRepository';
import { SignedUrlGenerator } from './SignedUrlGenerator';
import { EvidenceMap, LoadChecklistOptions } from '../types';

const logger = getLogger('services:evidence');

export class EvidenceService {
  private readonly repository: EvidenceRepository;
  private readonly urlGenerator: SignedUrlGenerator;

  constructor(supabase: SupabaseClient) {
    this.repository = new EvidenceRepository(supabase);
    this.urlGenerator = new SignedUrlGenerator(supabase);
  }

  /**
   * Carrega evidências com URLs assinadas
   */
  async loadWithSignedUrls(options: LoadChecklistOptions): Promise<EvidenceMap> {
    try {
      const evidences = await this.repository.findByChecklist(options);

      if (evidences.length === 0) {
        return {};
      }

      const evidenceMap: EvidenceMap = {};

      for (const evidence of evidences) {
        const url = await this.urlGenerator.generate(evidence.media_url);
        if (url) {
          evidenceMap[evidence.item_key] = { url };
        }
      }

      logger.info('evidences_loaded_with_urls', {
        count: Object.keys(evidenceMap).length,
      });

      return evidenceMap;
    } catch (error) {
      logger.error('load_with_signed_urls_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }
}
