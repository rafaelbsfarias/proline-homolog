'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageViewerModal.module.css';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    storage_path: string;
    uploaded_by: string;
    created_at: string;
  }>;
  mediaUrls: Record<string, string>;
  vehiclePlate: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  mediaUrls,
  vehiclePlate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const imageUrl =
    mediaUrls[currentImage.storage_path] ||
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${currentImage.storage_path}`;

  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Fotos do Veículo - {vehiclePlate}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.imageContainer}>
            <img
              src={imageUrl}
              alt={`Foto ${currentIndex + 1} de ${images.length}`}
              className={styles.mainImage}
              onError={e => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('public')) {
                  target.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${currentImage.storage_path}`;
                }
              }}
            />

            {images.length > 1 && (
              <>
                <button className={`${styles.navButton} ${styles.prevButton}`} onClick={prevImage}>
                  ‹
                </button>
                <button className={`${styles.navButton} ${styles.nextButton}`} onClick={nextImage}>
                  ›
                </button>
              </>
            )}
          </div>

          <div className={styles.imageInfo}>
            <div className={styles.imageCounter}>
              {currentIndex + 1} de {images.length}
            </div>
            <div className={styles.imageDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Data:</span>
                <span className={styles.detailValue}>{formatDate(currentImage.created_at)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Enviado por:</span>
                <span className={styles.detailValue}>
                  {currentImage.uploaded_by || 'Especialista'}
                </span>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((image, index) => (
                <button
                  key={index}
                  className={`${styles.thumbnail} ${index === currentIndex ? styles.active : ''}`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={
                      mediaUrls[image.storage_path] ||
                      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${image.storage_path}`
                    }
                    alt={`Miniatura ${index + 1}`}
                    className={styles.thumbnailImage}
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('public')) {
                        target.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${image.storage_path}`;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ImageViewerModal;
