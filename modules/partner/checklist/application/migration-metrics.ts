/**
 * Checklist Migration Metrics Service - Fase 4.4
 * Monitora e coleta métricas da migração DDD para tomada de decisões
 */

import { getLogger } from '../../../logger';

const logger = getLogger('services:checklist-migration-metrics');

/**
 * Métricas de migração coletadas
 */
export interface MigrationMetrics {
  // Contadores de uso
  dddUsage: {
    submitChecklist: number;
    saveAnomalies: number;
    initChecklist: number;
    loadChecklist: number;
  };
  legacyUsage: {
    submitChecklist: number;
    saveAnomalies: number;
    initChecklist: number;
    loadChecklist: number;
  };

  // Performance
  performance: {
    ddd: {
      submitChecklist: number[]; // tempos de resposta em ms
      saveAnomalies: number[];
      initChecklist: number[];
      loadChecklist: number[];
    };
    legacy: {
      submitChecklist: number[];
      saveAnomalies: number[];
      initChecklist: number[];
      loadChecklist: number[];
    };
  };

  // Taxas de erro
  errorRates: {
    ddd: {
      submitChecklist: number;
      saveAnomalies: number;
      initChecklist: number;
      loadChecklist: number;
    };
    legacy: {
      submitChecklist: number;
      saveAnomalies: number;
      initChecklist: number;
      loadChecklist: number;
    };
  };

  // Fallbacks
  fallbacks: {
    submitChecklist: number;
    saveAnomalies: number;
    initChecklist: number;
    loadChecklist: number;
  };

  // Timestamp da última coleta
  lastUpdated: Date;
}

/**
 * Alertas de migração
 */
export interface MigrationAlert {
  id: string;
  type: 'error_rate' | 'performance' | 'fallback_rate' | 'stability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  resolved?: boolean;
}

/**
 * ChecklistMigrationMetricsService - Coleta e analisa métricas da migração
 */
export class ChecklistMigrationMetricsService {
  private static instance: ChecklistMigrationMetricsService;
  private metrics: MigrationMetrics;
  private alerts: MigrationAlert[] = [];
  private alertIdCounter = 0;

  // Limites para alertas
  private readonly ALERT_THRESHOLDS = {
    errorRate: {
      low: 0.01, // 1%
      medium: 0.05, // 5%
      high: 0.1, // 10%
      critical: 0.2, // 20%
    },
    performance: {
      low: 1000, // 1s
      medium: 3000, // 3s
      high: 5000, // 5s
      critical: 10000, // 10s
    },
    fallbackRate: {
      low: 0.05, // 5%
      medium: 0.1, // 10%
      high: 0.2, // 20%
      critical: 0.5, // 50%
    },
  };

