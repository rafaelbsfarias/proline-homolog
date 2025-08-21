import { IClientService } from './IClientService';
import { ModuleInterface } from '@/modules/common/types/interfaces';

export interface IClientModule extends ModuleInterface {
  readonly clientService: IClientService;
}