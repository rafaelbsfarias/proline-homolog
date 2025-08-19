// modules/client/components/VehicleRegistrationModal.tsx
'use client';
import VehicleRegistrationModalBase, { VehicleRegistrationBaseProps } from '@/modules/vehicles/components/VehicleRegistrationModalBase';

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
