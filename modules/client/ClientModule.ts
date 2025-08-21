import { IClientModule } from '../interfaces/IClientModule';
import { ClientService } from './ClientService';

export class ClientModule implements IClientModule {
  readonly moduleName = 'client';
  readonly version = '1.0.0';
  readonly clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }
}