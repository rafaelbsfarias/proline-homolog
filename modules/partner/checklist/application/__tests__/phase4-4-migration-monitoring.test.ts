/**
 * Testes da Fase 4.4 - Rollout controlado e monitoramento
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChecklistMigrationMetricsService } from '../migration-metrics';

// Mock do logger
vi.mock('../../../logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Fase 4.4 - Rollout Controlado e Monitoramento', () => {
  let metricsService: ChecklistMigrationMetricsService;

  beforeEach(() => {
    // Reset singleton instance
    (ChecklistMigrationMetricsService as any).instance = undefined;
    metricsService = ChecklistMigrationMetricsService.getInstance();
    metricsService.resetMetrics();
  });

  describe('Coleta de Métricas', () => {
    it('deve registrar uso de API DDD corretamente', () => {
      metricsService.recordDDDUsage('submitChecklist', 150);
      metricsService.recordDDDUsage('saveAnomalies', 200);
      metricsService.recordDDDUsage('initChecklist', 100);

      const metrics = metricsService.getMetrics();

      expect(metrics.dddUsage.submitChecklist).toBe(1);
      expect(metrics.dddUsage.saveAnomalies).toBe(1);
      expect(metrics.dddUsage.initChecklist).toBe(1);
      expect(metrics.performance.ddd.submitChecklist).toContain(150);
      expect(metrics.performance.ddd.saveAnomalies).toContain(200);
      expect(metrics.performance.ddd.initChecklist).toContain(100);
    });

    it('deve registrar uso de API Legacy corretamente', () => {
      metricsService.recordLegacyUsage('submitChecklist', 300);
      metricsService.recordLegacyUsage('saveAnomalies', 250);

      const metrics = metricsService.getMetrics();

      expect(metrics.legacyUsage.submitChecklist).toBe(1);
      expect(metrics.legacyUsage.saveAnomalies).toBe(1);
      expect(metrics.performance.legacy.submitChecklist).toContain(300);
      expect(metrics.performance.legacy.saveAnomalies).toContain(250);
    });

    it('deve registrar fallbacks corretamente', () => {
      metricsService.recordFallback('submitChecklist');
      metricsService.recordFallback('saveAnomalies');
      metricsService.recordFallback('submitChecklist'); // Segundo fallback

      const metrics = metricsService.getMetrics();

      expect(metrics.fallbacks.submitChecklist).toBe(2);
      expect(metrics.fallbacks.saveAnomalies).toBe(1);
      expect(metrics.fallbacks.initChecklist).toBe(0);
    });

    it('deve manter apenas últimas 100 medições de performance', () => {
      // Registrar 105 medições
      for (let i = 0; i < 105; i++) {
        metricsService.recordDDDUsage('submitChecklist', i);
      }

      const metrics = metricsService.getMetrics();
      expect(metrics.performance.ddd.submitChecklist).toHaveLength(100);
      // Deve conter apenas as últimas 100 medições (5 a 104)
      expect(metrics.performance.ddd.submitChecklist[0]).toBe(5);
      expect(metrics.performance.ddd.submitChecklist[99]).toBe(104);
    });
  });

  describe('Cálculo de Estatísticas', () => {
    beforeEach(() => {
      // Setup dados de teste
      metricsService.recordDDDUsage('submitChecklist', 100);
      metricsService.recordDDDUsage('saveAnomalies', 150);
      metricsService.recordLegacyUsage('submitChecklist', 200);
      metricsService.recordLegacyUsage('saveAnomalies', 250);
      metricsService.recordLegacyUsage('initChecklist', 300);
    });

    it('deve calcular taxa de adoção corretamente', () => {
      const stats = metricsService.getMigrationStats();

      // Total: 5 requests (2 DDD + 3 Legacy)
      // Adoção: (2/5) * 100 = 40%
      expect(stats.adoptionRate).toBe(40);
      expect(stats.totalRequests).toBe(5);
      expect(stats.dddRequests).toBe(2);
      expect(stats.legacyRequests).toBe(3);
    });

    it('deve calcular melhoria de performance', () => {
      const stats = metricsService.getMigrationStats();

      // DDD avg: (100 + 150) / 2 = 125ms
      // Legacy avg: (200 + 250 + 300) / 3 = 250ms
      // Improvement: ((250 - 125) / 250) * 100 = 50%
      expect(stats.avgPerformanceImprovement).toBe(50);
    });

    it('deve calcular redução de erros', () => {
      // Nota: Esta é uma simplificação baseada em dados mockados
      const stats = metricsService.getMigrationStats();
      expect(stats.errorRateReduction).toBeGreaterThan(0);
    });
  });

  describe('Sistema de Alertas', () => {
    it('deve criar alerta para taxa de erro crítica', () => {
      // Simular alta taxa de erro (acima de 20%)
      const metrics = metricsService.getMetrics();
      (metrics.errorRates.ddd.submitChecklist as number) = 0.25; // 25%

      // Trigger check
      (metricsService as any).checkAlerts();

      const alerts = metricsService.getActiveAlerts();
      expect(
        alerts.some(alert => alert.type === 'error_rate' && alert.severity === 'critical')
      ).toBe(true);
    });

    it('deve criar alerta para performance degradada', () => {
      // Registrar medição muito lenta
      for (let i = 0; i < 10; i++) {
        metricsService.recordDDDUsage('submitChecklist', 15000); // 15s - muito lento
      }

      const alerts = metricsService.getActiveAlerts();
      expect(
        alerts.some(alert => alert.type === 'performance' && alert.severity === 'critical')
      ).toBe(true);
    });

    it('deve criar alerta para alta taxa de fallback', () => {
      // Registrar muitos fallbacks
      for (let i = 0; i < 60; i++) {
        metricsService.recordFallback('submitChecklist');
      }

      const alerts = metricsService.getActiveAlerts();
      expect(
        alerts.some(alert => alert.type === 'fallback_rate' && alert.severity === 'critical')
      ).toBe(true);
    });

    it('deve resolver alertas', () => {
      // Criar um alerta primeiro - registrar uso DDD suficiente para criar alerta de fallback
      for (let i = 0; i < 5; i++) {
        metricsService.recordDDDUsage('submitChecklist', 100);
      }
      // Registrar fallbacks suficientes para exceder threshold
      for (let i = 0; i < 6; i++) {
        metricsService.recordFallback('submitChecklist');
      }

      let alerts = metricsService.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const alertId = alerts[0].id;
      const resolved = metricsService.resolveAlert(alertId);

      expect(resolved).toBe(true);

      // Verificar que o alerta não está mais na lista de alertas ativos
      alerts = metricsService.getActiveAlerts();
      expect(alerts.find(a => a.id === alertId)).toBeUndefined();
    });
  });

  describe('Relatório de Migração', () => {
    beforeEach(() => {
      // Setup dados para relatório
      metricsService.recordDDDUsage('submitChecklist', 100);
      metricsService.recordLegacyUsage('submitChecklist', 200);
      metricsService.recordFallback('submitChecklist');
    });

    it('deve gerar relatório completo', () => {
      const report = metricsService.generateMigrationReport();

      expect(report).toContain('RELATÓRIO DE MIGRAÇÃO CHECKLIST - FASE 4.4');
      expect(report).toContain('Taxa de Adoção DDD');
      expect(report).toContain('MÉTRICAS DETALHADAS');
      expect(report).toContain('Última atualização');
    });

    it('deve incluir estatísticas no relatório', () => {
      const report = metricsService.generateMigrationReport();

      expect(report).toContain('50.0%'); // Taxa de adoção
      expect(report).toContain('3'); // Total de requests
      expect(report).toContain('1'); // DDD requests
      expect(report).toContain('2'); // Legacy requests
    });
  });

  describe('Thresholds de Alerta', () => {
    it('deve ter thresholds configurados corretamente', () => {
      const service = metricsService as any;

      expect(service.ALERT_THRESHOLDS.errorRate.critical).toBe(0.2); // 20%
      expect(service.ALERT_THRESHOLDS.errorRate.high).toBe(0.1); // 10%
      expect(service.ALERT_THRESHOLDS.performance.critical).toBe(10000); // 10s
      expect(service.ALERT_THRESHOLDS.fallbackRate.critical).toBe(0.5); // 50%
    });
  });
});
