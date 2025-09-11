# Implementação - Backend (Next.js)

## 📋 Middleware e Services de Auditoria

### 1. Middleware de Auditoria Global

```typescript
// middleware/audit.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/services/AuditService';
import { getCurrentUser } from '@/lib/auth';

export class AuditMiddleware {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async interceptRequest(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      // Obter usuário atual (se autenticado)
      const user = await getCurrentUser(request);
      userId = user?.id || null;
      userEmail = user?.email || null;

      // Definir contexto para triggers do banco
      if (userId) {
        await this.setDatabaseContext(request, user);
      }

      // Log da requisição
      await this.auditService.logAPIRequest({
        method,
        path,
        userId,
        userEmail,
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        sessionId: this.getSessionId(request),
        queryParams: Object.fromEntries(url.searchParams),
        timestamp: new Date()
      });

    } catch (error) {
      // Log de erro mas não falhar a requisição
      console.error('Erro no middleware de auditoria:', error);
    }

    // Continuar processamento normal
    const response = NextResponse.next();

    // Log da resposta (opcional, apenas para operações críticas)
    if (this.isCriticalOperation(path, method)) {
      response.headers.set('x-audit-id', `audit_${Date.now()}`);
    }

    return response;
  }

  private async setDatabaseContext(request: NextRequest, user: any) {
    // Definir variáveis de sessão no PostgreSQL
    const sessionId = this.getSessionId(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Usar RPC do Supabase para definir contexto
    await supabase.rpc('set_audit_context', {
      p_user_id: user.id,
      p_user_email: user.email,
      p_session_id: sessionId,
      p_user_agent: userAgent
    });
  }

  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded') ||
      request.headers.get('forwarded-for') ||
      request.headers.get('forwarded') ||
      'unknown'
    );
  }

  private getSessionId(request: NextRequest): string {
    // Extrair session ID do cookie ou header
    const sessionCookie = request.cookies.get('session-id');
    return sessionCookie?.value || `session_${Date.now()}_${Math.random()}`;
  }

  private isCriticalOperation(path: string, method: string): boolean {
    const criticalPaths = [
      '/api/admin/',
      '/api/vehicles/delete',
      '/api/profiles/delete'
    ];

    return criticalPaths.some(criticalPath => path.includes(criticalPath)) ||
           method === 'DELETE';
  }
}

// Middleware global
export async function auditMiddleware(request: NextRequest) {
  const audit = new AuditMiddleware();
  return audit.interceptRequest(request);
}
```

### 2. Service de Auditoria Principal

```typescript
// services/AuditService.ts
import { createClient } from '@supabase/supabase-js';

export interface AuditLogEntry {
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'API_REQUEST' | 'BUSINESS_OPERATION';
  table_name: string;
  record_id?: string;
  user_id?: string;
  user_email?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
  tags?: string[];
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export class AuditService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async logActivity(entry: AuditLogEntry): Promise<void> {
    try {
      const logEntry = {
        operation: entry.operation,
        table_name: entry.table_name,
        record_id: entry.record_id,
        user_id: entry.user_id,
        user_email: entry.user_email,
        old_values: entry.old_values ? JSON.stringify(entry.old_values) : null,
        new_values: entry.new_values ? JSON.stringify(entry.new_values) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        tags: entry.tags || [],
        severity: entry.severity || 'info',
        session_id: entry.session_id,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert(logEntry);

      if (error) {
        console.error('Erro ao registrar log de auditoria:', error);
        // Fallback: tentar novamente ou logar localmente
        await this.handleAuditError(error, logEntry);
      }
    } catch (error) {
      console.error('Erro crítico no serviço de auditoria:', error);
      await this.handleCriticalError(error, entry);
    }
  }

  async logAPIRequest(params: {
    method: string;
    path: string;
    userId?: string;
    userEmail?: string;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    queryParams?: any;
    responseTime?: number;
    statusCode?: number;
  }): Promise<void> {
    await this.logActivity({
      operation: 'API_REQUEST',
      table_name: 'api_requests',
      user_id: params.userId,
      user_email: params.userEmail,
      metadata: {
        method: params.method,
        path: params.path,
        queryParams: params.queryParams,
        responseTime: params.responseTime,
        statusCode: params.statusCode
      },
      tags: ['api', params.method.toLowerCase()],
      severity: params.statusCode && params.statusCode >= 400 ? 'warning' : 'info',
      session_id: params.sessionId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent
    });
  }

  async logBusinessOperation(
    operation: string,
    entity: string,
    entityId: string,
    userId: string,
    details: any
  ): Promise<void> {
    await this.logActivity({
      operation: 'BUSINESS_OPERATION',
      table_name: entity,
      record_id: entityId,
      user_id: userId,
      metadata: {
        business_operation: operation,
        ...details
      },
      tags: ['business', operation],
      severity: 'info'
    });
  }

  async logDataChange(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    tableName: string,
    recordId: string,
    userId: string,
    oldData?: any,
    newData?: any
  ): Promise<void> {
    await this.logActivity({
      operation,
      table_name: tableName,
      record_id: recordId,
      user_id: userId,
      old_values: oldData,
      new_values: newData,
      tags: ['data', operation.toLowerCase()],
      severity: operation === 'DELETE' ? 'warning' : 'info'
    });
  }

  private async handleAuditError(error: any, logEntry: any): Promise<void> {
    // Estratégia de fallback: salvar em arquivo local ou enviar para serviço externo
    console.error('Audit fallback - erro na base de dados:', error);

    // Poderia implementar:
    // 1. Salvar em arquivo local
    // 2. Enviar para serviço de logging externo
    // 3. Buffer para retentativa posterior
  }

  private async handleCriticalError(error: any, entry: AuditLogEntry): Promise<void> {
    // Para erros críticos, garantir que pelo menos um log seja criado
    console.error('Erro crítico de auditoria:', error);

    // Criar log de erro da própria auditoria
    try {
      await this.supabase.from('audit_logs').insert({
        operation: 'AUDIT_ERROR',
        table_name: 'audit_system',
        metadata: JSON.stringify({
          error: error.message,
          original_entry: entry,
          timestamp: new Date()
        }),
        tags: ['error', 'audit-system'],
        severity: 'error'
      });
    } catch (fallbackError) {
      // Último recurso: log no console
      console.error('FALHA CRÍTICA: Sistema de auditoria indisponível', {
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
}
```

