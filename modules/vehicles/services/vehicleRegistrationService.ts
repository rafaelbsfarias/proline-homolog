import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// It's a good practice to have shared types in a central file.
// For this refactoring, we'll redefine it here.
type UserRole = 'admin' | 'client';
type VehicleFormData = {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  initialKm: string;
  fipe_value: string;
  observations: string;
  estimated_arrival_date: string;
  preparacao: boolean;
  comercializacao: boolean;
};

/**
 * Handles the API call to register a new vehicle.
 * @param post The authenticated fetch post function.
 * @param userRole The role of the user performing the action.
 * @param formData The vehicle form data.
 * @returns The response from the API.
 * @throws An error if the API call fails.
 */
export const registerVehicle = async (
  post: ReturnType<typeof useAuthenticatedFetch>['post'],
  userRole: UserRole,
  formData: VehicleFormData
) => {
  const endpoint =
    userRole === 'admin' ? '/api/admin/create-vehicle' : '/api/client/create-vehicle';

  const payload = {
    plate: formData.plate,
    brand: formData.brand,
    model: formData.model,
    color: formData.color,
    year: Number(formData.year),
    fipe_value: formData.fipe_value ? Number(formData.fipe_value) : undefined,
    preparacao: formData.preparacao,
    comercializacao: formData.comercializacao,
    ...(userRole === 'admin'
      ? {
          clientId: formData.clientId,
          estimated_arrival_date: formData.estimated_arrival_date || undefined,
        }
      : {
          initialKm: formData.initialKm ? Number(formData.initialKm) : undefined,
          observations: formData.observations || undefined,
        }),
  };

  const resp = await post<{ success: boolean; message?: string; error?: string }>(
    endpoint,
    payload
  );

  if (!resp.ok || !resp.data?.success) {
    const errorMessage =
      resp.error || resp.data?.message || resp.data?.error || 'Erro ao cadastrar o veículo.';
    throw new Error(errorMessage);
  }

  return resp.data;
};
