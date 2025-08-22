// modules/client/components/VehicleRegistrationModal.tsx
'use client';
import VehicleRegistrationModalBase from '@/modules/vehicles/components/VehicleRegistrationModalBase';
import type { VehicleRegistrationBaseProps } from '@/modules/vehicles/components/types';

type Props = Omit<VehicleRegistrationBaseProps, 'userRole' | 'hiddenFields'>;

export default function ClientVehicleRegistrationModal(props: Props) {
  return (
    <VehicleRegistrationModalBase
      {...props}
      userRole="client"
      hiddenFields={['fipe_value', 'initialKm']} // ← ocultados só no cliente
    />
  );
}
