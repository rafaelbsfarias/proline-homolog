import React from 'react';
import { getPhotoPreviewUrl, getPhotoType } from '../utils/photoHelpers';
import styles from './PhotoGallery.module.css';

interface PhotoGalleryProps {
  photos: (File | string)[];
  onRemove: (index: number) => void;
  onError?: (index: number) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onRemove, onError }) => {
  if (photos.length === 0) return null;

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Imagens ({photos.length}):</h4>
      <div className={styles.grid}>
        {photos.map((photo, index) => {
          const previewUrl = getPhotoPreviewUrl(photo);
          const type = getPhotoType(photo);

          return (
            <div key={index} className={styles.photoWrapper}>
              <img
                src={previewUrl}
                alt={`Evidência ${index + 1}`}
                className={styles.photo}
                onError={() => onError?.(index)}
              />
              <div className={`${styles.badge} ${styles[type]}`}>
                {type === 'new' ? 'NOVA' : 'SALVA'}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className={styles.removeButton}
                title="Remover imagem"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
