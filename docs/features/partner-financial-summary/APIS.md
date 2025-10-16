# 🔌 APIs - Resumo Financeiro do Parceiro

**Data**: 16/10/2025
**Versão**: 1.0.0

---

## 📋 Visão Geral das APIs

As APIs do Resumo Financeiro seguem os princípios RESTful e são projetadas para serem eficientes, seguras e escaláveis. Todas as endpoints implementam controle de acesso baseado em roles (partner/admin) e validação rigorosa de entrada.

### Princípios de Design

#### RESTful Design
- **Recursos**: Endpoints representam recursos financeiros
- **HTTP Methods**: Uso apropriado de GET, POST, etc.
- **Stateless**: Cada requisição é independente
- **Cacheable**: Headers apropriados para cache

#### Segurança First
- **Autenticação**: JWT tokens obrigatórios
- **Autorização**: Controle granular por role
- **Validação**: Sanitização e validação de entrada
- **Rate Limiting**: Proteção contra abuso

#### Performance
- **Paginação**: Para listas grandes
- **Compressão**: Gzip automático
- **Cache**: Headers ETag e Cache-Control
- **Otimizações**: Queries eficientes

---

## 👤 APIs do Parceiro

### GET /api/partner/financial-summary

Obtém o resumo financeiro consolidado do parceiro logado.

#### Parâmetros de Query
```typescript
{
  period?: 'last_month' | 'last_3_months' | 'last_year' | 'custom',
  start_date?: string, // YYYY-MM-DD (obrigatório se period=custom)
  end_date?: string,   // YYYY-MM-DD (obrigatório se period=custom)
  include_goals?: boolean // default: true
}
```

#### Exemplo de Request
```bash
GET /api/partner/financial-summary?period=last_month&include_goals=true
Authorization: Bearer <partner_jwt_token>
```

#### Resposta de Sucesso (200)
```typescript
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2025-09-01",
      "end_date": "2025-09-30",
      "label": "Setembro 2025",
      "days_count": 30
    },
    "metrics": {
      "total_revenue": {
        "amount": 45250.00,
        "formatted": "R$ 45.250,00",
        "currency": "BRL"
      },
      "total_quotes": 127,
      "average_quote_value": {
        "amount": 356.30,
        "formatted": "R$ 356,30",
        "currency": "BRL"
      },
      "parts": {
        "total_parts_requested": 89,
        "total_parts_value": {
          "amount": 12800.00,
          "formatted": "R$ 12.800,00",
          "currency": "BRL"
        }
      },
      "projected_value": {
        "pending_approval": {
          "amount": 15200.00,
          "formatted": "R$ 15.200,00",
          "currency": "BRL"
        },
        "in_execution": {
          "amount": 8750.00,
          "formatted": "R$ 8.750,00",
          "currency": "BRL"
        },
        "total_projected": {
          "amount": 23950.00,
          "formatted": "R$ 23.950,00",
          "currency": "BRL"
        }
      }
    },
    "metadata": {
      "generated_at": "2025-10-16T14:30:00Z",
      "data_freshness": "real-time",
      "calculation_method": "confirmed_quotes_only"
    }
  }
}
```

#### Respostas de Erro

##### 400 Bad Request - Parâmetros Inválidos
```typescript
{
  "success": false,
  "error": "Parâmetros inválidos",
  "details": {
    "period": "Período custom requer start_date e end_date",
    "start_date": "Data deve estar no formato YYYY-MM-DD"
  }
}
```

##### 401 Unauthorized - Não Autenticado
```typescript
{
  "success": false,
  "error": "Não autenticado",
  "message": "Token de autenticação obrigatório"
}
```

##### 403 Forbidden - Acesso Negado
```typescript
{
  "success": false,
  "error": "Acesso negado",
  "message": "Apenas parceiros podem acessar seus dados financeiros"
}
```

##### 422 Unprocessable Entity - Período Inválido
```typescript
{
  "success": false,
  "error": "Período inválido",
  "details": {
    "max_period_days": "Período máximo permitido é de 365 dias",
    "provided_days": 400
  }
}
```

### GET /api/partner/financial-summary/export

Exporta relatório financeiro em PDF ou Excel.

#### Parâmetros de Query
```typescript
{
  format: 'pdf' | 'excel', // obrigatório
  period?: 'last_month' | 'last_3_months' | 'last_year' | 'custom',
  start_date?: string,
  end_date?: string,
  include_charts?: boolean // default: true
}
```

