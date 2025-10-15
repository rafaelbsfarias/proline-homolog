'use client';

import React from 'react';
import styles from './ImageCaptureInput.module.css';

type Props = {
  id?: string;
  label?: string;
  currentUrl?: string | null;
  disabled?: boolean;
  onChange: (file: File) => void;
  onRemove?: () => void;
  className?: string;
};

/**
 * ImageCaptureInput
 * - Accepts only images
 * - On mobile, hints the browser to open the camera (capture="environment")
 * - Shows a thumbnail preview with overlay remove button (PhotoGallery pattern)
 */
export function ImageCaptureInput({
  id,
  label = 'Evidência (Foto)',
  currentUrl,
  disabled,
  onChange,
  onRemove,
  className = '',
}: Props) {
  const inputId = id || React.useId();

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-xs font-medium text-gray-700 mb-2">
        {label}
      </label>

      {currentUrl ? (
        <div className={styles.thumbnailWrapper}>
          <img src={currentUrl} alt={label} className={styles.thumbnail} />
          {onRemove && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              className={styles.removeButton}
              aria-label="Remover evidência"
            >
              ×
            </button>
          )}
        </div>
      ) : null}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        // Mobile camera capture hint
        // Some browsers (iOS Safari/Chrome Android) respect capture attribute
        // Use environment to prefer the rear camera when available
        {...({ capture: 'environment' } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </div>
  );
}

export default ImageCaptureInput;
