/**
 * API de Monitoramento da Migração DDD - Fase 4.4
 * Endpoint para acompanhar métricas e status da migração
 */

import { NextResponse } from 'next/server';
import { ChecklistMigrationMetricsService } from '../../../../../modules/partner/checklist/application/migration-metrics';
import { getLogger } from '../../../../../modules/logger';

const logger = getLogger('api:admin:checklist-migration-metrics');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/checklist-migration/metrics
 *
 * Retorna métricas detalhadas da migração DDD
 */
export async function GET() {
  try {
    const metricsService = ChecklistMigrationMetricsService.getInstance();

    const metrics = metricsService.getMetrics();
    const stats = metricsService.getMigrationStats();
    const alerts = metricsService.getActiveAlerts();
    const report = metricsService.generateMigrationReport();

    logger.info('migration_metrics_requested', {
      total_requests: stats.totalRequests,
      adoption_rate: stats.adoptionRate.toFixed(1),
      active_alerts: alerts.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        stats,
        alerts,
        report,
      },
    });
  } catch (error) {
    logger.error('migration_metrics_error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Erro ao obter métricas de migração' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/checklist-migration/metrics
 *
 * Endpoints para controle da migração
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, alertId } = body;

    const metricsService = ChecklistMigrationMetricsService.getInstance();

    switch (action) {
      case 'resolve_alert': {
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: 'alertId é obrigatório' },
            { status: 400 }
          );
        }

        const resolved = metricsService.resolveAlert(alertId);
        if (resolved) {
          logger.info('alert_resolved', { alert_id: alertId });
          return NextResponse.json({
            success: true,
            message: 'Alerta resolvido com sucesso',
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Alerta não encontrado' },
            { status: 404 }
          );
        }
      }

      case 'reset_metrics': {
        // Apenas para desenvolvimento/testes
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json(
            { success: false, error: 'Operação não permitida em produção' },
            { status: 403 }
          );
        }

        (metricsService as unknown as { resetMetrics: () => void }).resetMetrics();
        logger.info('metrics_reset');
        return NextResponse.json({
          success: true,
          message: 'Métricas resetadas com sucesso',
        });
      }

      case 'get_report': {
        const report = metricsService.generateMigrationReport();
        return NextResponse.json({
          success: true,
          data: { report },
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Ação não suportada' }, { status: 400 });
    }
  } catch (error) {
    logger.error('migration_metrics_post_error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Erro na operação de migração' },
      { status: 500 }
    );
  }
}
