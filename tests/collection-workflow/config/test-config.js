/**
 * Configuração Centralizada para Testes do Fluxo de Coleta
 *
 * Este arquivo centraliza todas as configurações necessárias para os testes
 * de diagnóstico do fluxo de coleta problemático.
 */

export const TEST_CONFIG = {
  // IDs de teste
  CLIENT_ID: '00ab894a-1120-4dbe-abb0-c1a6d64b516a',
  ADMIN_ID: 'admin-user-id', // TODO: Definir ID do admin de teste
  ADDRESS_ID: '550e8400-e29b-41d4-a716-446655440000', // ID de endereço de teste

  // Configurações de coleta
  COLLECTION: {
    FEE_PER_VEHICLE: 50,
    DEFAULT_ADDRESS: 'general labatut, 123 - graça',
    DAYS_AHEAD: 1, // Quantos dias no futuro para agendar
  },

  // Configurações de veículos de teste
  TEST_VEHICLES: [
    {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      license_plate: 'ABC-1234',
      status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
    },
    {
      brand: 'Honda',
      model: 'Civic',
      year: 2019,
      license_plate: 'DEF-5678',
      status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
    },
    {
      brand: 'Volkswagen',
      model: 'Golf',
      year: 2021,
      license_plate: 'GHI-9012',
      status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
    },
  ],

  // Status esperados no fluxo
  STATUS_FLOW: {
    INITIAL: 'requested',
    ADMIN_APPROVED: 'approved',
    CLIENT_ACCEPTED: 'paid',
  },

  // Configurações de relatórios
  REPORTS: {
    OUTPUT_DIR: './tests/collection-workflow/reports',
    FILENAME_PREFIX: 'collection-workflow-diagnostic',
    INCLUDE_TIMESTAMP: true,
  },

  // Configurações de monitoramento
  MONITORING: {
    CAPTURE_BEFORE_EACH_STEP: true,
    CAPTURE_AFTER_EACH_STEP: true,
    DETAILED_CHANGE_TRACKING: true,
  },

  // Tabelas a serem monitoradas
  MONITORED_TABLES: ['vehicles', 'vehicle_collections', 'collection_history', 'addresses'],

  // Configurações de log
  LOGGING: {
    LEVEL: 'DEBUG', // DEBUG, INFO, WARN, ERROR
    SHOW_QUERIES: true,
    SHOW_RESULTS: true,
  },
};

// Funções utilitárias
export const getDateDaysFromNow = days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const getTimestampedFilename = (prefix, extension = 'json') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.${extension}`;
};

export default TEST_CONFIG;