#### Exemplo de Request
```bash
GET /api/partner/financial-summary/export?format=pdf&period=last_month
Authorization: Bearer <partner_jwt_token>
```

#### Resposta de Sucesso (200)
- **Content-Type**: `application/pdf` ou `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="relatorio-financeiro-setembro-2025.pdf"`
- **Body**: Arquivo binário do relatório

---

## 👑 APIs Administrativas

### GET /api/admin/partners/financial-summary

Obtém visão consolidada financeira de todos os parceiros (apenas administradores).

#### Parâmetros de Query
```typescript
{
  period?: 'last_month' | 'last_3_months' | 'last_year' | 'custom',
  start_date?: string,
  end_date?: string,
  partner_id?: string, // opcional - filtra parceiro específico
  region?: string,     // opcional - filtra por região
  sort_by?: 'revenue' | 'services' | 'growth' | 'name',
  sort_order?: 'asc' | 'desc',
  page?: number,       // default: 1
  limit?: number       // default: 50, max: 200
}
```

#### Exemplo de Request
```bash
GET /api/admin/partners/financial-summary?period=last_month&sort_by=revenue&sort_order=desc&page=1&limit=20
Authorization: Bearer <admin_jwt_token>
```

#### Resposta de Sucesso (200)
```typescript
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2025-09-01",
      "end_date": "2025-09-30",
      "label": "Setembro 2025"
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_previous": false
    },
    "network_overview": {
      "total_partners": 45,
      "active_partners": 38,
      "inactive_partners": 7,
      "total_revenue": {
        "amount": 1250000.00,
        "formatted": "R$ 1.250.000,00"
      },
      "average_partner_revenue": {
        "amount": 32894.74,
        "formatted": "R$ 32.894,74"
      },
      "total_quotes": 3456,
      "average_quotes_per_partner": 76.8
    },
    "partners_summary": [
      {
        "partner_id": "uuid-partner-1",
        "partner_name": "Oficina Silva",
        "partner_email": "contato@oficinasilva.com",
        "region": "São Paulo",
        "status": "active",
        "total_revenue": {
          "amount": 45250.00,
          "formatted": "R$ 45.250,00"
        },
        "total_quotes": 127,
        "average_quote_value": {
          "amount": 356.30,
          "formatted": "R$ 356,30"
        },
        "parts_requested": 89,
        "parts_value": {
          "amount": 12800.00,
          "formatted": "R$ 12.800,00"
        },
        "projected_value": {
          "amount": 23950.00,
          "formatted": "R$ 23.950,00"
        },
        "last_activity": "2025-09-28",
        "days_since_last_service": 2
      }
    ],
    "filters_applied": {
      "period": "last_month",
      "region": null,
      "sort_by": "revenue",
      "sort_order": "desc"
    },
    "metadata": {
      "generated_at": "2025-10-16T14:30:00Z",
      "data_freshness": "real-time",
      "calculation_method": "confirmed_quotes_only"
    }
  }
}
```

### GET /api/admin/partners/{partnerId}/financial-summary

Obtém resumo financeiro detalhado de um parceiro específico.

#### Parâmetros de Path
- `partnerId`: UUID do parceiro

#### Parâmetros de Query
- Mesmo que `/api/partner/financial-summary`

#### Exemplo de Request
```bash
GET /api/admin/partners/uuid-partner-1/financial-summary?period=last_3_months
Authorization: Bearer <admin_jwt_token>
```

#### Resposta de Sucesso (200)
- Mesmo formato que `/api/partner/financial-summary`, mas com dados do parceiro específico

### POST /api/admin/partners/{partnerId}/financial-goals

Define metas financeiras para um parceiro.

#### Parâmetros de Path
- `partnerId`: UUID do parceiro

#### Body
```typescript
{
  "monthly_target": 50000.00,
  "yearly_target": 600000.00,
  "effective_date": "2025-10-01", // opcional, default: hoje
  "notes": "Meta baseada na performance histórica" // opcional
}
```

