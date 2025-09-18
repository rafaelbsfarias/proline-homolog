'use client';

import React from 'react';
import { formatDateBR } from '@/modules/client/utils/date';

export interface MediaItem {
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

const PhotosSection: React.FC<{
  media: MediaItem[];
  mediaUrls: Record<string, string>;
}> = ({ media, mediaUrls }) => {
  if (!media?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '24px',
        gridColumn: '1 / -1',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
        Fotos do Veículo
      </h2>
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        }}
      >
        {media.map((m, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
            <img
              src={
                mediaUrls[m.storage_path] ||
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${m.storage_path}`
              }
              alt={`Foto ${idx + 1}`}
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #ddd',
              }}
              onError={e => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('public')) {
                  target.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${m.storage_path}`;
                }
              }}
            />
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
              {formatDateBR(m.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotosSection;
