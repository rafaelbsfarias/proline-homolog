export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop() || '';
};

export const generateFileName = (
  userId: string,
  quoteId: string,
  serviceId: string,
  extension: string
): string => {
  return `${userId}/${quoteId}/${serviceId}/${Date.now()}.${extension}`;
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Arquivo deve ser uma imagem' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Imagem deve ter no máximo 10MB' };
  }

  return { valid: true };
};