#### Resposta de Sucesso (201)
```typescript
{
  "success": true,
  "data": {
    "goal_id": "uuid-goal-123",
    "partner_id": "uuid-partner-1",
    "monthly_target": {
      "amount": 50000.00,
      "formatted": "R$ 50.000,00"
    },
    "yearly_target": {
      "amount": 600000.00,
      "formatted": "R$ 600.000,00"
    },
    "effective_date": "2025-10-01",
    "created_by": "admin-uuid",
    "created_at": "2025-10-16T14:30:00Z"
  }
}
```

---

## 🔒 Segurança e Controle de Acesso

### Autenticação
- **JWT Tokens**: Obrigatórios em todos os endpoints
- **Token Validation**: Verificação de assinatura e expiração
- **Refresh Tokens**: Suporte para renovação automática

### Autorização
- **Role-Based Access Control (RBAC)**:
  - `partner`: Acesso apenas aos próprios dados
  - `admin`: Acesso a todos os dados de parceiros
- **Row Level Security (RLS)**: Políticas no banco de dados
- **Application-Level Checks**: Validações em código

### Rate Limiting
- **Parceiro**: 100 requests/minuto por endpoint
- **Admin**: 500 requests/minuto por endpoint
- **Headers**: `X-RateLimit-*` informativos

### Validação de Entrada
- **Sanitização**: Remoção de caracteres especiais
- **Type Validation**: Validação de tipos e formatos
- **Business Rules**: Validações de regras de negócio
- **SQL Injection Prevention**: Prepared statements

---

## 📊 Monitoramento e Analytics

### Métricas Coletadas
- **Response Times**: Tempo médio de resposta por endpoint
- **Error Rates**: Taxa de erro por endpoint e tipo
- **Usage Patterns**: Padrões de uso por usuário/tipo
- **Data Freshness**: Idade dos dados cacheados

### Logs Estruturados
```json
{
  "timestamp": "2025-10-16T14:30:00Z",
  "level": "INFO",
  "service": "financial-summary-api",
  "endpoint": "/api/partner/financial-summary",
  "method": "GET",
  "user_id": "partner-uuid-123",
  "user_role": "partner",
  "request_id": "req-abc-123",
  "duration_ms": 245,
  "status_code": 200,
  "query_params": {
    "period": "last_month"
  },
  "response_size_bytes": 2048,
  "cache_hit": true
}
```

### Alertas Automáticos
- Response time > 3s por 5 minutos consecutivos
- Error rate > 5% por endpoint
- Rate limit excedido > 10 vezes por hora
- Database query timeout

---

## 🚀 Estratégia de Cache

### Cache Levels

#### Application Cache (Redis)
- **TTL**: 5 minutos para dados financeiros
- **Invalidation**: Automática por mudanças nos dados
- **Keys**: `financial:partner:{partnerId}:{periodHash}`

#### HTTP Cache
- **ETag**: Baseado em hash dos dados
- **Cache-Control**: `private, max-age=300`
- **Conditional Requests**: Suporte a `If-None-Match`

### Cache Invalidation
- **Real-time**: Via WebSocket para mudanças críticas
- **Scheduled**: Limpeza periódica de cache stale
- **Manual**: Endpoint administrativo para invalidação

---

## 🧪 Testes de API

### Testes Unitários
```typescript
describe('GET /api/partner/financial-summary', () => {
  it('should return financial summary for authenticated partner', async () => {
    const response = await request(app)
      .get('/api/partner/financial-summary')
      .set('Authorization', `Bearer ${partnerToken}`)
      .query({ period: 'last_month' })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.overview).toBeDefined()
  })
})
```

### Testes de Integração
```typescript
describe('Financial Summary Integration', () => {
  it('should calculate correct totals from database', async () => {
    // Setup test data
    await createTestServices(partnerId, period)

    const response = await getFinancialSummary(partnerId, period)

    expect(response.overview.totalRevenue.amount).toBe(1000.00)
    expect(response.overview.totalServices).toBe(5)
  })
})
```

### Testes de Performance
```typescript
describe('Performance Tests', () => {
  it('should respond within 2 seconds under normal load', async () => {
    const start = Date.now()

    await request(app)
      .get('/api/partner/financial-summary')
      .set('Authorization', `Bearer ${partnerToken}`)

    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
  })
})
```

---

## 📚 Referências

- [API Design Guidelines](../../api/README.md)
- [Segurança](../../security/README.md)
- [Monitoramento](../../development/monitoring.md)
- [Testes de API](../../testing/api-tests.md)</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/features/partner-financial-summary/APIS.md