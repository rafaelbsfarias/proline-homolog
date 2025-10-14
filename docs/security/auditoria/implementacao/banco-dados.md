# Arquitetura do Sistema de Auditoria

## 🏗️ Visão Geral da Arquitetura

O sistema de auditoria do Proline utiliza uma abordagem híbrida que combina triggers de banco de dados com middleware de aplicação, garantindo captura completa de operações tanto diretas no banco quanto através da API.

## 📊 Componentes Principais

### 1. Camada de Dados (PostgreSQL)

#### Tabela de Auditoria
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    table_name VARCHAR(255) NOT NULL,
    record_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    tags TEXT[],
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Índices de performance
    INDEX idx_audit_logs_table_operation (table_name, operation),
    INDEX idx_audit_logs_user_created (user_id, created_at),
    INDEX idx_audit_logs_created_at (created_at DESC),
    INDEX idx_audit_logs_record_id (record_id),
    INDEX idx_audit_logs_tags (tags)
);
```

#### Triggers Automáticos
- **Captura automática** de todas as operações DML
- **Contexto mínimo** (sem dependência da aplicação)
- **Performance otimizada** (execução no banco)

#### Functions de Suporte
```sql
-- Function principal de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs;
    old_data JSONB := NULL;
    new_data JSONB := NULL;
