/**
 * Value Objects do domínio Partner
 * Exportações centralizadas para facilitar importações
 */

export { ServiceName, ValidationError as ServiceNameValidationError } from './ServiceName';
export { ServicePrice, ValidationError as ServicePriceValidationError } from './ServicePrice';
export {
  ServiceDescription,
  ValidationError as ServiceDescriptionValidationError,
} from './ServiceDescription';

// Re-export dos tipos comuns do domínio
export type { Result } from '@/modules/common/types/domain';
export { createSuccess, createError } from '@/modules/common/types/domain';
