/**
 * Módulo Checklist - Implementação DDD
 *
 * Este módulo implementa o domínio Checklist seguindo os princípios
 * de Domain-Driven Design (DDD), com separação clara entre:
 *
 * - Domain: Regras de negócio puras e entidades
 * - Application: Casos de uso e orquestração
 * - Infrastructure: Adaptadores e implementações concretas
 * - Interfaces: Contratos (ports) do domínio
 *
 * O contexto é normalizado através do Anti-Corruption Layer
 * que centraliza a lógica de decisão entre quote_id e inspection_id.
 */

// Utilitários
export * from './utils/contextNormalizer';

// Interfaces (Ports)
export * from './interfaces';

// Domínio
export * from './domain';

// Aplicação
export * from './application';

// Infraestrutura
export * from './infrastructure';

// Infraestrutura Real (Fase 3)
export { realInfrastructure, checklistApplicationService } from './application/real-services';
export { checklistSubmittedHandler, timelineEventHandler } from './application/event-handlers';
