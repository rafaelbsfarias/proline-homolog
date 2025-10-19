import React from 'react';
import { formatDateBR } from '../../utils/formatters';
import styles from './MediaCard.module.css';

interface MediaCardProps {
  src: string;
  alt: string;
  date: string;
  description?: string;
  onError?: () => void;
  onClick?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  src,
  alt,
  date,
  description,
  onError,
  onClick,
}) => {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <img src={src} alt={alt} className={styles.image} onError={onError} />
      <div className={styles.footer}>
        <div className={styles.date}>{formatDateBR(date)}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
    </div>
  );
};
