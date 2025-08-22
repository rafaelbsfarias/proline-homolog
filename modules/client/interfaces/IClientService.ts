import { VehicleData } from 'modules/client/types/index';
import { Result } from '@/modules/common/types/domain';

export interface IClientService {
  getVehicles(userId: string): Promise<Result<VehicleData[]>>;
  createVehicle(vehicleData: any, userId: string): Promise<Result<VehicleData>>;
  updateVehicle(vehicleId: string, vehicleData: any, userId: string): Promise<Result<VehicleData>>;
  deleteVehicle(vehicleId: string, userId: string): Promise<Result<void>>;
  getVehicleById(vehicleId: string, userId: string): Promise<Result<VehicleData>>;
}
