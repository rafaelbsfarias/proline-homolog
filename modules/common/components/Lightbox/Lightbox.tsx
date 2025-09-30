'use client';

import React, { useEffect } from 'react';

interface LightboxProps {
  urls: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const contentStyle: React.CSSProperties = {
  position: 'relative',
  maxWidth: '90vw',
  maxHeight: '90vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageStyle: React.CSSProperties = {
  maxWidth: '90vw',
  maxHeight: '90vh',
  borderRadius: 8,
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: -16,
  right: -16,
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: '9999px',
  width: 36,
  height: 36,
  cursor: 'pointer',
  fontWeight: 700,
};

const navBtnBase: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(17,24,39,0.8)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  width: 44,
  height: 44,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 18,
};

const prevBtnStyle: React.CSSProperties = { ...navBtnBase, left: -56 };
const nextBtnStyle: React.CSSProperties = { ...navBtnBase, right: -56 };

const Lightbox: React.FC<LightboxProps> = ({ urls, index, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <button aria-label="Fechar" style={closeBtnStyle} onClick={onClose}>
          ×
        </button>
        {urls.length > 1 && (
          <button aria-label="Anterior" style={prevBtnStyle} onClick={onPrev}>
            ‹
          </button>
        )}
        <img src={urls[index]} alt="Evidência" style={imageStyle} />
        {urls.length > 1 && (
          <button aria-label="Próximo" style={nextBtnStyle} onClick={onNext}>
            ›
          </button>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
