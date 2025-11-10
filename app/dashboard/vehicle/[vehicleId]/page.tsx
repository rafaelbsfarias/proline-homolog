'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { useAuth } from '@/modules/common/services/AuthProvider';
import { Loading } from '@/modules/common/components/Loading/Loading';
import VehicleDetails from '@/modules/vehicles/components/VehicleDetails';
import { useVehicleDetails } from '@/modules/vehicles/hooks/useVehicleDetails';
import styles from './page.module.css';

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

  const { vehicle, inspection, mediaUrls, loading, error } = useVehicleDetails(role, vehicleId);
  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.loadingWrapper}>
            <Loading />
          </div>
        ) : (
          <VehicleDetails
            vehicle={vehicle}
            inspection={inspection}
            mediaUrls={mediaUrls}
            loading={loading}
            error={error}
          />
        )}
      </main>
    </div>
  );
};

export default UnifiedVehicleDetailsPage;
