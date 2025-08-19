'use client';
import VehicleRegistrationModalBase, { VehicleRegistrationBaseProps, Vehicle } from '@/modules/vehicles/components/VehicleRegistrationModalBase';

type Props = Omit<VehicleRegistrationBaseProps, 'userRole'>;

export default function ClientVehicleRegistrationModal(props: Props) {
  return <VehicleRegistrationModalBase {...props} userRole="client" />;
}

export type { Vehicle };