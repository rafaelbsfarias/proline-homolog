import { supabase } from '@/modules/common/services/supabaseClient';

export const MAX_FILES = 10;
export const MAX_SIZE_MB = 5;
export const BUCKET = 'vehicle-media';

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  validFiles: File[];
}

export interface SignedUrlResult {
  path: string;
  url: string;
}

/**
 * Serviço para operações relacionadas ao gerenciamento de imagens
 * Centraliza upload, validação e geração de URLs assinadas
 * Implementa responsabilidade única para operações de imagem
 */
export class ImageService {
  /**
   * Valida uma lista de arquivos de imagem
   * @param files Lista de arquivos a validar
   * @param existingCount Número de imagens já existentes (para limite total)
   * @returns Resultado da validação com arquivos válidos e erros
   */
  validateImages(files: FileList | File[], existingCount: number = 0): ImageValidationResult {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Verificar limite total de arquivos
    const remaining = Math.max(0, MAX_FILES - existingCount);
    const selected = fileArray.slice(0, remaining);

    if (fileArray.length > remaining) {
      errors.push(
        `Máximo de ${MAX_FILES} imagens permitido. ${fileArray.length - remaining} imagens ignoradas.`
      );
    }

    // Validar cada arquivo
    for (const file of selected) {
      const fileErrors: string[] = [];

      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        fileErrors.push(`"${file.name}": Apenas imagens são permitidas.`);
        continue;
      }

      // Verificar tamanho
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        fileErrors.push(`"${file.name}": Imagem acima de ${MAX_SIZE_MB}MB.`);
        continue;
      }

      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        errors.push(...fileErrors);
      }
    }

    return {
      isValid: errors.length === 0 && validFiles.length > 0,
      errors,
      validFiles,
    };
  }

  /**
   * Extrai extensão do arquivo baseada no nome ou tipo MIME
   * @param file Arquivo para extrair extensão
   * @returns Extensão do arquivo
   */
  private getFileExtension(file: File): string {
    // Tentar extrair do nome do arquivo
    const fromName = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    if (fromName) {
      return fromName.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    }

    // Mapear tipos MIME para extensões
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };

    return mimeMap[file.type] || 'jpg';
  }

  /**
   * Gera string aleatória para nome único do arquivo
   * @returns String aleatória de 6 caracteres
   */
  private generateRandomString(): string {
    return Math.random().toString(36).slice(2, 8);
  }

  /**
   * Faz upload de múltiplas imagens para o storage
   * @param files Lista de arquivos a fazer upload
   * @param userId ID do usuário (para organização)
   * @param vehicleId ID do veículo (para organização)
   * @returns Lista de caminhos dos arquivos enviados
   */
  async uploadImages(files: File[], userId: string, vehicleId: string): Promise<string[]> {
    if (!files.length) return [];

    const uploadedPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = this.getFileExtension(file);
      const timestamp = Date.now();
      const randomStr = this.generateRandomString();
      const path = `${vehicleId}/${userId}/${timestamp}-${i}-${randomStr}.${extension}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: file.type || undefined,
      });

      if (error) {
        throw new Error(`Falha ao enviar imagem "${file.name}": ${error.message}`);
      }

      uploadedPaths.push(path);
    }

    return uploadedPaths;
  }

  /**
   * Gera URLs assinadas para múltiplas imagens
   * @param paths Lista de caminhos das imagens
   * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
   * @returns Lista de objetos com path e URL assinada
   */
  async generateSignedUrls(paths: string[], expiresIn: number = 3600): Promise<SignedUrlResult[]> {
    if (!paths.length) return [];

    const signedUrlPromises = paths.map(async (path: string) => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(`Erro ao gerar URL para "${path}": ${error.message}`);
      }

      return { path, url: data.signedUrl };
    });

    return Promise.all(signedUrlPromises);
  }

  /**
   * Remove múltiplas imagens do storage
   * @param paths Lista de caminhos das imagens a remover
   * @returns Promise<void>
   */
  async deleteImages(paths: string[]): Promise<void> {
    if (!paths.length) return;

    const { error } = await supabase.storage.from(BUCKET).remove(paths);

    if (error) {
      throw new Error(`Erro ao remover imagens: ${error.message}`);
    }
  }

  /**
   * Cria URLs de pré-visualização para arquivos locais
   * @param files Lista de arquivos
   * @returns Lista de URLs de object URL
   */
  createPreviewUrls(files: File[]): string[] {
    return files.map(file => URL.createObjectURL(file));
  }

  /**
   * Libera URLs de pré-visualização da memória
   * @param urls Lista de URLs a liberar
   */
  revokePreviewUrls(urls: string[]): void {
    urls.forEach(url => URL.revokeObjectURL(url));
  }
}
