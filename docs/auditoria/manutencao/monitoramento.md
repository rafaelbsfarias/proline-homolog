# Monitoramento e Alertas - Sistema de Auditoria

## 📊 Estratégia de Monitoramento Completa

### 1. Visão Geral do Monitoramento

O sistema de auditoria requer monitoramento contínuo para garantir:
- **Disponibilidade**: Sistema sempre operacional
- **Performance**: Impacto mínimo nas operações
- **Integridade**: Dados de auditoria preservados
- **Segurança**: Controle de acesso mantido
- **Conformidade**: Requisitos regulatórios atendidos

## 📈 Métricas de Monitoramento

### 1.1 Métricas de Performance

#### Latência de Auditoria
```sql
-- Query para monitorar latência média de auditoria
SELECT
  table_name,
  operation,
  AVG(EXTRACT(EPOCH FROM (created_at - transaction_timestamp()))) as avg_latency_seconds,
  COUNT(*) as total_logs,
  MAX(EXTRACT(EPOCH FROM (created_at - transaction_timestamp()))) as max_latency_seconds
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY table_name, operation
ORDER BY avg_latency_seconds DESC;
```

#### Throughput de Logs
```sql
-- Monitoramento de throughput por hora
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as logs_per_hour,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT table_name) as tables_affected
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

#### Tamanho da Tabela de Auditoria
```sql
-- Monitoramento do crescimento da tabela
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE tablename = 'audit_logs'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 1.2 Métricas de Integridade

#### Verificação de Integridade de Dados
```sql
-- Verificar se todos os registros têm logs de auditoria
CREATE OR REPLACE FUNCTION verify_audit_integrity()
RETURNS TABLE (
  table_name text,
  missing_logs bigint,
  total_records bigint,
  coverage_percentage numeric
) AS $$
DECLARE
  audit_table record;
  sql_query text;
BEGIN
  FOR audit_table IN
    SELECT DISTINCT table_name FROM audit_config WHERE enabled = true
  LOOP
    sql_query := format('
      SELECT
        %L as table_name,
        (SELECT COUNT(*) FROM %I) - (SELECT COUNT(*) FROM audit_logs WHERE table_name = %L) as missing_logs,
        (SELECT COUNT(*) FROM %I) as total_records,
        CASE
          WHEN (SELECT COUNT(*) FROM %I) > 0
          THEN ROUND(((SELECT COUNT(*) FROM audit_logs WHERE table_name = %L) * 100.0 / (SELECT COUNT(*) FROM %I)), 2)
          ELSE 0
        END as coverage_percentage
    ', audit_table.table_name, audit_table.table_name, audit_table.table_name,
       audit_table.table_name, audit_table.table_name, audit_table.table_name, audit_table.table_name);

    RETURN QUERY EXECUTE sql_query;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### Detecção de Anomalias
```sql
-- Detectar operações suspeitas
SELECT
  user_id,
  user_email,
  operation,
  table_name,
  COUNT(*) as operation_count,
  MIN(created_at) as first_operation,
  MAX(created_at) as last_operation
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND operation IN ('DELETE', 'UPDATE')
GROUP BY user_id, user_email, operation, table_name
HAVING COUNT(*) > 100  -- Threshold configurável
ORDER BY operation_count DESC;
```

### 1.3 Métricas de Segurança

#### Tentativas de Acesso Não Autorizado
```sql
-- Monitorar tentativas de acesso aos logs de auditoria
SELECT
  user_id,
  user_email,
  ip_address,
  COUNT(*) as access_attempts,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt,
  array_agg(DISTINCT operation) as operations_attempted
FROM audit_logs
WHERE table_name = 'audit_logs'
  AND created_at >= NOW() - INTERVAL '24 hours'
  AND operation = 'SELECT'
GROUP BY user_id, user_email, ip_address
ORDER BY access_attempts DESC;
```

#### Detecção de Violação de Integridade
```sql
-- Verificar se logs foram alterados
SELECT
  id,
  created_at,
  updated_at,
  CASE
    WHEN updated_at IS NOT NULL AND updated_at != created_at THEN 'MODIFIED'
    ELSE 'ORIGINAL'
  END as integrity_status
