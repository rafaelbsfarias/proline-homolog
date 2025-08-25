'use client';

import React from 'react';
import VehicleRegistrationModalBase, {
  Vehicle,
  VehicleRegistrationBaseProps,
} from '@/modules/vehicles/components/VehicleRegistrationModalBase';

type Props = Omit<VehicleRegistrationBaseProps, 'userRole'>;

export default function AdminVehicleRegistrationModal(props: Props) {
  return <VehicleRegistrationModalBase {...props} userRole="admin" />;
}
