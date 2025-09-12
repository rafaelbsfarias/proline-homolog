import { ClientSpecialistsRepository } from '@/modules/vehicles/infrastructure/ClientSpecialistsRepository';

export async function GetClientSpecialistsForClient(clientId: string) {
  return ClientSpecialistsRepository.getByClientId(clientId);
}
