# Estratégias de Teste - Sistema de Auditoria

## 📋 Estratégia de Testes Completa

### 1. Visão Geral dos Testes

O sistema de auditoria requer uma estratégia de testes abrangente que cubra:
- **Funcionalidade**: Triggers, logs e interface funcionam corretamente
- **Performance**: Impacto mínimo no sistema principal
- **Confiabilidade**: Captura consistente de operações
- **Segurança**: Controle adequado de acesso aos logs
- **Integridade**: Dados de auditoria não podem ser alterados

## 🧪 Tipos de Testes

### 1.1 Testes Unitários

#### Testes de Functions PostgreSQL
```sql
-- test_audit_functions.sql
-- Teste da function principal de auditoria

-- Setup de teste
CREATE TABLE test_audit_logs AS SELECT * FROM audit_logs WHERE 1=0;

-- Teste 1: Inserção básica
BEGIN;
  SELECT set_audit_context('test-user-id', 'test@example.com', 'test-session', 'test-agent');

  INSERT INTO vehicles (plate, status) VALUES ('TEST001', 'AGUARDANDO COLETA');

  -- Verificar se log foi criado
  SELECT COUNT(*) as logs_count FROM audit_logs
  WHERE table_name = 'vehicles' AND operation = 'INSERT';

  -- Cleanup
  DELETE FROM vehicles WHERE plate = 'TEST001';
  SELECT clear_audit_context();
COMMIT;

-- Teste 2: Exclusão de dados sensíveis
BEGIN;
  SELECT set_audit_context('test-user-id', 'test@example.com');

  INSERT INTO profiles (id, email, password_hash)
  VALUES (gen_random_uuid(), 'test@example.com', 'secret123');

  -- Verificar se password foi mascarado
  SELECT old_values->>'password_hash' as password_value
  FROM audit_logs WHERE table_name = 'profiles' AND operation = 'INSERT';

  -- Cleanup
  DELETE FROM profiles WHERE email = 'test@example.com';
COMMIT;
```

#### Testes de Services (Jest/TypeScript)
```typescript
// tests/unit/AuditService.test.ts
import { AuditService } from '@/services/AuditService';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
jest.mock('@supabase/supabase-js');

describe('AuditService', () => {
  let auditService: AuditService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null })
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    auditService = new AuditService();
  });

  describe('logActivity', () => {
    it('should log activity successfully', async () => {
      const logEntry = {
        operation: 'INSERT' as const,
        table_name: 'vehicles',
        record_id: '123',
        user_id: 'user-123',
        user_email: 'test@example.com'
      };

      await auditService.logActivity(logEntry);

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'INSERT',
          table_name: 'vehicles',
          record_id: '123'
        })
      );
    });

    it('should handle audit errors gracefully', async () => {
      mockSupabase.insert.mockResolvedValue({
        error: new Error('Database connection failed')
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await auditService.logActivity({
        operation: 'INSERT',
        table_name: 'vehicles',
        user_id: 'user-123'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Erro ao registrar log de auditoria:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('logBusinessOperation', () => {
    it('should log business operations with correct tags', async () => {
      await auditService.logBusinessOperation(
        'VEHICLE_COLLECTION_CREATED',
        'collection-123',
        'user-123',
        { vehicleCount: 5 }
      );

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'BUSINESS_OPERATION',
          table_name: 'business_events',
          record_id: 'collection-123',
          tags: ['business', 'VEHICLE_COLLECTION_CREATED']
        })
      );
    });
  });
});
```

### 1.2 Testes de Integração