FROM audit_logs
WHERE updated_at IS NOT NULL
ORDER BY updated_at DESC;
```

## 🚨 Sistema de Alertas

### 2.1 Alertas de Performance

#### Alerta de Alta Latência
```sql
-- Trigger para alerta de latência alta
CREATE OR REPLACE FUNCTION alert_high_latency()
RETURNS trigger AS $$
DECLARE
  avg_latency numeric;
BEGIN
  -- Calcular latência média dos últimos 5 minutos
  SELECT AVG(EXTRACT(EPOCH FROM (created_at - transaction_timestamp())))
  INTO avg_latency
  FROM audit_logs
  WHERE created_at >= NOW() - INTERVAL '5 minutes';

  -- Alertar se latência > 100ms
  IF avg_latency > 0.1 THEN
    -- Inserir alerta
    INSERT INTO system_alerts (
      alert_type,
      severity,
      message,
      details,
      created_at
    ) VALUES (
      'AUDIT_LATENCY',
      'warning',
      'Alta latência de auditoria detectada',
      jsonb_build_object(
        'avg_latency_seconds', avg_latency,
        'threshold_seconds', 0.1,
        'time_window', '5 minutes'
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Alerta de Falha de Auditoria
```sql
-- Monitorar falhas de auditoria
CREATE OR REPLACE FUNCTION monitor_audit_failures()
RETURNS void AS $$
DECLARE
  failure_count bigint;
BEGIN
  -- Contar falhas nos últimos 10 minutos
  SELECT COUNT(*)
  INTO failure_count
  FROM audit_logs
  WHERE severity = 'error'
    AND operation = 'AUDIT_FAILURE'
    AND created_at >= NOW() - INTERVAL '10 minutes';

  -- Alertar se houver mais de 5 falhas
  IF failure_count > 5 THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      message,
      details,
      created_at
    ) VALUES (
      'AUDIT_FAILURE',
      'critical',
      'Múltiplas falhas de auditoria detectadas',
      jsonb_build_object(
        'failure_count', failure_count,
        'time_window', '10 minutes',
        'threshold', 5
      ),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Alertas de Segurança

#### Alerta de Acesso Suspeito
```sql
-- Detectar padrões de acesso suspeitos
CREATE OR REPLACE FUNCTION detect_suspicious_access()
RETURNS void AS $$
DECLARE
  suspicious_user record;
BEGIN
  FOR suspicious_user IN
    SELECT
      user_id,
      user_email,
      COUNT(*) as operation_count,
      array_agg(DISTINCT table_name) as tables_accessed
    FROM audit_logs
    WHERE created_at >= NOW() - INTERVAL '1 hour'
      AND operation IN ('DELETE', 'UPDATE')
    GROUP BY user_id, user_email
    HAVING COUNT(*) > 50  -- Threshold configurável
  LOOP
    INSERT INTO security_alerts (
      alert_type,
      severity,
      user_id,
      user_email,
      message,
      details,
      created_at
    ) VALUES (
      'SUSPICIOUS_ACTIVITY',
      'high',
      suspicious_user.user_id,
      suspicious_user.user_email,
      'Atividade suspeita detectada',
      jsonb_build_object(
        'operation_count', suspicious_user.operation_count,
        'tables_accessed', suspicious_user.tables_accessed,
        'time_window', '1 hour'
      ),
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### Alerta de Violação de Integridade
```sql
-- Alertar sobre possíveis violações de integridade
CREATE OR REPLACE FUNCTION alert_integrity_violation()
RETURNS trigger AS $$
BEGIN
  -- Verificar se o log está sendo modificado
  IF OLD.created_at != NEW.created_at THEN
    INSERT INTO security_alerts (
      alert_type,
      severity,
      message,
      details,
      created_at
    ) VALUES (
      'INTEGRITY_VIOLATION',
      'critical',
      'Tentativa de modificação de log de auditoria detectada',
      jsonb_build_object(
        'log_id', NEW.id,
        'original_created_at', OLD.created_at,
        'modified_created_at', NEW.created_at,
        'user_id', NEW.user_id
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 Alertas de Capacidade

#### Alerta de Crescimento Excessivo
```sql
-- Monitorar crescimento da tabela de auditoria
CREATE OR REPLACE FUNCTION monitor_audit_growth()
RETURNS void AS $$
DECLARE
  current_size bigint;
  growth_rate numeric;
BEGIN
  -- Obter tamanho atual
  SELECT pg_total_relation_size('audit_logs')
  INTO current_size;

  -- Calcular taxa de crescimento (comparado com ontem)
  SELECT
    CASE
      WHEN yesterday_size > 0
      THEN ((current_size - yesterday_size) * 100.0 / yesterday_size)
      ELSE 0
    END
  INTO growth_rate
  FROM (
    SELECT pg_total_relation_size('audit_logs') as yesterday_size
    FROM audit_logs_growth_history
    WHERE date = CURRENT_DATE - 1
  ) y;

  -- Alertar se crescimento > 20% em um dia
  IF growth_rate > 20 THEN
    INSERT INTO capacity_alerts (
      alert_type,
      severity,
      message,
      details,
      created_at
    ) VALUES (
      'AUDIT_GROWTH',
      'warning',
      'Crescimento excessivo da tabela de auditoria',
      jsonb_build_object(
        'current_size_bytes', current_size,
        'growth_rate_percentage', growth_rate,
        'threshold_percentage', 20
      ),
      NOW()
    );
  END IF;

  -- Registrar histórico de crescimento
  INSERT INTO audit_logs_growth_history (date, size_bytes)
  VALUES (CURRENT_DATE, current_size)
  ON CONFLICT (date) DO UPDATE SET size_bytes = current_size;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Dashboards de Monitoramento

### 3.1 Dashboard de Performance

#### Componente React para Métricas de Performance
```tsx
// components/monitoring/AuditPerformanceDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { AuditMetricsService } from '@/services/AuditMetricsService';

export default function AuditPerformanceDashboard() {
  const [metrics, setMetrics] = useState({
    latency: [],
    throughput: [],
    errors: [],
    coverage: {}
  });

  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      const data = await AuditMetricsService.getPerformanceMetrics(timeRange);
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  return (
    <div className="audit-performance-dashboard">
      <div className="dashboard-header">
        <h2>Monitoramento de Performance - Sistema de Auditoria</h2>
        <div className="time-range-selector">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">Última Hora</option>
            <option value="24h">Últimas 24 Horas</option>
            <option value="7d">Últimos 7 Dias</option>
            <option value="30d">Últimos 30 Dias</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Latência Média</h3>
          <LineChart
            data={metrics.latency}
            xKey="timestamp"
            yKey="avg_latency"
            color="#3b82f6"
          />
        </div>

        <div className="metric-card">
          <h3>Throughput</h3>
          <BarChart
            data={metrics.throughput}
            xKey="hour"
            yKey="logs_count"
            color="#10b981"
          />
        </div>

        <div className="metric-card">
          <h3>Erros por Tipo</h3>
          <PieChart
            data={metrics.errors}
            labelKey="error_type"
            valueKey="count"
          />
        </div>

        <div className="metric-card">
          <h3>Cobertura de Auditoria</h3>
          <div className="coverage-display">
            {Object.entries(metrics.coverage).map(([table, percentage]) => (
              <div key={table} className="coverage-item">
                <span className="table-name">{table}</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="percentage">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="alerts-section">
        <h3>Alertas Ativos</h3>
        <AuditAlertsList />
      </div>
    </div>
  );
}
```

### 3.2 Dashboard de Segurança

#### Componente de Alertas de Segurança
```tsx
// components/monitoring/AuditSecurityDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SecurityAlertList } from './SecurityAlertList';
import { AccessPatternChart } from './AccessPatternChart';
import { SecurityMetricsService } from '@/services/SecurityMetricsService';

export default function AuditSecurityDashboard() {
  const [securityData, setSecurityData] = useState({
    alerts: [],
    accessPatterns: [],
    failedAttempts: [],
    integrityChecks: {}
  });

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      const data = await SecurityMetricsService.getSecurityMetrics();
      setSecurityData(data);
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
    }
  };

  return (
    <div className="audit-security-dashboard">
      <div className="dashboard-header">
        <h2>Monitoramento de Segurança - Sistema de Auditoria</h2>
      </div>

      <div className="security-grid">
        <div className="security-card">
          <h3>Alertas de Segurança</h3>
          <SecurityAlertList alerts={securityData.alerts} />
        </div>

        <div className="security-card">
          <h3>Padrões de Acesso</h3>
          <AccessPatternChart data={securityData.accessPatterns} />
        </div>

        <div className="security-card">
          <h3>Tentativas de Acesso Falhadas</h3>
          <FailedAccessChart data={securityData.failedAttempts} />
        </div>

        <div className="security-card">
          <h3>Verificações de Integridade</h3>
          <IntegrityStatusDisplay status={securityData.integrityChecks} />
        </div>
      </div>
    </div>
  );
}
```

## 🔧 Estratégia de Manutenção

### 4.1 Limpeza Automática de Logs

#### Estratégia de Retenção
```sql
-- Configurar retenção automática de logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
DECLARE
  retention_days integer := 365; -- 1 ano por padrão
  deleted_count bigint;
BEGIN
  -- Deletar logs antigos
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Registrar limpeza
  INSERT INTO maintenance_log (
    operation,
    details,
    records_affected,
    created_at
  ) VALUES (
    'AUDIT_LOG_CLEANUP',
    jsonb_build_object(
      'retention_days', retention_days,
      'cleanup_date', NOW()
    ),
    deleted_count,
    NOW()
  );

  -- Log da operação
  RAISE NOTICE 'Limpos % logs de auditoria com mais de % dias', deleted_count, retention_days;
END;
$$ LANGUAGE plpgsql;
```

#### Particionamento Automático
```sql
-- Criar partições mensais automaticamente
CREATE OR REPLACE FUNCTION create_audit_partition(
  partition_date date
)
RETURNS void AS $$
DECLARE
  partition_name text;
  start_date date;
  end_date date;
BEGIN
  partition_name := 'audit_logs_' || to_char(partition_date, 'YYYY_MM');
  start_date := date_trunc('month', partition_date);
  end_date := start_date + interval '1 month';

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
    FOR VALUES FROM (%L) TO (%L)
  ', partition_name, start_date, end_date);

  -- Criar índices na partição
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%s_created_at ON %I (created_at)
  ', partition_name, partition_name);

  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%s_user_id ON %I (user_id)
  ', partition_name, partition_name);

  RAISE NOTICE 'Partição % criada para o período % - %', partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Otimização de Performance

#### Reindexação Automática
```sql
-- Reindexar tabelas de auditoria periodicamente
CREATE OR REPLACE FUNCTION reindex_audit_tables()
RETURNS void AS $$
DECLARE
  audit_table record;
BEGIN
  FOR audit_table IN
    SELECT tablename
    FROM pg_tables
    WHERE tablename LIKE 'audit_logs%'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('REINDEX TABLE %I', audit_table.tablename);
    RAISE NOTICE 'Reindexada tabela: %', audit_table.tablename;
  END LOOP;

  -- Registrar manutenção
  INSERT INTO maintenance_log (
    operation,
    details,
    created_at
  ) VALUES (
    'AUDIT_REINDEX',
    jsonb_build_object('reindex_date', NOW()),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;
```

#### Análise de Estatísticas
```sql
-- Atualizar estatísticas das tabelas de auditoria
CREATE OR REPLACE FUNCTION update_audit_statistics()
RETURNS void AS $$
DECLARE
  audit_table record;
BEGIN
  FOR audit_table IN
    SELECT tablename
    FROM pg_tables
    WHERE tablename LIKE 'audit_logs%'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('ANALYZE %I', audit_table.tablename);
    RAISE NOTICE 'Estatísticas atualizadas para: %', audit_table.tablename;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## 📋 Jobs de Monitoramento

### 5.1 Jobs PostgreSQL

#### Job de Monitoramento Principal
```sql
-- Job principal executado a cada 5 minutos
CREATE OR REPLACE FUNCTION audit_monitoring_job()
RETURNS void AS $$
BEGIN
  -- Verificar latência
  PERFORM alert_high_latency();

  -- Verificar falhas
  PERFORM monitor_audit_failures();

  -- Verificar acesso suspeito
  PERFORM detect_suspicious_access();

  -- Verificar crescimento
  PERFORM monitor_audit_growth();

  -- Verificar integridade
  PERFORM verify_audit_integrity();

  RAISE NOTICE 'Job de monitoramento de auditoria executado em %', NOW();
END;
$$ LANGUAGE plpgsql;
```

#### Agendamento de Jobs
```sql
-- Instalar pg_cron se disponível
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar jobs de monitoramento
-- SELECT cron.schedule('audit-monitoring', '*/5 * * * *', 'SELECT audit_monitoring_job()');

-- Agendar limpeza mensal
-- SELECT cron.schedule('audit-cleanup', '0 2 1 * *', 'SELECT cleanup_old_audit_logs()');

-- Agendar reindexação semanal
-- SELECT cron.schedule('audit-reindex', '0 3 * * 0', 'SELECT reindex_audit_tables()');
```

### 5.2 Jobs de Aplicação (Node.js)

#### Serviço de Monitoramento
```typescript
// services/AuditMonitoringService.ts
export class AuditMonitoringService {
  private monitoringInterval: NodeJS.Timeout | null = null;

  startMonitoring() {
    // Executar monitoramento a cada 5 minutos
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runMonitoringChecks();
      } catch (error) {
        console.error('Erro no monitoramento de auditoria:', error);
      }
    }, 5 * 60 * 1000);

    console.log('Serviço de monitoramento de auditoria iniciado');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async runMonitoringChecks() {
    await Promise.all([
      this.checkAuditHealth(),
      this.checkPerformanceMetrics(),
      this.checkSecurityAlerts(),
      this.checkCapacityLimits()
    ]);
  }

  private async checkAuditHealth() {
    // Verificar se triggers estão ativos
    const triggerStatus = await this.checkTriggersStatus();

    // Verificar conectividade com banco
    const dbStatus = await this.checkDatabaseConnectivity();

    // Verificar cobertura de auditoria
    const coverageStatus = await this.checkAuditCoverage();

    // Alertar se houver problemas
    if (!triggerStatus.allActive) {
      await this.sendAlert('AUDIT_TRIGGERS_INACTIVE', 'warning', {
        inactiveTriggers: triggerStatus.inactive
      });
    }

    if (!dbStatus.connected) {
      await this.sendAlert('AUDIT_DB_DISCONNECTED', 'critical', {
        error: dbStatus.error
      });
    }
  }

  private async checkPerformanceMetrics() {
    const metrics = await this.getPerformanceMetrics();

    // Verificar latência
    if (metrics.avgLatency > 100) { // 100ms
      await this.sendAlert('HIGH_AUDIT_LATENCY', 'warning', {
        avgLatency: metrics.avgLatency,
        threshold: 100
      });
    }

    // Verificar throughput
    if (metrics.logsPerMinute < 10) { // Menos de 10 logs/minuto
      await this.sendAlert('LOW_AUDIT_THROUGHPUT', 'info', {
        logsPerMinute: metrics.logsPerMinute,
        threshold: 10
      });
    }
  }

  private async checkSecurityAlerts() {
    const alerts = await this.getSecurityAlerts();

    for (const alert of alerts) {
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await this.sendAlert('AUDIT_SECURITY_ALERT', alert.severity, alert);
      }
    }
  }

  private async checkCapacityLimits() {
    const capacity = await this.getCapacityMetrics();

    // Verificar tamanho da tabela
    if (capacity.tableSizeGB > 100) { // 100GB
      await this.sendAlert('AUDIT_TABLE_SIZE_WARNING', 'warning', {
        tableSizeGB: capacity.tableSizeGB,
        threshold: 100
      });
    }

    // Verificar crescimento diário
    if (capacity.dailyGrowthRate > 0.1) { // 10% ao dia
      await this.sendAlert('AUDIT_GROWTH_RATE_WARNING', 'warning', {
        dailyGrowthRate: capacity.dailyGrowthRate,
        threshold: 0.1
      });
    }
  }

  private async sendAlert(type: string, severity: string, details: any) {
    // Implementar envio de alertas (email, Slack, etc.)
    console.log(`Alerta ${severity}: ${type}`, details);

    // Persistir alerta no banco
    await this.persistAlert(type, severity, details);
  }

  private async persistAlert(type: string, severity: string, details: any) {
    // Inserir alerta no banco de dados
    // Implementação específica do banco
  }

  // Métodos auxiliares
  private async checkTriggersStatus() { /* ... */ }
  private async checkDatabaseConnectivity() { /* ... */ }
  private async checkAuditCoverage() { /* ... */ }
  private async getPerformanceMetrics() { /* ... */ }
  private async getSecurityAlerts() { /* ... */ }
  private async getCapacityMetrics() { /* ... */ }
}
```

## 📊 Relatórios de Monitoramento

### 6.1 Relatório Diário
```sql
-- Gerar relatório diário de auditoria
CREATE OR REPLACE FUNCTION generate_daily_audit_report(
  report_date date DEFAULT CURRENT_DATE - 1
)
RETURNS jsonb AS $$
DECLARE
  report jsonb;
BEGIN
  SELECT jsonb_build_object(
    'date', report_date,
    'summary', jsonb_build_object(
      'total_logs', (SELECT COUNT(*) FROM audit_logs WHERE DATE(created_at) = report_date),
      'active_users', (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE DATE(created_at) = report_date),
      'operations_by_type', (
        SELECT jsonb_object_agg(operation, count)
        FROM (
          SELECT operation, COUNT(*) as count
          FROM audit_logs
          WHERE DATE(created_at) = report_date
          GROUP BY operation
        ) op
      ),
      'errors_count', (
        SELECT COUNT(*)
        FROM audit_logs
        WHERE DATE(created_at) = report_date
          AND severity IN ('error', 'critical')
      )
    ),
    'performance', jsonb_build_object(
      'avg_latency', (
        SELECT AVG(EXTRACT(EPOCH FROM (created_at - transaction_timestamp())))
        FROM audit_logs
        WHERE DATE(created_at) = report_date
      ),
      'peak_hour', (
        SELECT EXTRACT(hour FROM created_at)
        FROM audit_logs
        WHERE DATE(created_at) = report_date
        GROUP BY EXTRACT(hour FROM created_at)
        ORDER BY COUNT(*) DESC
        LIMIT 1
      )
    ),
    'security', jsonb_build_object(
      'suspicious_activities', (
        SELECT COUNT(*)
        FROM security_alerts
        WHERE DATE(created_at) = report_date
      ),
      'failed_access_attempts', (
        SELECT COUNT(*)
        FROM audit_logs
        WHERE DATE(created_at) = report_date
          AND operation = 'ACCESS_DENIED'
      )
    )
  ) INTO report;

  -- Persistir relatório
  INSERT INTO audit_reports (report_date, report_type, data, created_at)
  VALUES (report_date, 'daily', report, NOW());

  RETURN report;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Relatório de Conformidade
```sql
-- Gerar relatório de conformidade regulatória
CREATE OR REPLACE FUNCTION generate_compliance_report(
  start_date date,
  end_date date
)
RETURNS jsonb AS $$
DECLARE
  compliance_report jsonb;
BEGIN
  SELECT jsonb_build_object(
    'period', jsonb_build_object('start', start_date, 'end', end_date),
    'audit_coverage', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table_name', table_name,
          'total_records', total_records,
          'audited_records', audited_records,
          'coverage_percentage', coverage_percentage
        )
      )
      FROM verify_audit_integrity()
    ),
    'data_integrity', jsonb_build_object(
      'integrity_violations', (
        SELECT COUNT(*)
        FROM security_alerts
        WHERE alert_type = 'INTEGRITY_VIOLATION'
          AND DATE(created_at) BETWEEN start_date AND end_date
      ),
      'last_integrity_check', (
        SELECT MAX(created_at)
        FROM maintenance_log
        WHERE operation = 'INTEGRITY_CHECK'
      )
    ),
    'access_control', jsonb_build_object(
      'unauthorized_attempts', (
        SELECT COUNT(*)
        FROM audit_logs
        WHERE operation = 'ACCESS_DENIED'
          AND DATE(created_at) BETWEEN start_date AND end_date
      ),
      'admin_access_count', (
        SELECT COUNT(*)
        FROM audit_logs
        WHERE table_name = 'audit_logs'
          AND DATE(created_at) BETWEEN start_date AND end_date
      )
    ),
    'retention_compliance', jsonb_build_object(
      'oldest_log', (SELECT MIN(created_at) FROM audit_logs),
      'retention_days', 365,
      'cleanup_history', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'cleanup_date', created_at,
            'records_deleted', records_affected
          )
        )
        FROM maintenance_log
        WHERE operation = 'AUDIT_LOG_CLEANUP'
          AND DATE(created_at) BETWEEN start_date AND end_date
      )
    )
  ) INTO compliance_report;

  RETURN compliance_report;
END;
$$ LANGUAGE plpgsql;
```

---

**Esta estratégia de monitoramento garante que o sistema de auditoria mantenha alta disponibilidade, performance e segurança, com alertas proativos e manutenção automatizada.**</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/auditoria/implementacao/testes.md