### 3. Hook React para Auditoria

```typescript
// hooks/useAudit.ts
import { useCallback } from 'react';
import { AuditService } from '@/services/AuditService';
import { useAuth } from '@/hooks/useAuth';

export function useAudit() {
  const { user } = useAuth();
  const auditService = new AuditService();

  const logUserAction = useCallback(async (
    action: string,
    details?: any,
    severity: 'info' | 'warning' | 'error' = 'info'
  ) => {
    if (!user) return;

    try {
      await auditService.logActivity({
        operation: 'USER_ACTION',
        table_name: 'user_actions',
        user_id: user.id,
        user_email: user.email,
        metadata: {
          action,
          ...details,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date()
        },
        tags: ['ui', action],
        severity
      });
    } catch (error) {
      console.error('Erro ao logar ação do usuário:', error);
    }
  }, [user, auditService]);

  const logBusinessEvent = useCallback(async (
    event: string,
    entityId: string,
    data?: any
  ) => {
    if (!user) return;

    await auditService.logBusinessOperation(
      event,
      'business_events',
      entityId,
      user.id,
      data
    );
  }, [user, auditService]);

  const logError = useCallback(async (
    error: Error,
    context?: any
  ) => {
    if (!user) return;

    await auditService.logActivity({
      operation: 'ERROR',
      table_name: 'error_logs',
      user_id: user.id,
      user_email: user.email,
      metadata: {
        error: error.message,
        stack: error.stack,
        context,
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      tags: ['error', 'frontend'],
      severity: 'error'
    });
  }, [user, auditService]);

  return {
    logUserAction,
    logBusinessEvent,
    logError
  };
}
```

### 4. Decorator para Métodos de API

```typescript
// decorators/audit.ts
import { AuditService } from '@/services/AuditService';

export function AuditAPI(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const auditService = new AuditService();

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const request = args[0]; // NextRequest
      let result;
      let error;

      try {
        // Executar método original
        result = await method.apply(this, args);

        // Log de sucesso
        await auditService.logAPIRequest({
          method: request.method,
          path: request.url,
          userId: result?.userId,
          userEmail: result?.userEmail,
          ipAddress: 'extracted-from-request',
          userAgent: request.headers.get('user-agent') || '',
          sessionId: 'extracted-from-request',
          responseTime: Date.now() - startTime,
          statusCode: 200
        });

        return result;

      } catch (err) {
        error = err;

        // Log de erro
        await auditService.logAPIRequest({
          method: request.method,
          path: request.url,
          userId: 'unknown',
          ipAddress: 'extracted-from-request',
          userAgent: request.headers.get('user-agent') || '',
          sessionId: 'extracted-from-request',
          responseTime: Date.now() - startTime,
          statusCode: 500
        });

        throw err;
      }
    };

    return descriptor;
  };
}

// Uso em API routes
export class VehicleAPI {
  @AuditAPI('VEHICLE_UPDATE')
  static async updateVehicle(request: NextRequest, context: any) {
    // Lógica da API
    const data = await request.json();
    const result = await updateVehicleInDB(data);

    return {
      ...result,
      userId: context.user.id,
      userEmail: context.user.email
    };
  }
}
```

