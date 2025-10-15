/**
 * Configuração dos Serviços de Aplicação com Infraestrutura Real
 * Conecta os serviços de aplicação às implementações reais da infraestrutura
 */

import { ChecklistApplicationService } from './services';
import { realInfrastructure } from '../infrastructure/real-config';

// Instância do serviço de aplicação com infraestrutura real
export const checklistApplicationService = new ChecklistApplicationService(
  realInfrastructure.repositories.checklist,
  realInfrastructure.repositories.checklistItem,
  realInfrastructure.repositories.evidence,
  realInfrastructure.services.timelinePublisher,
  realInfrastructure.services.vehicleStatusWriter
);

// Exporta também os serviços de infraestrutura para uso direto se necessário
export const infrastructureServices = realInfrastructure.services;

// Exporta a infraestrutura completa
export { realInfrastructure };
