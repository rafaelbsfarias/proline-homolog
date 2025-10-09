import { SupabaseService } from './SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('services:media-upload');

/**
 * Configuração de upload
 */
export interface UploadConfig {
  bucket: string;
  folder: string;
  allowedExtensions?: string[];
  maxSizeBytes?: number;
  cacheControl?: string;
  upsert?: boolean;
}

/**
 * Resultado de um upload bem-sucedido
 */
export interface UploadResult {
  path: string;
  signedUrl?: string;
  publicUrl?: string;
}

/**
 * Erro de upload com detalhes
 */
export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

/**
 * MediaUploadService - Serviço centralizado para upload de mídia
 *
 * Responsável por:
 * - Upload de arquivos para Supabase Storage
 * - Validação de tipos e tamanhos
 * - Geração de nomes seguros
 * - Criação de URLs assinadas
 * - Logging estruturado
 */
export class MediaUploadService {
  private static instance: MediaUploadService;
  private readonly supabase = SupabaseService.getInstance().getAdminClient();

  private constructor() {}

  public static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  /**
   * Valida a extensão do arquivo
   */
  private validateExtension(filename: string, allowedExtensions?: string[]): string {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/gi, '');

    if (!safeExt) {
      throw new UploadError('Extensão de arquivo inválida', 'INVALID_EXTENSION');
    }

    if (allowedExtensions && !allowedExtensions.includes(safeExt)) {
      throw new UploadError(
        `Extensão não permitida. Permitidas: ${allowedExtensions.join(', ')}`,
        'EXTENSION_NOT_ALLOWED',
        { extension: safeExt, allowed: allowedExtensions }
      );
    }

    return safeExt;
  }

  /**
   * Valida o tamanho do arquivo
   */
  private validateSize(file: File, maxSizeBytes?: number): void {
    if (maxSizeBytes && file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new UploadError(
        `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB, tamanho do arquivo: ${fileSizeMB}MB`,
        'FILE_TOO_LARGE',
        { maxSizeBytes, fileSize: file.size }
      );
    }
  }

  /**
   * Gera um nome de arquivo seguro e único
   */
  private generateSafeFilename(originalName: string, extension: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const cleanName = originalName
      .replace(/\.[^/.]+$/, '') // Remove extensão
      .replace(/[^a-z0-9]/gi, '-') // Substitui caracteres especiais
      .substring(0, 30); // Limita tamanho

    const parts = [prefix, cleanName, timestamp, random].filter(Boolean);
    return `${parts.join('-')}.${extension}`;
  }

  /**
   * Faz upload de um único arquivo
   *
   * @param file - Arquivo a ser enviado
   * @param config - Configuração do upload
   * @param context - Contexto adicional para logging (ex: vehicle_id, user_id)
   * @returns Resultado do upload com path e URLs
   */
  public async uploadSingleFile(
    file: File,
    config: UploadConfig,
    context?: Record<string, string>
  ): Promise<UploadResult> {
    const startTime = Date.now();

    try {
      // Validações
      this.validateSize(file, config.maxSizeBytes);
      const extension = this.validateExtension(file.name, config.allowedExtensions);

      // Gerar nome seguro
      const filename = this.generateSafeFilename(file.name, extension);
      const filePath = `${config.folder}/${filename}`;

      logger.info('upload_start', {
        filename,
        size: file.size,
        type: file.type,
        bucket: config.bucket,
        ...context,
      });

      // Fazer upload
      const arrayBuffer = await file.arrayBuffer();
      const { data, error: uploadError } = await this.supabase.storage
        .from(config.bucket)
        .upload(filePath, arrayBuffer, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: config.cacheControl || '3600',
          upsert: config.upsert ?? false,
        });

      if (uploadError) {
        logger.error('upload_failed', {
          error: uploadError.message,
          filename,
          bucket: config.bucket,
          ...context,
        });
        throw new UploadError('Falha no upload do arquivo', 'UPLOAD_FAILED', uploadError);
      }

      const uploadedPath = data.path;

      // Gerar URL assinada (opcional)
      let signedUrl: string | undefined;
      const { data: signedData } = await this.supabase.storage
        .from(config.bucket)
        .createSignedUrl(uploadedPath, 60 * 60); // 1 hora

      if (signedData) {
        signedUrl = signedData.signedUrl;
      }

      const duration = Date.now() - startTime;
      logger.info('upload_success', {
        path: uploadedPath,
        duration,
        ...context,
      });

      return {
        path: uploadedPath,
        signedUrl,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof UploadError) {
        logger.warn('upload_validation_error', {
          code: error.code,
          message: error.message,
          duration,
          ...context,
        });
        throw error;
      }

      logger.error('upload_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        ...context,
      });
      throw new UploadError('Erro inesperado durante upload', 'UNEXPECTED_ERROR', error);
    }
  }

  /**
   * Faz upload de múltiplos arquivos
   *
   * @param files - Array de arquivos a serem enviados
   * @param config - Configuração do upload
   * @param context - Contexto adicional para logging
   * @returns Array de resultados (sucesso ou erro para cada arquivo)
   */
  public async uploadMultipleFiles(
    files: File[],
    config: UploadConfig,
    context?: Record<string, string>
  ): Promise<Array<{ success: boolean; result?: UploadResult; error?: string; index: number }>> {
    logger.info('upload_multiple_start', {
      fileCount: files.length,
      bucket: config.bucket,
      ...context,
    });

    const results = await Promise.allSettled(
      files.map((file, index) =>
        this.uploadSingleFile(file, config, { ...context, fileIndex: String(index) })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, result: result.value, index };
      } else {
        const error =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        return { success: false, error, index };
      }
    });
  }

  /**
   * Deleta um arquivo do storage
   *
   * @param bucket - Nome do bucket
   * @param path - Caminho do arquivo
   */
  public async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);

    if (error) {
      logger.error('delete_failed', { bucket, path, error: error.message });
      throw new UploadError('Falha ao deletar arquivo', 'DELETE_FAILED', error);
    }

    logger.info('delete_success', { bucket, path });
  }

  /**
   * Gera URL assinada para um arquivo existente
   *
   * @param bucket - Nome do bucket
   * @param path - Caminho do arquivo
   * @param expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
   */
  public async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      logger.error('signed_url_failed', { bucket, path, error: error.message });
      return null;
    }

    return data?.signedUrl || null;
  }

  /**
   * Gera URLs assinadas para múltiplos arquivos
   *
   * @param bucket - Nome do bucket
   * @param paths - Array de caminhos
   * @param expiresIn - Tempo de expiração em segundos
   */
  public async getSignedUrls(
    bucket: string,
    paths: string[],
    expiresIn: number = 3600
  ): Promise<Map<string, string | null>> {
    const urlMap = new Map<string, string | null>();

    await Promise.all(
      paths.map(async path => {
        const url = await this.getSignedUrl(bucket, path, expiresIn);
        urlMap.set(path, url);
      })
    );

    return urlMap;
  }
}
