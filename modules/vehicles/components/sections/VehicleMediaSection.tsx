'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SectionCard } from '../cards/SectionCard';
import { MediaCard } from '../cards/MediaCard';
import { MediaData } from '../../types/VehicleDetailsTypes';
import { useExpandableSection } from '../../hooks/useExpandableSection';
import styles from './VehicleMediaSection.module.css';

const Lightbox = dynamic(() => import('@/modules/common/components/Lightbox/Lightbox'), {
  ssr: false,
});

interface VehicleMediaSectionProps {
  media: MediaData[];
  mediaUrls: Record<string, string>;
}

export const VehicleMediaSection: React.FC<VehicleMediaSectionProps> = ({ media, mediaUrls }) => {
  const { isExpanded, headerAction } = useExpandableSection(false, styles);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const getMediaUrl = (storagePath: string) => {
    return (
      mediaUrls[storagePath] ||
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${storagePath}`
    );
  };

  const imageUrls = media.map(item => getMediaUrl(item.storage_path));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex(prev => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setLightboxIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <>
      <SectionCard title="Evidências da Análise Preliminar" fullWidth headerAction={headerAction}>
        {isExpanded && (
          <div className={styles.grid}>
            {media.map((item, index) => (
              <MediaCard
                key={index}
                src={getMediaUrl(item.storage_path)}
                alt={`Foto ${index + 1}`}
                date={item.created_at}
                onClick={() => openLightbox(index)}
              />
            ))}
          </div>
        )}
        {!isExpanded && (
          <div className={styles.collapsedInfo}>
            <p className={styles.collapsedText}>
              {media.length} {media.length === 1 ? 'evidência' : 'evidências'} disponíve
              {media.length === 1 ? 'l' : 'is'}
            </p>
          </div>
        )}
      </SectionCard>

      {lightboxOpen && (
        <Lightbox
          urls={imageUrls}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
};
