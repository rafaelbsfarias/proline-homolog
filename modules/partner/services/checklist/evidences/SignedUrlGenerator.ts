import { SupabaseClient } from '@supabase/supabase-js';
import { BUCKETS } from '@/modules/common/constants/database';
import { getLogger } from '@/modules/logger';
import { SignedUrlOptions } from '../types';

const logger = getLogger('services:signed-url');

export class SignedUrlGenerator {
  private readonly DEFAULT_EXPIRATION = 3600; // 1 hora

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Gera URL assinada para um path
   */
  async generate(path: string, options: SignedUrlOptions = {}): Promise<string | null> {
    try {
      const { expiresIn = this.DEFAULT_EXPIRATION, bucket = BUCKETS.VEHICLE_MEDIA } = options;

      // Normalizar path (remover barra inicial se houver)
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

      logger.debug('generating_signed_url', {
        original_path: path,
        normalized_path: normalizedPath,
        bucket,
      });

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(normalizedPath, expiresIn);

      if (error || !data) {
        logger.warn('failed_to_generate_signed_url', {
          path: normalizedPath,
          error: error?.message,
        });
        return null;
      }

      logger.debug('signed_url_generated', {
        path: normalizedPath,
        url_length: data.signedUrl.length,
      });

      return data.signedUrl;
    } catch (error) {
      logger.error('generate_signed_url_exception', {
        path,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Gera URLs assinadas para múltiplos paths
   */
  async generateBatch(paths: string[], options: SignedUrlOptions = {}): Promise<string[]> {
    const urls = await Promise.all(paths.map(path => this.generate(path, options)));

    // Retornar path original se falhar
    return urls.map((url, index) => url || paths[index]);
  }
}
