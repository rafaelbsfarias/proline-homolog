'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  isOpen: boolean;
  images: string[];
  startIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  images,
  startIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex, isOpen]);

  if (!isOpen || images.length === 0) return null;

  const next = () => setIndex(prev => (prev + 1) % images.length);
  const prev = () => setIndex(prev => (prev - 1 + images.length) % images.length);

  const content = (
    <div
      className={styles.overlay}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className={styles.content}
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
      >
        {images.length > 1 && (
          <button
            className={`${styles.navButton} ${styles.prev}`}
            onClick={prev}
            aria-label="Anterior"
            style={{ position: 'absolute', left: -56, top: '50%', transform: 'translateY(-50%)' }}
          >
            ‹
          </button>
        )}
        <img
          src={images[index]}
          className={styles.image}
          alt={`Imagem ${index + 1}`}
          style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
        />
        {images.length > 1 && (
          <button
            className={`${styles.navButton} ${styles.next}`}
            onClick={next}
            aria-label="Próxima"
            style={{ position: 'absolute', right: -56, top: '50%', transform: 'translateY(-50%)' }}
          >
            ›
          </button>
        )}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position: 'absolute',
            top: -40,
            right: 0,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 28,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ImageLightbox;
