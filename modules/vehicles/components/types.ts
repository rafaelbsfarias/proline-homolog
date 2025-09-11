export interface VehicleRegistrationBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole: 'admin' | 'client';
  hiddenFields?: FieldKey[];
}

export type FieldKey =
  | 'clientId'
  | 'plate'
  | 'brand'
  | 'model'
  | 'color'
  | 'year'
  | 'initialKm'
  | 'fipe_value'
  | 'observations'
  | 'estimated_arrival_date'
  | 'preparacao'
  | 'comercializacao';