#### Testes de Triggers
```typescript
// tests/integration/AuditTriggers.test.ts
describe('Audit Triggers Integration', () => {
  let testDb: any;

  beforeAll(async () => {
    // Conectar ao banco de teste
    testDb = createTestDatabase();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await testDb.cleanup();
  });

  describe('Vehicle Collection Triggers', () => {
    it('should create audit log on INSERT', async () => {
      const collectionData = {
        vehicle_id: 'vehicle-123',
        collection_date: new Date(),
        status: 'requested'
      };

      // Executar operação
      const result = await testDb
        .from('vehicle_collections')
        .insert(collectionData)
        .select()
        .single();

      // Verificar log de auditoria
      const auditLog = await testDb
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'vehicle_collections')
        .eq('operation', 'INSERT')
        .eq('record_id', result.id)
        .single();

      expect(auditLog).toBeTruthy();
      expect(auditLog.new_values).toEqual(
        expect.objectContaining(collectionData)
      );
    });

    it('should create audit log on UPDATE', async () => {
      // Criar registro
      const { data: collection } = await testDb
        .from('vehicle_collections')
        .insert({ status: 'requested' })
        .select()
        .single();

      // Atualizar registro
      await testDb
        .from('vehicle_collections')
        .update({ status: 'approved' })
        .eq('id', collection.id);

      // Verificar logs
      const { data: logs } = await testDb
        .from('audit_logs')
        .select('*')
        .eq('record_id', collection.id)
        .order('created_at', { ascending: true });

      expect(logs).toHaveLength(2); // INSERT + UPDATE
      expect(logs[1].operation).toBe('UPDATE');
      expect(logs[1].old_values.status).toBe('requested');
      expect(logs[1].new_values.status).toBe('approved');
    });
  });

  describe('Context Variables', () => {
    it('should capture user context in audit logs', async () => {
      // Simular contexto de usuário
      await testDb.rpc('set_audit_context', {
        p_user_id: 'user-123',
        p_user_email: 'test@example.com',
        p_session_id: 'session-456'
      });

      // Executar operação
      await testDb
        .from('vehicles')
        .insert({
          plate: 'TEST123',
          status: 'AGUARDANDO COLETA'
        });

      // Verificar contexto no log
      const { data: auditLog } = await testDb
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'vehicles')
        .eq('operation', 'INSERT')
        .single();

      expect(auditLog.user_id).toBe('user-123');
      expect(auditLog.user_email).toBe('test@example.com');
      expect(auditLog.session_id).toBe('session-456');
    });
  });
});
```

