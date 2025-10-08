'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { useAuth } from '@/modules/common/services/AuthProvider';
import { useVehicleDetails } from '@/modules/vehicles/hooks/useVehicleDetails';
import VehicleDetails from '@/modules/vehicles/components/VehicleDetails';

const UnifiedVehicleDetailsPage = () => {
  const params = useParams();
  const vehicleId = params.vehicleId as string;
  const { user } = useAuth();
  const role = user?.user_metadata.role as 'client' | 'specialist';

  const { vehicle, inspection, vehicleHistory, mediaUrls, loading, error } = useVehicleDetails(
    role,
    vehicleId
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <VehicleDetails
        vehicle={vehicle}
        inspection={inspection}
        vehicleHistory={vehicleHistory}
        mediaUrls={mediaUrls}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default UnifiedVehicleDetailsPage;
