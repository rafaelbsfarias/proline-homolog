import React from 'react';
import { SignedUrlResult } from '../../../services/ImageService';
import ImageUpload from '@/modules/common/components/ImageUpload/ImageUpload';
import { MAX_FILES, MAX_SIZE_MB } from '../../../checklist/useImageUploader';
import styles from '../VehicleChecklistModal.module.css';

export interface VehicleChecklistImageSectionProps {
  previews: string[];
  existingImages: SignedUrlResult[];
  isFinalized: boolean;
  onFilesSelect: (files: FileList | null) => void;
  onRemoveExistingImage: (index: number) => void;
  onRemovePreview: (index: number) => void;
}

/**
 * Componente para a seção de imagens do checklist de veículo
 * Responsável apenas pela apresentação e interação com imagens
 * Segue o princípio da responsabilidade única
 */
const VehicleChecklistImageSection: React.FC<VehicleChecklistImageSectionProps> = ({
  previews,
  existingImages,
  isFinalized,
  onFilesSelect,
  onRemoveExistingImage,
  onRemovePreview,
}) => {
  return (
    <>
      {/* Upload de fotos (galeria/câmera) */}
      <ImageUpload
        label="Fotos do veículo"
        onFilesSelect={onFilesSelect}
        isFinalized={isFinalized}
        maxFiles={MAX_FILES}
        maxSizeMB={MAX_SIZE_MB}
      />

      {/* Galeria de imagens */}
      {(existingImages.length > 0 || previews.length > 0) && (
        <div className={styles.previews}>
          {/* Imagens existentes */}
          {existingImages.map((image, i) => (
            <div key={image.path} className={styles.previewItem}>
              <img
                src={image.url}
                alt={`Imagem existente ${i + 1}`}
                className={styles.previewImage}
              />
              {!isFinalized && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => onRemoveExistingImage(i)}
                  aria-label={`Remover imagem existente ${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Pré-visualizações de novas imagens */}
          {previews.map((src, i) => (
            <div key={src} className={styles.previewItem}>
              <img src={src} alt={`Pré-visualização ${i + 1}`} className={styles.previewImage} />
              {!isFinalized && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => onRemovePreview(i)}
                  aria-label={`Remover pré-visualização ${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default VehicleChecklistImageSection;
