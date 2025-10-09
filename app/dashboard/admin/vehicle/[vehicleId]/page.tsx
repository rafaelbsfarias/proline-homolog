'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import ImageViewerModal from '@/modules/client/components/ImageViewerModal';
import VehicleHeader from '@/modules/vehicles/components/VehicleHeader';
import VehicleInfoCard from '@/modules/vehicles/components/VehicleInfoCard';
import TimelineSection from '@/modules/vehicles/components/TimelineSection';
import { useVehicleHistory } from '@/modules/vehicles/hooks/useVehicleHistory';
import ServicesSection from '@/modules/vehicles/components/ServicesSection';
import PhotosSection from '@/modules/vehicles/components/PhotosSection';
import ObservationsSection from '@/modules/vehicles/components/ObservationsSection';
import { useAdminVehicleDetails } from '@/modules/vehicles/hooks/useAdminVehicleDetails';

const AdminVehicleDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.vehicleId as string;

  const { vehicle, inspection, mediaUrls, loading, error } = useAdminVehicleDetails(vehicleId);
  const { history } = useVehicleHistory('admin', vehicleId);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
          }}
        >
          <Loading />
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <h1 style={{ color: '#e74c3c', marginBottom: '16px' }}>Erro</h1>
            <p>{error || 'Veículo não encontrado'}</p>
            <button
              onClick={() => router.back()}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Voltar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
        <VehicleHeader
          onBack={() => router.back()}
          brand={vehicle.brand}
          model={vehicle.model}
          plate={vehicle.plate}
          evidenceCount={inspection?.media?.length || 0}
          onOpenImages={() => setIsImageViewerOpen(true)}
        />

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
          <VehicleInfoCard vehicle={vehicle} />
          <TimelineSection
            createdAt={vehicle.created_at}
            estimatedArrivalDate={vehicle.estimated_arrival_date}
            inspectionDate={inspection?.inspection_date || null}
            inspectionFinalized={!!inspection?.finalized}
            vehicleHistory={history}
          />

          <ServicesSection services={inspection?.services || []} />
          <PhotosSection media={inspection?.media || []} mediaUrls={mediaUrls} />
          <ObservationsSection observations={inspection?.observations} />
        </div>
      </main>

      {isImageViewerOpen && inspection?.media && (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          images={inspection.media}
          mediaUrls={mediaUrls}
          vehiclePlate={vehicle.plate}
        />
      )}
    </div>
  );
};

export default AdminVehicleDetailsPage;
