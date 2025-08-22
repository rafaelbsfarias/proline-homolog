'use client';

import React from 'react';
import VehicleRegistrationModalBase from '@/modules/vehicles/components/VehicleRegistrationModalBase';
import type { Vehicle, VehicleRegistrationBaseProps } from '@/modules/vehicles/components/types';

type Props = Omit<VehicleRegistrationBaseProps, 'userRole'>;

export default function AdminVehicleRegistrationModal(props: Props) {
  return <VehicleRegistrationModalBase {...props} userRole="admin" />;
}
export type { Vehicle };
