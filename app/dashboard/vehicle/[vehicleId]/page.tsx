'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { useAuth } from '@/modules/common/services/AuthProvider';
import { Loading } from '@/modules/common/components/Loading/Loading';
import VehicleDetails from '@/modules/vehicles/components/VehicleDetails';
import { useVehicleDetails } from '@/modules/vehicles/hooks/useVehicleDetails';
import BudgetPhaseSection from '@/modules/vehicles/components/BudgetPhaseSection';

const UnifiedVehicleDetailsPage = () => {
  const params = useParams();
  const vehicleId = params.vehicleId as string;

  const { user } = useAuth();
  const rawRole = (user?.user_metadata?.role as string | undefined) || 'specialist';
  const role: 'client' | 'specialist' | 'admin' | 'partner' =
    rawRole === 'client'
      ? 'client'
      : rawRole === 'admin'
        ? 'admin'
        : rawRole === 'partner'
          ? 'partner'
          : 'specialist';

  const { vehicle, inspection, vehicleHistory, mediaUrls, loading, error } = useVehicleDetails(
    role,
    vehicleId
  );
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loading />
          </div>
        ) : (
          <>
            <VehicleDetails
              vehicle={vehicle}
              inspection={inspection}
              vehicleHistory={vehicleHistory}
              mediaUrls={mediaUrls}
              loading={loading}
              error={error}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default UnifiedVehicleDetailsPage;