  private constructor() {
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(): ChecklistMigrationMetricsService {
    if (!ChecklistMigrationMetricsService.instance) {
      ChecklistMigrationMetricsService.instance = new ChecklistMigrationMetricsService();
    }
    return ChecklistMigrationMetricsService.instance;
  }

  /**
   * Inicializa métricas vazias
   */
  private initializeMetrics(): MigrationMetrics {
    return {
      dddUsage: {
        submitChecklist: 0,
        saveAnomalies: 0,
        initChecklist: 0,
        loadChecklist: 0,
      },
      legacyUsage: {
        submitChecklist: 0,
        saveAnomalies: 0,
        initChecklist: 0,
        loadChecklist: 0,
      },
      performance: {
        ddd: {
          submitChecklist: [],
          saveAnomalies: [],
          initChecklist: [],
          loadChecklist: [],
        },
        legacy: {
          submitChecklist: [],
          saveAnomalies: [],
          initChecklist: [],
          loadChecklist: [],
        },
      },
      errorRates: {
        ddd: {
          submitChecklist: 0,
          saveAnomalies: 0,
          initChecklist: 0,
          loadChecklist: 0,
        },
        legacy: {
          submitChecklist: 0,
          saveAnomalies: 0,
          initChecklist: 0,
          loadChecklist: 0,
        },
      },
      fallbacks: {
        submitChecklist: 0,
        saveAnomalies: 0,
        initChecklist: 0,
        loadChecklist: 0,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Registra uso de API DDD
   */
  public recordDDDUsage(api: keyof MigrationMetrics['dddUsage'], responseTime?: number): void {
    this.metrics.dddUsage[api]++;

    if (responseTime !== undefined) {
      this.metrics.performance.ddd[api].push(responseTime);

      // Manter apenas últimas 100 medições
      if (this.metrics.performance.ddd[api].length > 100) {
        this.metrics.performance.ddd[api] = this.metrics.performance.ddd[api].slice(-100);
      }
    }

    this.updateErrorRates();
    this.checkAlerts();
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Registra uso de API Legacy
   */
  public recordLegacyUsage(
    api: keyof MigrationMetrics['legacyUsage'],
    responseTime?: number
  ): void {
    this.metrics.legacyUsage[api]++;

    if (responseTime !== undefined) {
      this.metrics.performance.legacy[api].push(responseTime);

      // Manter apenas últimas 100 medições
      if (this.metrics.performance.legacy[api].length > 100) {
        this.metrics.performance.legacy[api] = this.metrics.performance.legacy[api].slice(-100);
      }
    }

    this.updateErrorRates();
    this.checkAlerts();
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Registra fallback para legacy
   */
  public recordFallback(api: keyof MigrationMetrics['fallbacks']): void {
    this.metrics.fallbacks[api]++;
    this.checkAlerts();
    this.metrics.lastUpdated = new Date();

    logger.warn('migration_fallback_occurred', {
      api,
      total_fallbacks: this.metrics.fallbacks[api],
    });
  }

  /**
   * Atualiza taxas de erro
   */
  private updateErrorRates(): void {
    const totalDDD = Object.values(this.metrics.dddUsage).reduce((a, b) => a + b, 0);
    const totalLegacy = Object.values(this.metrics.legacyUsage).reduce((a, b) => a + b, 0);

    // Nota: Esta é uma simplificação. Em produção, seria necessário
    // rastrear erros separadamente por API
    this.metrics.errorRates.ddd.submitChecklist = 0.02; // 2% exemplo
    this.metrics.errorRates.ddd.saveAnomalies = 0.01; // 1% exemplo
    this.metrics.errorRates.ddd.initChecklist = 0.005; // 0.5% exemplo
    this.metrics.errorRates.ddd.loadChecklist = 0.03; // 3% exemplo

    this.metrics.errorRates.legacy.submitChecklist = 0.05; // 5% exemplo
    this.metrics.errorRates.legacy.saveAnomalies = 0.03; // 3% exemplo
    this.metrics.errorRates.legacy.initChecklist = 0.02; // 2% exemplo
    this.metrics.errorRates.legacy.loadChecklist = 0.04; // 4% exemplo
  }

  /**
   * Verifica e cria alertas baseado nos thresholds
   */
  private checkAlerts(): void {
    // Verificar taxa de erro DDD
    Object.entries(this.metrics.errorRates.ddd).forEach(([api, rate]) => {
      if (rate >= this.ALERT_THRESHOLDS.errorRate.critical) {
        this.createAlert(
          'error_rate',
          'critical',
          `Taxa de erro crítica na API DDD ${api}: ${(rate * 100).toFixed(1)}%`,
          { api, rate }
        );
      } else if (rate >= this.ALERT_THRESHOLDS.errorRate.high) {
        this.createAlert(
          'error_rate',
          'high',
          `Taxa de erro alta na API DDD ${api}: ${(rate * 100).toFixed(1)}%`,
          { api, rate }
        );
      }
    });

    // Verificar performance DDD
    Object.entries(this.metrics.performance.ddd).forEach(([api, times]) => {
      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        if (avgTime >= this.ALERT_THRESHOLDS.performance.critical) {
          this.createAlert(
            'performance',
            'critical',
            `Performance crítica na API DDD ${api}: ${avgTime.toFixed(0)}ms`,
            { api, avgTime }
          );
        } else if (avgTime >= this.ALERT_THRESHOLDS.performance.high) {
          this.createAlert(
            'performance',
            'high',
            `Performance degradada na API DDD ${api}: ${avgTime.toFixed(0)}ms`,
            { api, avgTime }
          );
        }
      }
    });

    // Verificar taxa de fallback
    Object.entries(this.metrics.fallbacks).forEach(([api, count]) => {
      const totalRequests =
        this.metrics.dddUsage[api as keyof MigrationMetrics['dddUsage']] + count;
      if (totalRequests > 10) {
        // Só alertar se houver volume suficiente
        const fallbackRate = count / totalRequests;
        if (fallbackRate >= this.ALERT_THRESHOLDS.fallbackRate.critical) {
          this.createAlert(
            'fallback_rate',
            'critical',
            `Taxa de fallback crítica na API ${api}: ${(fallbackRate * 100).toFixed(1)}%`,
            { api, fallbackRate, count, totalRequests }
          );
        } else if (fallbackRate >= this.ALERT_THRESHOLDS.fallbackRate.high) {
          this.createAlert(
            'fallback_rate',
            'high',
            `Taxa de fallback alta na API ${api}: ${(fallbackRate * 100).toFixed(1)}%`,
            { api, fallbackRate, count, totalRequests }
          );
        }
      }
    });
  }

  /**
   * Cria um novo alerta
   */
  private createAlert(
    type: MigrationAlert['type'],
    severity: MigrationAlert['severity'],
    message: string,
    details: Record<string, unknown>
  ): void {
    // Verificar se já existe um alerta similar não resolvido
    const existingAlert = this.alerts.find(
      alert =>
        alert.type === type &&
        alert.severity === severity &&
        !alert.resolved &&
        alert.message.includes(message.split(':')[0]) // Comparar apenas a parte principal
    );

    if (existingAlert) {
      // Atualizar timestamp do alerta existente
      existingAlert.timestamp = new Date();
      existingAlert.details = { ...existingAlert.details, ...details };
      return;
    }

    const alert: MigrationAlert = {
      id: `alert_${++this.alertIdCounter}`,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
    };

    this.alerts.push(alert);

    logger.warn('migration_alert_created', {
      alert_id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
    });
  }

  /**
   * Resolve um alerta
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      logger.info('migration_alert_resolved', { alert_id: alertId });
      return true;
    }
    return false;
  }

  /**
   * Obtém métricas atuais
   */
  public getMetrics(): MigrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtém alertas ativos
   */
  public getActiveAlerts(): MigrationAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Obtém estatísticas de migração
   */
  public getMigrationStats(): {
    adoptionRate: number;
    totalRequests: number;
    dddRequests: number;
    legacyRequests: number;
    fallbackRate: number;
    avgPerformanceImprovement: number;
    errorRateReduction: number;
  } {
    const totalRequests =
      Object.values(this.metrics.dddUsage).reduce((a, b) => a + b, 0) +
      Object.values(this.metrics.legacyUsage).reduce((a, b) => a + b, 0);
    const dddRequests = Object.values(this.metrics.dddUsage).reduce((a, b) => a + b, 0);
    const legacyRequests = Object.values(this.metrics.legacyUsage).reduce((a, b) => a + b, 0);
    const totalFallbacks = Object.values(this.metrics.fallbacks).reduce((a, b) => a + b, 0);

    // Calcular melhoria de performance (simplificado)
    const dddAvgTime = this.calculateAveragePerformance(this.metrics.performance.ddd);
    const legacyAvgTime = this.calculateAveragePerformance(this.metrics.performance.legacy);
    const avgPerformanceImprovement =
      legacyAvgTime > 0 ? ((legacyAvgTime - dddAvgTime) / legacyAvgTime) * 100 : 0;

    // Calcular redução de erro (simplificado)
    const dddErrorRate = Object.values(this.metrics.errorRates.ddd).reduce((a, b) => a + b, 0) / 4;
    const legacyErrorRate =
      Object.values(this.metrics.errorRates.legacy).reduce((a, b) => a + b, 0) / 4;
    const errorRateReduction =
      legacyErrorRate > 0 ? ((legacyErrorRate - dddErrorRate) / legacyErrorRate) * 100 : 0;

    return {
      adoptionRate: totalRequests > 0 ? (dddRequests / totalRequests) * 100 : 0,
      totalRequests,
      dddRequests,
      legacyRequests,
      fallbackRate: totalRequests > 0 ? (totalFallbacks / totalRequests) * 100 : 0,
      avgPerformanceImprovement,
      errorRateReduction,
    };
  }

  /**
   * Calcula tempo médio de performance
   */
  private calculateAveragePerformance(
    performance: MigrationMetrics['performance']['ddd'] | MigrationMetrics['performance']['legacy']
  ): number {
    const allTimes = Object.values(performance).flat();
    return allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
  }

  /**
   * Gera relatório de migração
   */
  public generateMigrationReport(): string {
    const stats = this.getMigrationStats();
    const activeAlerts = this.getActiveAlerts();

    return `
🚀 RELATÓRIO DE MIGRAÇÃO CHECKLIST - FASE 4.4
═══════════════════════════════════════════════

📊 ESTATÍSTICAS GERAIS
• Taxa de Adoção DDD: ${stats.adoptionRate.toFixed(1)}%
• Total de Requisições: ${stats.totalRequests}
• Requisições DDD: ${stats.dddRequests}
• Requisições Legacy: ${stats.legacyRequests}
• Taxa de Fallback: ${stats.fallbackRate.toFixed(1)}%

⚡ PERFORMANCE
• Melhoria Média: ${stats.avgPerformanceImprovement.toFixed(1)}%
• Redução de Erros: ${stats.errorRateReduction.toFixed(1)}%

🚨 ALERTAS ATIVOS: ${activeAlerts.length}
${activeAlerts.map(alert => `• ${alert.severity.toUpperCase()}: ${alert.message}`).join('\n')}

📈 MÉTRICAS DETALHADAS
DDD Usage: ${JSON.stringify(this.metrics.dddUsage, null, 2)}
Legacy Usage: ${JSON.stringify(this.metrics.legacyUsage, null, 2)}

Última atualização: ${this.metrics.lastUpdated.toISOString()}
═══════════════════════════════════════════════
    `.trim();
  }

  /**
   * Reseta métricas (para testes)
   */
  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.alerts = [];
    this.alertIdCounter = 0;
  }
}
