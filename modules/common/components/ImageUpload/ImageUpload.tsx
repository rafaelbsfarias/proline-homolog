import React, { useRef } from 'react';
import { LuUpload } from 'react-icons/lu';
import styles from './ImageUpload.module.css';
import Label from '../Label/Label';

interface ImageUploadProps {
  label: string;
  onFilesSelect: (files: FileList | null) => void;
  isFinalized?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  onFilesSelect,
  isFinalized = false,
  maxFiles = 10,
  maxSizeMB = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (files) {
      onFilesSelect(files);
    }
  };

  return (
    <div className={styles.upload}>
      <Label htmlFor="photos">{label}</Label>

      {/* Botão customizado */}
      <div
        className={`${styles.dropzone} ${isFinalized ? styles.disabled : ''}`}
        onClick={() => !isFinalized && fileInputRef.current?.click()}
      >
        <LuUpload className={styles.icon} />
        <span className={styles.text}>
          Clique para selecionar imagens <br /> ou arraste para cá
        </span>
      </div>

      {/* Input invisível */}
      <input
        ref={fileInputRef}
        id="photos"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={e => handleFiles(e.target.files)}
        disabled={isFinalized}
        className={styles.hiddenInput}
      />

      <small className={styles.hint}>
        Até {maxFiles} imagens, {maxSizeMB}MB cada. Formatos: JPG, PNG, WEBP, HEIC.
      </small>
    </div>
  );
};

export default ImageUpload;
