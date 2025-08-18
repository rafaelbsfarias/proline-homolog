import { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';

export const MAX_FILES = 10;
export const MAX_SIZE_MB = 5;
export const BUCKET = 'vehicle-media';

export const useImageUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

  const handleFiles = (list: FileList | null, onInvalid?: (msg: string) => void) => {
    if (!list) return;
    const incoming = Array.from(list);
    const remaining = Math.max(0, MAX_FILES - files.length);
    const selected = incoming.slice(0, remaining);
    const valid: File[] = [];
    for (const f of selected) {
      if (!f.type.startsWith('image/')) {
        onInvalid?.('Apenas imagens são permitidas.');
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        onInvalid?.(`Imagem acima de ${MAX_SIZE_MB}MB ignorada.`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) return;
    const newPreviews = valid.map(f => URL.createObjectURL(f));
    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const cp = [...prev];
      const [url] = cp.splice(index, 1);
      if (url) URL.revokeObjectURL(url);
      return cp;
    });
  };

  const extFromFile = (file: File): string => {
    const fromName = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    if (fromName) return fromName.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    return map[file.type] || 'jpg';
  };

  const randomStr = () => Math.random().toString(36).slice(2, 8);

  const uploadFiles = async (userId: string, vehicleId: string): Promise<string[]> => {
    if (!files.length) return [];
    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = extFromFile(f);
      const path = `${vehicleId}/${userId}/${Date.now()}-${i}-${randomStr()}.${ext}`;
      const { error } = await supabase.storage.from('vehicle-media').upload(path, f, {
        upsert: false,
        cacheControl: '3600',
        contentType: f.type || undefined,
      });
      if (error) throw new Error(`Falha ao enviar imagem: ${error.message}`);
      uploaded.push(path);
    }
    return uploaded;
  };

  const reset = () => {
    setFiles([]);
    setPreviews(prev => {
      prev.forEach(u => URL.revokeObjectURL(u));
      return [];
    });
  };

  return { files, previews, handleFiles, removeFile, uploadFiles, reset };
};
