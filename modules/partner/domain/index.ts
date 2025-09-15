/**
 * Domínio Partner - Exportações centralizadas
 * Value Objects e Entities do módulo Partner
 */

// Value Objects
export {
  ServiceName,
  ValidationError as ServiceNameValidationError,
} from './value-objects/ServiceName';
export {
  ServicePrice,
  ValidationError as ServicePriceValidationError,
} from './value-objects/ServicePrice';
export {
  ServiceDescription,
  ValidationError as ServiceDescriptionValidationError,
} from './value-objects/ServiceDescription';

// Entities (Aggregate Roots)
export {
  PartnerService,
  ValidationError as PartnerServiceValidationError,
} from './entities/PartnerService';

// Re-export dos tipos comuns do domínio
export type { Result } from '@/modules/common/types/domain';
export { createSuccess, createError } from '@/modules/common/types/domain';