### 5. Context Provider para Auditoria

```typescript
// contexts/AuditContext.tsx
'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { AuditService } from '@/services/AuditService';
import { useAuth } from '@/hooks/useAuth';

interface AuditContextType {
  auditService: AuditService;
  logPageView: (page: string) => void;
  logUserInteraction: (action: string, details?: any) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const auditService = new AuditService();

  const logPageView = (page: string) => {
    if (!user) return;

    auditService.logActivity({
      operation: 'PAGE_VIEW',
      table_name: 'page_views',
      user_id: user.id,
      user_email: user.email,
      metadata: {
        page,
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      },
      tags: ['ui', 'navigation'],
      severity: 'info'
    });
  };

  const logUserInteraction = (action: string, details?: any) => {
    if (!user) return;

    auditService.logActivity({
      operation: 'USER_INTERACTION',
      table_name: 'user_interactions',
      user_id: user.id,
      user_email: user.email,
      metadata: {
        action,
        ...details,
        url: window.location.href,
        timestamp: new Date()
      },
      tags: ['ui', action],
      severity: 'info'
    });
  };

  // Log de navegação automática
  useEffect(() => {
    logPageView(window.location.pathname);

    const handleRouteChange = (url: string) => {
      logPageView(url);
    };

    // Adicionar listener para mudanças de rota
    window.addEventListener('popstate', () => handleRouteChange(window.location.pathname));

    return () => {
      window.removeEventListener('popstate', () => handleRouteChange(window.location.pathname));
    };
  }, [user]);

  const value = {
    auditService,
    logPageView,
    logUserInteraction
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditContext() {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAuditContext must be used within AuditProvider');
  }
  return context;
}
```

### 6. Utilitários de Auditoria

```typescript
// utils/auditHelpers.ts
export function sanitizeAuditData(data: any, sensitiveFields: string[] = []): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  // Remover campos sensíveis
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Sanitizar objetos aninhados
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeAuditData(sanitized[key], sensitiveFields);
    }
  });

  return sanitized;
}

export function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getAuditSeverity(
  operation: string,
  data?: any
): 'debug' | 'info' | 'warning' | 'error' | 'critical' {
  // Operações críticas
  if (['DELETE', 'ADMIN_DELETE', 'USER_BAN'].includes(operation)) {
    return 'warning';
  }

  // Operações com dados sensíveis
  if (data && (
    data.password ||
    data.ssn ||
    data.creditCard ||
    data.apiKey
  )) {
    return 'warning';
  }

  // Operações de erro
  if (operation.includes('ERROR') || operation.includes('FAIL')) {
    return 'error';
  }

  return 'info';
}

export function shouldAuditOperation(
  operation: string,
  tableName: string,
  config: AuditConfig
): boolean {
  // Verificar se tabela está habilitada
  if (!config.enabledTables.includes(tableName)) {
    return false;
  }

  // Verificar se operação está habilitada
  if (!config.enabledOperations.includes(operation)) {
    return false;
  }

  return true;
}
```

### 7. Configuração de Auditoria

```typescript
// config/audit.ts
export interface AuditConfig {
  enabled: boolean;
  enabledTables: string[];
  enabledOperations: string[];
  sensitiveFields: string[];
  retentionDays: number;
  batchSize: number;
  retryAttempts: number;
  enableFrontendLogging: boolean;
  enableAPILogging: boolean;
  enableDatabaseLogging: boolean;
}

export const auditConfig: AuditConfig = {
  enabled: process.env.AUDIT_ENABLED === 'true',
  enabledTables: [
    'vehicle_collections',
    'vehicles',
    'collection_history',
    'profiles',
    'audit_logs'
  ],
  enabledOperations: ['INSERT', 'UPDATE', 'DELETE', 'API_REQUEST', 'BUSINESS_OPERATION'],
  sensitiveFields: ['password', 'api_key', 'secret', 'token'],
  retentionDays: 2555, // ~7 anos
  batchSize: 100,
  retryAttempts: 3,
  enableFrontendLogging: process.env.NODE_ENV === 'production',
  enableAPILogging: true,
  enableDatabaseLogging: true
};

export default auditConfig;
```

---

**Esta implementação fornece uma base sólida para auditoria no backend, com middleware global, services especializados e hooks React para facilitar a integração.**</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/auditoria/implementacao/backend.md
