# Implementação - Banco de Dados

## 📋 Scripts SQL para Sistema de Auditoria

### 1. Criação da Tabela de Auditoria

```sql
-- Criar tabela principal de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'API_REQUEST', 'BUSINESS_OPERATION')),
    table_name VARCHAR(255) NOT NULL,
    record_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configuração de auditoria
CREATE TABLE IF NOT EXISTS audit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    operations TEXT[] DEFAULT '{INSERT,UPDATE,DELETE}',
    exclude_columns TEXT[] DEFAULT '{}',
    retention_days INTEGER DEFAULT 2555, -- ~7 anos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popular configuração inicial
INSERT INTO audit_config (table_name, operations) VALUES
    ('vehicle_collections', '{INSERT,UPDATE,DELETE}'),
    ('vehicles', '{INSERT,UPDATE,DELETE}'),
    ('collection_history', '{INSERT,UPDATE,DELETE}'),
    ('profiles', '{INSERT,UPDATE}'),
    ('audit_logs', '{INSERT}'),
    ('audit_config', '{INSERT,UPDATE,DELETE}')
ON CONFLICT (table_name) DO NOTHING;
```

### 2. Índices de Performance

```sql
-- Índices essenciais para performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_operation
ON audit_logs (table_name, operation);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
ON audit_logs (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_record_id
ON audit_logs (record_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tags
ON audit_logs USING GIN (tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_severity
ON audit_logs (severity);

-- Índices compostos para consultas complexas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_composite_search
ON audit_logs (table_name, operation, user_id, created_at DESC);

-- Índice para busca por período
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_date_range
ON audit_logs (created_at) WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';
```

### 3. Function Principal de Auditoria

```sql
-- Function principal que será chamada pelos triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs;
    old_data JSONB := NULL;
    new_data JSONB := NULL;
    current_user_id UUID;
    current_user_email VARCHAR(255);
    should_audit BOOLEAN := true;
    excluded_columns TEXT[];
BEGIN
    -- Verificar se auditoria está habilitada para esta tabela
    SELECT enabled, exclude_columns INTO should_audit, excluded_columns
    FROM audit_config
    WHERE table_name = TG_TABLE_NAME;

    -- Se auditoria desabilitada, sair
    IF NOT should_audit THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

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

    -- Remover colunas excluídas
    IF excluded_columns IS NOT NULL AND array_length(excluded_columns, 1) > 0 THEN
        old_data := old_data - excluded_columns;
        new_data := new_data - excluded_columns;
    END IF;

    -- Obter contexto do usuário (se disponível)
    BEGIN
        current_user_id := current_setting('app.user_id')::UUID;
        current_user_email := current_setting('app.user_email');
    EXCEPTION
        WHEN OTHERS THEN
            current_user_id := NULL;
            current_user_email := NULL;
    END;

    -- Inserir log de auditoria
    INSERT INTO audit_logs (
        operation,
        table_name,
        record_id,
        old_values,
        new_values,
        user_id,
        user_email,
        session_id,
        ip_address,
        user_agent,
        metadata,
        tags,
        severity
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        old_data,
        new_data,
        current_user_id,
        current_user_email,
        current_setting('app.session_id', TRUE),
        inet_client_addr(),
        current_setting('app.user_agent', TRUE),
        jsonb_build_object(
            'schema', TG_TABLE_SCHEMA,
            'trigger', TG_NAME,
            'timestamp', extract(epoch from now()),
            'transaction_id', txid_current()
        ),
        CASE
            WHEN TG_OP = 'DELETE' THEN ARRAY['delete', 'data-removal']
            WHEN TG_OP = 'INSERT' THEN ARRAY['insert', 'data-creation']
            WHEN TG_OP = 'UPDATE' THEN ARRAY['update', 'data-modification']
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN 'warning'
            ELSE 'info'
        END
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, logar mas não falhar a operação original
        RAISE WARNING 'Erro na função de auditoria: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Triggers para Tabelas Críticas

```sql
-- Trigger para vehicle_collections
DROP TRIGGER IF EXISTS audit_vehicle_collections ON vehicle_collections;
CREATE TRIGGER audit_vehicle_collections
    AFTER INSERT OR UPDATE OR DELETE ON vehicle_collections
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para vehicles
DROP TRIGGER IF EXISTS audit_vehicles ON vehicles;
CREATE TRIGGER audit_vehicles
    AFTER INSERT OR UPDATE OR DELETE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para collection_history
DROP TRIGGER IF EXISTS audit_collection_history ON collection_history;
CREATE TRIGGER audit_collection_history
    AFTER INSERT OR UPDATE OR DELETE ON collection_history
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para profiles (apenas updates importantes)
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email OR
          OLD.full_name IS DISTINCT FROM NEW.full_name OR
          OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION audit_trigger_function();

-- Trigger para audit_logs (auditoria da própria auditoria)
DROP TRIGGER IF EXISTS audit_self_audit ON audit_logs;
CREATE TRIGGER audit_self_audit
    AFTER INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### 5. Functions de Suporte

