import { useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';
import { getFileExtension, generateFileName, validateImageFile } from '../utils/imageHelpers';

const logger = getLogger('partner:image-upload');

export const useImageUpload = (quoteId: string | null) => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (
    serviceId: string,
    file: File
  ): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> => {
    try {
      setUploading(true);
      logger.info('upload_image_start', { serviceId, size: file.size });

      // Validar arquivo
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Autenticar
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('upload_image_no_user');
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Upload
      const fileExt = getFileExtension(file.name);
      const fileName = generateFileName(user.id, quoteId!, serviceId, fileExt);

      const { error: uploadError } = await supabase.storage
        .from('execution-evidences')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('execution-evidences').getPublicUrl(fileName);

      logger.info('upload_image_success', { serviceId, url: publicUrl });
      return { success: true, url: publicUrl };
    } catch (e) {
      logger.error('upload_image_error', { error: e instanceof Error ? e.message : String(e) });
      return { success: false, error: 'Erro ao fazer upload da imagem' };
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadImage };
};