BEGIN
    -- Preparar dados da operação
    CASE TG_OP
        WHEN 'INSERT' THEN
            new_data := row_to_json(NEW)::JSONB;
        WHEN 'UPDATE' THEN
            old_data := row_to_json(OLD)::JSONB;
            new_data := row_to_json(NEW)::JSONB;
        WHEN 'DELETE' THEN
            old_data := row_to_json(OLD)::JSONB;
    END CASE;

    -- Inserir log de auditoria
    INSERT INTO audit_logs (
        operation, table_name, record_id,
        old_values, new_values,
        user_id, user_email, session_id,
        ip_address, user_agent, metadata
    ) VALUES (
        TG_OP, TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        old_data, new_data,
        current_setting('app.user_id', TRUE)::UUID,
        current_setting('app.user_email', TRUE),
        current_setting('app.session_id', TRUE),
        inet_client_addr(),
        current_setting('app.user_agent', TRUE),
        jsonb_build_object(
            'schema', TG_TABLE_SCHEMA,
            'trigger', TG_NAME,
            'timestamp', extract(epoch from now())
        )
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Camada de Aplicação (Next.js)

#### Middleware de Auditoria
```typescript
// middleware/audit.ts
import { NextRequest } from 'next/server';
import { AuditService } from '@/services/AuditService';

export class AuditMiddleware {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async logAPIRequest(
    request: NextRequest,
    userId: string,
    operation: string,
    metadata?: any
  ) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const ip = this.getClientIP(request);

    await this.auditService.logActivity({
      operation: 'API_REQUEST',
      table_name: 'api_requests',
      user_id: userId,
      metadata: {
        method: request.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        userAgent,
        ip,
        operation,
        ...metadata
      },
      severity: this.getSeverity(operation),
      tags: ['api', operation]
    });
  }

  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  }

  private getSeverity(operation: string): string {
    const criticalOps = ['DELETE', 'ADMIN_ACTION'];
    return criticalOps.includes(operation) ? 'warning' : 'info';
  }
}
```

#### Service de Auditoria
```typescript
// services/AuditService.ts
export class AuditService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async logActivity(params: AuditLogParams) {
    const logEntry = {
      operation: params.operation,
      table_name: params.table_name,
      record_id: params.record_id,
      user_id: params.user_id,
      user_email: params.user_email,
      old_values: params.old_values,
      new_values: params.new_values,
      metadata: params.metadata,
      tags: params.tags || [],
      severity: params.severity || 'info',
      session_id: params.session_id,
      ip_address: params.ip_address,
      user_agent: params.user_agent
    };

    const { error } = await this.supabase
      .from('audit_logs')
      .insert(logEntry);

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      // Em caso de erro, poderia enviar para um sistema de fallback
    }
  }

  async logBusinessOperation(
    operation: string,
    entity: string,
    entityId: string,
    userId: string,
    details: any
  ) {
    await this.logActivity({
      operation: 'BUSINESS_OPERATION',
      table_name: entity,
      record_id: entityId,
      user_id: userId,
      metadata: details,
      tags: ['business', operation],
      severity: 'info'
    });
  }
}
```

### 3. Camada de Apresentação (Frontend)

#### Dashboard de Auditoria
```typescript
// components/admin/AuditDashboard.tsx
export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<AuditFilters>({
    table: '',
    operation: '',
    userId: '',
    dateRange: { start: null, end: null },
    severity: ''
  });

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao carregar logs:', error);
      return;
    }

    setLogs(data || []);
  };

  return (
    <div className="audit-dashboard">
      <AuditFilters
        filters={filters}
        onChange={setFilters}
      />
      <AuditLogTable
        logs={logs}
        onExport={exportLogs}
      />
      <AuditStats
        logs={logs}
      />
    </div>
  );
}
```

#### Componente de Visualização de Mudanças
```typescript
// components/admin/AuditChangeViewer.tsx
export function AuditChangeViewer({ log }: { log: AuditLog }) {
  const [diff, setDiff] = useState<any>(null);

  useEffect(() => {
    if (log.old_values && log.new_values) {
      setDiff(computeDiff(log.old_values, log.new_values));
    }
  }, [log]);

  return (
    <div className="change-viewer">
      <h3>Mudanças em {log.table_name}</h3>

      {log.operation === 'UPDATE' && diff && (
        <div className="diff-container">
          <div className="diff-section">
            <h4>Antes</h4>
            <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
          </div>
          <div className="diff-section">
            <h4>Depois</h4>
            <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
          </div>
          <div className="diff-section">
            <h4>Diferenças</h4>
            <DiffViewer diff={diff} />
          </div>
        </div>
      )}

      {log.operation === 'INSERT' && (
        <div className="insert-view">
          <h4>Novo Registro</h4>
          <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
        </div>
      )}

      {log.operation === 'DELETE' && (
        <div className="delete-view">
          <h4>Registro Removido</h4>
          <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## 🔄 Fluxo de Dados

### Operação Normal
1. **Usuário** realiza operação via interface/API
2. **Middleware** captura contexto (usuário, sessão, IP)
3. **Aplicação** executa operação no banco
4. **Trigger** captura mudança e registra log
5. **Service** complementa com metadados da aplicação
6. **Log** fica disponível para consulta e auditoria

### Operação Direta no Banco
1. **Operação SQL** executada diretamente
2. **Trigger** captura mudança automaticamente
3. **Log básico** registrado com informações disponíveis
4. **Aplicação** pode enriquecer log posteriormente

## 📈 Estratégias de Performance

### Otimização de Índices
```sql
-- Índices compostos para consultas comuns
CREATE INDEX CONCURRENTLY idx_audit_logs_composite
ON audit_logs (table_name, operation, created_at DESC);

-- Índice para busca por usuário e período
CREATE INDEX CONCURRENTLY idx_audit_logs_user_date
ON audit_logs (user_id, created_at DESC);

-- Índice para busca por tags
CREATE INDEX CONCURRENTLY idx_audit_logs_tags_gin
ON audit_logs USING GIN (tags);
```

### Particionamento
```sql
-- Particionamento por mês para logs antigos
CREATE TABLE audit_logs_y2025m09 PARTITION OF audit_logs
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- Função para criar partições automaticamente
CREATE OR REPLACE FUNCTION create_audit_partition(
  partition_date DATE
) RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  partition_name := 'audit_logs_y' || EXTRACT(YEAR FROM partition_date) ||
                   'm' || LPAD(EXTRACT(MONTH FROM partition_date)::TEXT, 2, '0');

  start_date := date_trunc('month', partition_date);
  end_date := start_date + INTERVAL '1 month';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
     FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

### Compressão de Dados
```sql
-- Habilitar compressão para campos JSON grandes
ALTER TABLE audit_logs
ALTER COLUMN old_values SET COMPRESSION lz4,
ALTER COLUMN new_values SET COMPRESSION lz4,
ALTER COLUMN metadata SET COMPRESSION lz4;
```

## 🔒 Segurança e Compliance

### Controle de Acesso
- **RBAC**: Controle baseado em papéis
- **Auditoria de Acesso**: Logs de quem acessa os logs
- **Encriptação**: Dados sensíveis encriptados

### Integridade de Dados
- **Hashing**: Validação de integridade dos logs
- **Imutabilidade**: Prevenção de alteração de logs
- **Backup**: Estratégia específica para logs críticos

### Conformidade
- **LGPD/GDPR**: Anonimização e direito ao esquecimento
- **SOX**: Controles internos e auditoria financeira
- **ISO 27001**: Gestão de segurança da informação

## 📊 Monitoramento e Alertas

### Métricas Principais
- **Volume de Logs**: Quantidade por hora/dia
- **Performance**: Latência de inserção de logs
- **Erros**: Taxa de falha na auditoria
- **Cobertura**: Percentual de operações auditadas

### Alertas
```typescript
// services/MonitoringService.ts
export class MonitoringService {
  async checkAuditHealth() {
    const metrics = await this.getAuditMetrics();

    // Alerta se volume de logs estiver baixo
    if (metrics.hourlyVolume < this.thresholds.minVolume) {
      await this.sendAlert('LOW_AUDIT_VOLUME', metrics);
    }

    // Alerta se latência estiver alta
    if (metrics.avgLatency > this.thresholds.maxLatency) {
      await this.sendAlert('HIGH_AUDIT_LATENCY', metrics);
    }

    // Alerta para operações críticas sem log
    if (metrics.uncoveredOperations > 0) {
      await this.sendAlert('UNCOVERED_OPERATIONS', metrics);
    }
  }
}
```

## 🚀 Estratégia de Deploy

### Ambiente de Desenvolvimento
- **Logs detalhados** para debugging
- **Interface completa** para desenvolvedores
- **Dados de teste** para validação

### Ambiente de Staging
- **Configuração idêntica** ao produção
- **Testes de carga** do sistema de auditoria
- **Validação de performance**

### Ambiente de Produção
- **Configuração otimizada** para performance
- **Monitoramento ativo** 24/7
- **Planos de contingência** para falhas

---

**Esta arquitetura garante auditoria completa com mínimo impacto na performance do sistema principal.**</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/auditoria/arquitetura.md
