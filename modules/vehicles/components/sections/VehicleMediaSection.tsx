import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { MediaCard } from '../cards/MediaCard';
import { MediaData } from '../../types/VehicleDetailsTypes';
import { useExpandableSection } from '../../hooks/useExpandableSection';
import styles from './VehicleMediaSection.module.css';

interface VehicleMediaSectionProps {
  media: MediaData[];
  mediaUrls: Record<string, string>;
}

export const VehicleMediaSection: React.FC<VehicleMediaSectionProps> = ({ media, mediaUrls }) => {
  const { isExpanded, headerAction } = useExpandableSection(false, styles);

  if (!media || media.length === 0) return null;

  const getMediaUrl = (storagePath: string) => {
    return (
      mediaUrls[storagePath] ||
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${storagePath}`
    );
  };

  return (
    <SectionCard title="Evidências da Análise Preliminar" fullWidth headerAction={headerAction}>
      {isExpanded && (
        <div className={styles.grid}>
          {media.map((item, index) => (
            <MediaCard
              key={index}
              src={getMediaUrl(item.storage_path)}
              alt={`Foto ${index + 1}`}
              date={item.created_at}
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
  );
};