```sql
-- Function para definir contexto do usuário
CREATE OR REPLACE FUNCTION set_audit_context(
    p_user_id UUID,
    p_user_email VARCHAR(255),
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Definir variáveis de contexto para triggers
    PERFORM set_config('app.user_id', p_user_id::TEXT, false);
    PERFORM set_config('app.user_email', p_user_email, false);

    IF p_session_id IS NOT NULL THEN
        PERFORM set_config('app.session_id', p_session_id, false);
    END IF;

    IF p_user_agent IS NOT NULL THEN
        PERFORM set_config('app.user_agent', p_user_agent, false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para limpar contexto
CREATE OR REPLACE FUNCTION clear_audit_context() RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.user_id', '', false);
    PERFORM set_config('app.user_email', '', false);
    PERFORM set_config('app.session_id', '', false);
    PERFORM set_config('app.user_agent', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para obter estatísticas de auditoria
CREATE OR REPLACE FUNCTION get_audit_stats(
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    table_name VARCHAR(255),
    total_operations BIGINT,
    inserts BIGINT,
    updates BIGINT,
    deletes BIGINT,
    unique_users BIGINT,
    avg_operations_per_day NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.table_name,
        COUNT(*) as total_operations,
        COUNT(*) FILTER (WHERE al.operation = 'INSERT') as inserts,
        COUNT(*) FILTER (WHERE al.operation = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE al.operation = 'DELETE') as deletes,
        COUNT(DISTINCT al.user_id) as unique_users,
        ROUND(COUNT(*)::NUMERIC / p_days, 2) as avg_operations_per_day
    FROM audit_logs al
    WHERE al.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY al.table_name
    ORDER BY total_operations DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. Views para Consultas Comuns

```sql
-- View para logs recentes com informações do usuário
CREATE OR REPLACE VIEW audit_logs_with_users AS
SELECT
    al.*,
    p.email as user_email_full,
    p.full_name as user_full_name,
    p.role as user_role
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id;

-- View para resumo diário de operações
CREATE OR REPLACE VIEW audit_daily_summary AS
SELECT
    DATE(created_at) as log_date,
    table_name,
    operation,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT record_id) as unique_records
FROM audit_logs
GROUP BY DATE(created_at), table_name, operation
ORDER BY log_date DESC, operation_count DESC;

-- View para operações suspeitas
CREATE OR REPLACE VIEW audit_suspicious_operations AS
SELECT
    al.*,
    p.email,
    p.full_name
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id
WHERE
    al.severity IN ('warning', 'error', 'critical')
    OR al.operation = 'DELETE'
    OR al.metadata->>'suspicious' = 'true'
ORDER BY al.created_at DESC;

-- View para trilha de auditoria de um registro específico
CREATE OR REPLACE VIEW audit_record_trail AS
SELECT
    al.*,
    p.email as user_email,
    p.full_name as user_name
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id
WHERE al.record_id IS NOT NULL
ORDER BY al.record_id, al.created_at DESC;
```

### 7. Políticas de Segurança (RLS)

```sql
-- Habilitar Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_config ENABLE ROW LEVEL SECURITY;

-- Política para audit_logs: apenas admins podem ver todos os logs
CREATE POLICY audit_logs_admin_policy ON audit_logs
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'auditor')
    )
);

-- Política para audit_logs: usuários podem ver seus próprios logs
CREATE POLICY audit_logs_user_policy ON audit_logs
FOR SELECT USING (user_id = auth.uid());

-- Política para audit_config: apenas admins
CREATE POLICY audit_config_admin_policy ON audit_config
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);
```

### 8. Script de Setup Completo

```sql
-- Script completo de setup do sistema de auditoria
-- Execute em ordem: 1_setup.sql, 2_triggers.sql, 3_security.sql

-- 1_setup.sql
\i 01_create_tables.sql
\i 02_create_indexes.sql
\i 03_create_functions.sql

-- 2_triggers.sql
\i 04_create_triggers.sql
\i 05_create_views.sql

-- 3_security.sql
\i 06_setup_rls.sql
\i 07_create_policies.sql

-- Verificar setup
SELECT 'Setup completo!' as status;
```

### 9. Script de Verificação

```sql
-- Verificar se o sistema de auditoria está funcionando
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Verificar tabelas
    SELECT COUNT(*) INTO test_count FROM information_schema.tables
    WHERE table_name IN ('audit_logs', 'audit_config');
    RAISE NOTICE 'Tabelas criadas: %', test_count;

    -- Verificar triggers
    SELECT COUNT(*) INTO test_count FROM information_schema.triggers
    WHERE trigger_name LIKE 'audit_%';
    RAISE NOTICE 'Triggers criados: %', test_count;

    -- Verificar funções
    SELECT COUNT(*) INTO test_count FROM information_schema.routines
    WHERE routine_name LIKE 'audit_%' OR routine_name IN ('set_audit_context', 'clear_audit_context');
    RAISE NOTICE 'Functions criadas: %', test_count;

    -- Verificar índices
    SELECT COUNT(*) INTO test_count FROM pg_indexes
    WHERE tablename = 'audit_logs' AND indexname LIKE 'idx_audit_%';
    RAISE NOTICE 'Índices criados: %', test_count;

    RAISE NOTICE 'Sistema de auditoria verificado com sucesso!';
END $$;
```

### 10. Script de Teste

```sql
-- Testar o sistema de auditoria
BEGIN;

-- Definir contexto de teste
SELECT set_audit_context(
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    'test@example.com',
    'test-session-123',
    'Test User Agent'
);

-- Inserir um registro de teste
INSERT INTO vehicles (plate, status, estimated_arrival_date)
VALUES ('TEST123', 'AGUARDANDO DEFINIÇÃO DE COLETA', CURRENT_DATE + INTERVAL '7 days');

-- Verificar se o log foi criado
SELECT COUNT(*) as logs_created
FROM audit_logs
WHERE table_name = 'vehicles'
  AND operation = 'INSERT'
  AND user_email = 'test@example.com';

-- Limpar contexto
SELECT clear_audit_context();

COMMIT;

-- Verificar logs criados
SELECT
    operation,
    table_name,
    user_email,
    created_at
FROM audit_logs
WHERE user_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 5;
```

---

**Esses scripts SQL estabelecem uma base sólida para o sistema de auditoria, com triggers automáticos, índices otimizados e segurança adequada.**</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/auditoria/implementacao/banco-dados.md