#### Testes de API com Auditoria
```typescript
// tests/integration/AuditAPI.test.ts
describe('Audit API Integration', () => {
  let testServer: any;
  let testUser: any;

  beforeAll(async () => {
    testServer = await createTestServer();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await testServer.cleanup();
  });

  describe('Vehicle Collection API', () => {
    it('should create audit log for collection creation', async () => {
      const collectionData = {
        vehicle_id: 'vehicle-123',
        collection_date: '2025-09-25',
        status: 'requested'
      };

      // Fazer requisição autenticada
      const response = await testServer
        .post('/api/admin/propose-collection-date')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(collectionData);

      expect(response.status).toBe(200);

      // Verificar log de auditoria
      const auditLogs = await testServer.getAuditLogs({
        table_name: 'vehicle_collections',
        operation: 'INSERT',
        user_id: testUser.id
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].new_values).toEqual(
        expect.objectContaining(collectionData)
      );
    });

    it('should log API errors', async () => {
      // Tentar operação inválida
      const response = await testServer
        .post('/api/admin/propose-collection-date')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);

      // Verificar log de erro
      const errorLogs = await testServer.getAuditLogs({
        operation: 'API_REQUEST',
        severity: 'error'
      });

      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Middleware Audit', () => {
    it('should capture request metadata', async () => {
      const response = await testServer
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${testUser.token}`)
        .set('User-Agent', 'Test Browser 1.0')
        .set('X-Forwarded-For', '192.168.1.100');

      // Verificar metadados capturados
      const apiLogs = await testServer.getAuditLogs({
        operation: 'API_REQUEST',
        table_name: 'api_requests'
      });

      const lastLog = apiLogs[apiLogs.length - 1];
      expect(lastLog.metadata.method).toBe('GET');
      expect(lastLog.metadata.path).toBe('/api/vehicles');
      expect(lastLog.ip_address).toBe('192.168.1.100');
      expect(lastLog.user_agent).toBe('Test Browser 1.0');
    });
  });
});
```

### 1.3 Testes de Performance

#### Teste de Carga de Auditoria
```typescript
// tests/performance/AuditLoad.test.ts
describe('Audit System Performance', () => {
  let testDb: any;
  const OPERATION_COUNT = 1000;

  beforeAll(async () => {
    testDb = createTestDatabase();
  });

  it('should handle high volume of audit logs', async () => {
    const startTime = Date.now();

    // Criar múltiplas operações simultâneas
    const operations = Array.from({ length: OPERATION_COUNT }, (_, i) => ({
      plate: `PERF${i.toString().padStart(3, '0')}`,
      status: 'AGUARDANDO COLETA'
    }));

    // Executar operações em paralelo
    await Promise.all(
      operations.map(op =>
        testDb.from('vehicles').insert(op)
      )
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verificar que todas as operações foram auditadas
    const { count: auditCount } = await testDb
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('table_name', 'vehicles')
      .eq('operation', 'INSERT');

    expect(auditCount).toBe(OPERATION_COUNT);

    // Verificar performance (deve ser < 10 segundos para 1000 operações)
    expect(duration).toBeLessThan(10000);

    // Calcular throughput
    const throughput = OPERATION_COUNT / (duration / 1000);
    console.log(`Throughput: ${throughput.toFixed(2)} operações/segundo`);
  });

  it('should not significantly impact main operations', async () => {
    // Medir tempo sem auditoria
    const startTimeWithoutAudit = Date.now();

    // Desabilitar auditoria temporariamente
    await testDb.rpc('update_audit_config', {
      table_name: 'vehicles',
      enabled: false
    });

    for (let i = 0; i < 100; i++) {
      await testDb
        .from('vehicles')
        .insert({
          plate: `NOAUDIT${i}`,
          status: 'AGUARDANDO COLETA'
        });
    }

    const timeWithoutAudit = Date.now() - startTimeWithoutAudit;

    // Reabilitar auditoria
    await testDb.rpc('update_audit_config', {
      table_name: 'vehicles',
      enabled: true
    });

    // Medir tempo com auditoria
    const startTimeWithAudit = Date.now();

    for (let i = 0; i < 100; i++) {
      await testDb
        .from('vehicles')
        .insert({
          plate: `WITHAUDIT${i}`,
          status: 'AGUARDANDO COLETA'
        });
    }

    const timeWithAudit = Date.now() - startTimeWithAudit;

    // Calcular overhead
    const overhead = ((timeWithAudit - timeWithoutAudit) / timeWithoutAudit) * 100;

    console.log(`Audit overhead: ${overhead.toFixed(2)}%`);

    // Overhead deve ser < 50%
    expect(overhead).toBeLessThan(50);
  });
});
```

#### Teste de Stress de Consultas
```typescript
// tests/performance/AuditQueryStress.test.ts
describe('Audit Query Performance', () => {
  let testDb: any;

  beforeAll(async () => {
    testDb = createTestDatabase();
    // Popular com dados de teste
    await populateAuditTestData(10000);
  });

  it('should handle complex queries efficiently', async () => {
    const queries = [
      {
        name: 'Filtro por usuário e data',
        query: () => testDb
          .from('audit_logs')
          .select('*')
          .eq('user_id', 'test-user')
          .gte('created_at', '2025-01-01')
          .order('created_at', { ascending: false })
      },
      {
        name: 'Filtro por operação e severidade',
        query: () => testDb
          .from('audit_logs')
          .select('*')
          .eq('operation', 'UPDATE')
          .eq('severity', 'warning')
      },
      {
        name: 'Busca por tags',
        query: () => testDb
          .from('audit_logs')
          .select('*')
          .contains('tags', ['api', 'error'])
      }
    ];

    for (const { name, query } of queries) {
      const startTime = Date.now();
      const { data, error } = await query();
      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();

      console.log(`${name}: ${duration}ms`);

      // Queries devem ser < 1000ms
      expect(duration).toBeLessThan(1000);
    }
  });

  it('should handle concurrent audit log insertions', async () => {
    const concurrentOperations = 50;
    const operationsPerBatch = 10;

    const batches = Array.from({ length: concurrentOperations }, () =>
      Array.from({ length: operationsPerBatch }, (_, i) => ({
        operation: 'INSERT',
        table_name: 'vehicles',
        record_id: `concurrent-${Date.now()}-${i}`,
        user_id: 'test-user'
      }))
    );

    const startTime = Date.now();

    // Executar batches em paralelo
    await Promise.all(
      batches.map(batch =>
        Promise.all(
          batch.map(log =>
            testDb.from('audit_logs').insert(log)
          )
        )
      )
    );

    const duration = Date.now() - startTime;
    const totalOperations = concurrentOperations * operationsPerBatch;

    console.log(`Concurrent audit logging: ${totalOperations} ops in ${duration}ms`);

    // Verificar que todas as operações foram registradas
    const { count } = await testDb
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', 'test-user');

    expect(count).toBeGreaterThanOrEqual(totalOperations);
  });
});
```

### 1.4 Testes de Segurança

#### Testes de Controle de Acesso
```typescript
// tests/security/AuditAccessControl.test.ts
describe('Audit Access Control', () => {
  let testServer: any;
  let adminUser: any;
  let regularUser: any;
  let auditorUser: any;

  beforeAll(async () => {
    testServer = await createTestServer();
    adminUser = await createTestUser({ role: 'admin' });
    regularUser = await createTestUser({ role: 'client' });
    auditorUser = await createTestUser({ role: 'auditor' });
  });

  describe('Audit Log Access', () => {
    it('should allow admin to view all audit logs', async () => {
      const response = await testServer
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow auditor to view all audit logs', async () => {
      const response = await testServer
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${auditorUser.token}`);

      expect(response.status).toBe(200);
    });

    it('should allow regular user to view only their own logs', async () => {
      const response = await testServer
        .get('/api/audit/my-logs')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(200);

      // Verificar que apenas logs do usuário são retornados
      const logs = response.body;
      const otherUsersLogs = logs.filter((log: any) =>
        log.user_id !== regularUser.id
      );

      expect(otherUsersLogs).toHaveLength(0);
    });

    it('should deny access to audit logs for unauthorized users', async () => {
      const response = await testServer
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Audit Log Integrity', () => {
    it('should prevent modification of audit logs', async () => {
      // Tentar modificar log de auditoria
      const response = await testServer
        .put('/api/admin/audit-logs/123')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ severity: 'modified' });

      expect(response.status).toBe(403);
    });

    it('should prevent deletion of audit logs', async () => {
      const response = await testServer
        .delete('/api/admin/audit-logs/123')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should mask sensitive fields in audit logs', async () => {
      // Criar usuário com dados sensíveis
      await testServer
        .post('/api/admin/create-user')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          email: 'sensitive@example.com',
          password: 'secret123',
          apiKey: 'sk-123456789'
        });

      // Verificar logs de auditoria
      const logs = await testServer.getAuditLogs({
        table_name: 'profiles',
        operation: 'INSERT'
      });

      const userLog = logs.find((log: any) =>
        log.new_values?.email === 'sensitive@example.com'
      );

      expect(userLog.new_values.password).toBe('[REDACTED]');
      expect(userLog.new_values.apiKey).toBe('[REDACTED]');
      expect(userLog.new_values.email).toBe('sensitive@example.com'); // Não sensível
    });
  });
});
```

### 1.5 Testes de Regressão

#### Testes Automatizados de Regressão
```typescript
// tests/regression/AuditRegression.test.ts
describe('Audit System Regression Tests', () => {
  let testDb: any;

  beforeAll(async () => {
    testDb = createTestDatabase();
  });

  describe('Core Functionality Regression', () => {
    it('should maintain audit trail integrity after schema changes', async () => {
      // Simular mudança de schema
      await testDb.query(`
        ALTER TABLE vehicles ADD COLUMN test_column VARCHAR(255);
      `);

      // Verificar que auditoria continua funcionando
      await testDb
        .from('vehicles')
        .insert({
          plate: 'REGRESSION001',
          status: 'AGUARDANDO COLETA',
          test_column: 'test_value'
        });

      const auditLog = await testDb
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'vehicles')
        .eq('operation', 'INSERT')
        .single();

      expect(auditLog).toBeTruthy();
      expect(auditLog.new_values.test_column).toBe('test_value');
    });

    it('should handle database restarts gracefully', async () => {
      // Simular restart do banco
      await testDb.restart();

      // Verificar que triggers ainda funcionam
      await testDb
        .from('vehicles')
        .insert({
          plate: 'AFTER_RESTART',
          status: 'AGUARDANDO COLETA'
        });

      const auditLogs = await testDb
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'vehicles')
        .eq('operation', 'INSERT');

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should maintain performance after multiple deployments', async () => {
      // Baseline de performance
      const baselineStart = Date.now();

      for (let i = 0; i < 100; i++) {
        await testDb
          .from('vehicles')
          .insert({
            plate: `PERF${i}`,
            status: 'AGUARDANDO COLETA'
          });
      }

      const baselineDuration = Date.now() - baselineStart;

      // Simular múltiplas implantações (recriar triggers)
      for (let deployment = 0; deployment < 5; deployment++) {
        await recreateAuditTriggers(testDb);
      }

      // Teste de performance após implantações
      const afterStart = Date.now();

      for (let i = 0; i < 100; i++) {
        await testDb
          .from('vehicles')
          .insert({
            plate: `AFTER${i}`,
            status: 'AGUARDANDO COLETA'
          });
      }

      const afterDuration = Date.now() - afterStart;

      // Performance deve se manter similar
      const performanceDegradation = ((afterDuration - baselineDuration) / baselineDuration) * 100;

      expect(performanceDegradation).toBeLessThan(20); // < 20% de degradação
    });
  });

  describe('Data Consistency Regression', () => {
    it('should maintain chronological order of audit logs', async () => {
      const operations = [
        { plate: 'CHRONO001', delay: 0 },
        { plate: 'CHRONO002', delay: 100 },
        { plate: 'CHRONO003', delay: 200 }
      ];

      // Executar operações com delays
      for (const op of operations) {
        await new Promise(resolve => setTimeout(resolve, op.delay));
        await testDb
          .from('vehicles')
          .insert({
            plate: op.plate,
            status: 'AGUARDANDO COLETA'
          });
      }

      // Verificar ordem cronológica
      const logs = await testDb
        .from('audit_logs')
        .select('record_id, created_at')
        .eq('table_name', 'vehicles')
        .eq('operation', 'INSERT')
        .in('record_id', operations.map(op => op.plate))
        .order('created_at', { ascending: true });

      // Ordem deve corresponder à execução
      expect(logs[0].record_id).toBe('CHRONO001');
      expect(logs[1].record_id).toBe('CHRONO002');
      expect(logs[2].record_id).toBe('CHRONO003');
    });

    it('should handle concurrent operations without data loss', async () => {
      const concurrentInserts = 10;
      const operations = Array.from({ length: concurrentInserts }, (_, i) => ({
        plate: `CONCURRENT${i.toString().padStart(3, '0')}`,
        status: 'AGUARDANDO COLETA'
      }));

      // Executar inserções simultâneas
      await Promise.all(
        operations.map(op =>
          testDb.from('vehicles').insert(op)
        )
      );

      // Verificar que todos os logs foram criados
      const { count } = await testDb
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('table_name', 'vehicles')
        .eq('operation', 'INSERT')
        .in('record_id', operations.map(op => op.plate));

      expect(count).toBe(concurrentInserts);
    });
  });
});
```

## 🧪 Estratégia de Execução de Testes

### 2.1 Pipeline de CI/CD

```yaml
# .github/workflows/audit-tests.yml
name: Audit System Tests

on:
  push:
    paths:
      - 'docs/auditoria/**'
      - 'src/services/AuditService.ts'
      - 'database/triggers/**'
  pull_request:
    paths:
      - 'docs/auditoria/**'
      - 'src/services/AuditService.ts'
      - 'database/triggers/**'

jobs:
  audit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          psql -h localhost -U postgres -d postgres -f database/setup-test.sql
          psql -h localhost -U postgres -d test_db -f docs/auditoria/scripts/setup-auditoria.sql

      - name: Run unit tests
        run: npm run test:unit -- --testPathPattern=audit

      - name: Run integration tests
        run: npm run test:integration -- --testPathPattern=audit

      - name: Run performance tests
        run: npm run test:performance -- --testPathPattern=audit

      - name: Run security tests
        run: npm run test:security -- --testPathPattern=audit

      - name: Generate test report
        run: npm run test:report
```

### 2.2 Métricas de Qualidade

#### Cobertura de Testes
- **Unitários**: > 90% de cobertura
- **Integração**: > 80% de cenários críticos
- **Performance**: Testes de carga automatizados
- **Segurança**: Testes de penetração incluídos

#### SLA de Testes
- **Tempo de execução**: < 10 minutos para suite completa
- **Flaky tests**: < 1% de taxa de falha intermitente
- **Tempo de feedback**: < 5 minutos para PRs

### 2.3 Ambiente de Testes

#### Configuração de Testes
```typescript
// tests/setup/testEnvironment.ts
export async function setupTestEnvironment() {
  // Criar banco de dados de teste
  const testDb = createTestDatabase();

  // Aplicar schema de auditoria
  await testDb.applySchema('docs/auditoria/scripts/setup-auditoria.sql');

  // Popular dados de teste
  await testDb.seedData({
    users: 10,
    vehicles: 50,
    collections: 20
  });

  return testDb;
}

export async function teardownTestEnvironment(testDb: any) {
  // Limpar dados de teste
  await testDb.cleanup();

  // Resetar triggers e configurações
  await testDb.resetAuditConfiguration();
}
```

---

**Esta estratégia de testes garante que o sistema de auditoria seja confiável, performático e seguro, com cobertura completa de cenários críticos e validação automatizada em CI/CD.**</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/auditoria/implementacao/frontend.md
