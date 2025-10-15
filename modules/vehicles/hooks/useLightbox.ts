import { useState } from 'react';

/**
 * Hook compartilhado para gerenciar lightbox de imagens
 * Usado por AnomaliesChecklistView e MechanicsChecklistView
 */
export function useLightbox() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return {
    lightboxOpen,
    lightboxImages,
    lightboxIndex,
    openLightbox,
    closeLightbox,
    setLightboxIndex,
  };
}
