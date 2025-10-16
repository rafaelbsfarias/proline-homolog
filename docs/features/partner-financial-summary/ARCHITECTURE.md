# 🏗️ Arquitetura Técnica - Resumo Financeiro do Parceiro

**Data**: 16/10/2025
**Versão**: 1.0.0

---

## 📋 Visão Geral da Arquitetura

A feature de Resumo Financeiro do Parceiro segue uma arquitetura **modular e escalável**, aplicando os princípios SOLID, DRY e Clean Architecture para garantir manutenibilidade e testabilidade.

### Princípios Orientadores

#### Clean Architecture
```
┌─────────────────────────────────────────┐
│           🎨 Presentation Layer         │
│   (React Components, Hooks, Pages)     │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         🏢 Application Layer            │
│   (Use Cases, DTOs, Application Logic) │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           💾 Domain Layer               │
│   (Entities, Value Objects, Domain     │
│    Services, Business Rules)           │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         🔌 Infrastructure Layer         │
│   (Repositories, External APIs, DB)    │
└─────────────────────────────────────────┘
```

#### CQRS Pattern
- **Commands**: Operações que modificam estado (filtros, períodos)
- **Queries**: Operações que retornam dados (relatórios financeiros)

---

## 🏢 Application Layer

### Use Cases

#### GetFinancialSummaryUseCase
```typescript
interface GetFinancialSummaryUseCase {
  execute(request: GetFinancialSummaryRequest): Promise<FinancialSummaryResponse>
}

interface GetFinancialSummaryRequest {
  partnerId: string
  period: DateRange
  filters?: FinancialFilters
}

interface FinancialSummaryResponse {
  overview: FinancialOverview
  servicesBreakdown: ServiceBreakdown[]
  topClients: TopClient[]
  paymentsStatus: PaymentsStatus
  goals: GoalsProgress
}
```

#### GetPartnerFinancialReportUseCase
```typescript
interface GetPartnerFinancialReportUseCase {
  execute(request: GetPartnerFinancialReportRequest): Promise<FinancialReport>
}
```

### Application Services

#### FinancialCalculationService
Responsável por cálculos financeiros puros:
- Cálculo de percentuais e taxas
- Formatação de valores monetários
- Comparativos período anterior
- Projeções e metas

#### PeriodAnalysisService
Gerencia análise por períodos:
- Conversão de períodos em intervalos de data
- Validação de períodos
- Cálculo de crescimento interperiódico

### DTOs (Data Transfer Objects)

#### FinancialOverviewDTO
```typescript
interface FinancialOverviewDTO {
  totalRevenue: Money
  totalServices: number
  averageTicket: Money
  growthPercentage: Percentage
  periodComparison: PeriodComparison
}
```

#### ServiceBreakdownDTO
```typescript
interface ServiceBreakdownDTO {
  category: string
  revenue: Money
  servicesCount: number
  percentage: Percentage
  margin?: Percentage
}
```

---

## 💾 Domain Layer

### Entities

#### FinancialSummary
Entidade principal que representa o resumo financeiro:
```typescript
class FinancialSummary {
  private constructor(
    private readonly partnerId: PartnerId,
    private readonly period: DateRange,
    private readonly overview: FinancialOverview,
    private readonly servicesBreakdown: ServiceBreakdown[],
    private readonly topClients: TopClient[],
    private readonly paymentsStatus: PaymentsStatus,
    private readonly goals: GoalsProgress
  ) {}

  static create(props: FinancialSummaryProps): Result<FinancialSummary> {
    // Validações de negócio
    return Result.ok(new FinancialSummary(props))
  }

  // Métodos de negócio
  getTotalRevenue(): Money { /* ... */ }
  getGrowthRate(): Percentage { /* ... */ }
  isGoalAchieved(): boolean { /* ... */ }
}
```

#### Partner
Entidade do parceiro com métodos específicos para financeiro:
```typescript
class Partner {
  // ... outros métodos

  canAccessFinancialData(): boolean {
    return this.status === 'active' && this.hasAcceptedTerms()
  }

  getFinancialGoals(): FinancialGoals {
    return this.financialGoals
  }
}
```

### Value Objects

#### Money
```typescript
class Money {
  private constructor(private readonly amount: number, private readonly currency: string) {}

  static fromCents(cents: number): Money {
    return new Money(cents / 100, 'BRL')
  }

  add(other: Money): Money {
    this.validateCurrency(other)
    return new Money(this.amount + other.amount, this.currency)
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount)
  }
}
```

#### Percentage
```typescript
class Percentage {
  private constructor(private readonly value: number) {}

  static fromDecimal(decimal: number): Percentage {
    return new Percentage(decimal * 100)
  }

  format(): string {
    return `${this.value.toFixed(1)}%`
  }

  isPositive(): boolean {
    return this.value > 0
  }
}
```

#### DateRange
```typescript
class DateRange {
  constructor(private readonly start: Date, private readonly end: Date) {
    if (start > end) {
      throw new InvalidDateRangeError()
    }
  }

  static lastMonth(): DateRange {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return new DateRange(start, end)
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end
  }
}
```

### Domain Services

#### FinancialCalculationDomainService
Serviço de domínio para regras de negócio puras:
```typescript
class FinancialCalculationDomainService {
  calculateAverageTicket(totalRevenue: Money, servicesCount: number): Money {
    if (servicesCount === 0) return Money.zero()
    return totalRevenue.divide(servicesCount)
  }

  calculateGrowthRate(current: Money, previous: Money): Percentage {
    if (previous.isZero()) return Percentage.fromDecimal(0)
    const growth = (current.amount - previous.amount) / previous.amount
    return Percentage.fromDecimal(growth)
  }

  calculateServicePercentage(serviceRevenue: Money, totalRevenue: Money): Percentage {
    if (totalRevenue.isZero()) return Percentage.fromDecimal(0)
    return Percentage.fromDecimal(serviceRevenue.amount / totalRevenue.amount)
  }
}
```

#### PeriodAnalysisDomainService
```typescript
class PeriodAnalysisDomainService {
  getPeriodComparison(current: DateRange, previous: DateRange): PeriodComparison {
    // Lógica para comparar períodos
  }

  validatePeriodRange(range: DateRange): Result<void> {
    const maxDays = 365 // Máximo 1 ano
    const days = differenceInDays(range.end, range.start)

    if (days > maxDays) {
      return Result.fail(new PeriodTooLongError())
    }

    return Result.ok()
  }
}
```

### Repositories Interfaces

#### FinancialSummaryRepository
```typescript
interface FinancialSummaryRepository {
  getFinancialSummary(partnerId: PartnerId, period: DateRange): Promise<FinancialSummary>
  getServicesBreakdown(partnerId: PartnerId, period: DateRange): Promise<ServiceBreakdown[]>
  getTopClients(partnerId: PartnerId, period: DateRange, limit: number): Promise<TopClient[]>
  getPaymentsStatus(partnerId: PartnerId, period: DateRange): Promise<PaymentsStatus>
  getGoalsProgress(partnerId: PartnerId, period: DateRange): Promise<GoalsProgress>
}
```

#### PartnerFinancialRepository
```typescript
interface PartnerFinancialRepository {
  getPartnerFinancialReport(partnerId: PartnerId, period: DateRange): Promise<FinancialReport>
  getAllPartnersFinancialSummary(period: DateRange): Promise<PartnerFinancialSummary[]>
}
```

---

## 🔌 Infrastructure Layer

### Repository Implementations

#### PostgresFinancialSummaryRepository
Implementação concreta usando PostgreSQL:
```typescript
class PostgresFinancialSummaryRepository implements FinancialSummaryRepository {
  async getFinancialSummary(partnerId: PartnerId, period: DateRange): Promise<FinancialSummary> {
    const query = `
      SELECT
        SUM(q.total_value) as total_revenue,
        COUNT(q.id) as total_services,
        AVG(q.total_value) as average_ticket
      FROM quotes q
      WHERE q.partner_id = $1
        AND q.created_at BETWEEN $2 AND $3
        AND q.status = 'completed'
    `

    const result = await this.db.query(query, [partnerId.value, period.start, period.end])
    return this.mapToFinancialSummary(result.rows[0])
  }
}
```

### External APIs

#### PaymentGatewayAdapter
Adapter para integração com gateway de pagamentos:
```typescript
class PaymentGatewayAdapter implements PaymentStatusProvider {
  async getPaymentStatus(serviceId: ServiceId): Promise<PaymentStatus> {
    const response = await this.httpClient.get(`/payments/${serviceId.value}`)
    return this.mapToPaymentStatus(response.data)
  }
}
```

### Mappers

#### FinancialSummaryMapper
```typescript
class FinancialSummaryMapper {
  static toDTO(entity: FinancialSummary): FinancialSummaryDTO {
    return {
      overview: {
        totalRevenue: entity.getTotalRevenue().format(),
        totalServices: entity.getTotalServices(),
        averageTicket: entity.getAverageTicket().format(),
        growthPercentage: entity.getGrowthRate().format()
      },
      // ... outros mapeamentos
    }
  }
}
```

---

## 🎨 Presentation Layer

### Page Components

#### FinancialSummaryPage
Container principal que orquestra os componentes:
```typescript
const FinancialSummaryPage: React.FC = () => {
  const [period, setPeriod] = useState<DateRange>(DateRange.lastMonth())
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const { getFinancialSummary } = useFinancialSummary()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getFinancialSummary(period)
        setSummary(data)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [period, getFinancialSummary])

  return (
    <div className="financial-summary-page">
      <FinancialSummaryHeader
        period={period}
        onPeriodChange={setPeriod}
      />

      {loading ? (
        <FinancialSummarySkeleton />
      ) : (
        <div className="financial-summary-content">
          <FinancialMetricsCards overview={summary.overview} />
          <RevenueChart data={summary.revenueHistory} />
          <div className="financial-summary-grid">
            <ServicesBreakdown services={summary.servicesBreakdown} />
            <TopClientsList clients={summary.topClients} />
          </div>
          <PaymentsStatusCard status={summary.paymentsStatus} />
        </div>
      )}
    </div>
  )
}
```

### UI Components

#### FinancialMetricsCards
```typescript
const FinancialMetricsCards: React.FC<{ overview: FinancialOverview }> = ({ overview }) => {
  return (
    <div className="metrics-grid">
      <MetricCard
        title="Receita Total"
        value={overview.totalRevenue}
        icon="💰"
        trend={overview.growthPercentage}
      />
      <MetricCard
        title="Serviços Realizados"
        value={overview.totalServices}
        icon="🔧"
      />
      <MetricCard
        title="Ticket Médio"
        value={overview.averageTicket}
        icon="📊"
      />
    </div>
  )
}
```

### Custom Hooks

#### useFinancialSummary
```typescript
const useFinancialSummary = () => {
  const { get } = useAuthenticatedFetch()

  const getFinancialSummary = useCallback(async (period: DateRange) => {
    const params = new URLSearchParams({
      period: period.toQueryString()
    })

    const response = await get<FinancialSummaryDTO>(`/api/partner/financial-summary?${params}`)
    return FinancialSummaryMapper.fromDTO(response.data)
  }, [get])

  return { getFinancialSummary }
}
```

---

## 🔄 Fluxo de Dados

### Request Flow
```
1. User Action (Change Period)
2. FinancialSummaryPage (Container)
3. useFinancialSummary Hook
4. GetFinancialSummaryUseCase
5. FinancialSummaryRepository
6. Database Query
7. Domain Entities Creation
8. DTO Mapping
9. UI Update
```

### Data Flow Architecture
```
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│   React     │───▶│  Application    │───▶│   Domain     │
│ Components  │    │   Services      │    │   Services   │
└─────────────┘    └─────────────────┘    └──────────────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Hooks     │    │   Use Cases     │    │ Repositories │
└─────────────┘    └─────────────────┘    └──────────────┘
                                                       │
                                                       ▼
                                               ┌──────────────┐
                                               │  Database    │
                                               │   / APIs     │
                                               └──────────────┘
```

---

## 🧪 Estratégia de Testes

### Unit Tests
- **Domain Layer**: 100% cobertura (Value Objects, Entities, Domain Services)
- **Application Layer**: Use Cases e Application Services
- **Infrastructure Layer**: Repository implementations com mocks

### Integration Tests
- **API Endpoints**: Testes end-to-end das rotas
- **Database Operations**: Testes de repositório com banco real
- **External APIs**: Testes de integração com mocks

### E2E Tests
- **User Journeys**: Fluxos completos do usuário
- **Performance**: Testes de carga e performance
- **Cross-browser**: Compatibilidade de navegadores

### Test Examples

#### Domain Service Test
```typescript
describe('FinancialCalculationDomainService', () => {
  describe('calculateGrowthRate', () => {
    it('should calculate positive growth correctly', () => {
      const current = Money.fromCents(12000) // R$ 120,00
      const previous = Money.fromCents(10000) // R$ 100,00

      const result = service.calculateGrowthRate(current, previous)

      expect(result.format()).toBe('20.0%')
      expect(result.isPositive()).toBe(true)
    })
  })
})
```

#### Repository Test
```typescript
describe('PostgresFinancialSummaryRepository', () => {
  it('should return financial summary for given period', async () => {
    const partnerId = PartnerId.create('partner-123')
    const period = DateRange.lastMonth()

    const result = await repository.getFinancialSummary(partnerId, period)

    expect(result).toBeInstanceOf(FinancialSummary)
    expect(result.getTotalRevenue()).toBeInstanceOf(Money)
  })
})
```

---

## 📊 Monitoramento e Observabilidade

### Métricas de Performance
- **Response Time**: Tempo de resposta das APIs
- **Database Query Time**: Performance das consultas
- **Cache Hit Rate**: Efetividade do cache
- **Error Rate**: Taxa de erros por endpoint

### Logs Estruturados
```json
{
  "timestamp": "2025-10-16T10:30:00Z",
  "level": "INFO",
  "service": "financial-summary",
  "operation": "get-financial-summary",
  "partner_id": "partner-123",
  "period": "2025-09-01/2025-09-30",
  "duration_ms": 245,
  "cache_hit": true
}
```

### Alertas
- Response time > 3s
- Error rate > 5%
- Database connection issues
- Cache miss rate > 80%

---

## 🔒 Considerações de Segurança

### Autorização
- **Row Level Security**: Políticas RLS no banco de dados
- **Application Level**: Verificações em código de aplicação
- **API Level**: Middleware de autenticação e autorização

### Validação de Entrada
- **Input Sanitization**: Limpeza de dados de entrada
- **Type Validation**: Validação de tipos TypeScript
- **Business Rules**: Validações de regras de negócio

### Auditoria
- **Access Logs**: Registro de todos os acessos
- **Data Modification**: Logs de alterações sensíveis
- **Compliance**: Conformidade com LGPD

---

## 🚀 Estratégia de Deploy

### Blue-Green Deployment
- Deploy em ambiente paralelo
- Testes automatizados antes do switch
- Rollback automático em caso de falhas

### Feature Flags
- Ativação gradual da feature
- Controle por usuário/parceiro
- Possibilidade de rollback imediato

### Database Migrations
- Migrations versionadas e testadas
- Rollback scripts preparados
- Zero-downtime migrations quando possível

---

## 📈 Plano de Escalabilidade

### Database Optimization
- **Indexes**: Índices otimizados para consultas financeiras
- **Partitioning**: Particionamento por período/data
- **Caching**: Redis para dados frequentemente acessados

### API Optimization
- **Pagination**: Para listas grandes (top clients)
- **Compression**: Gzip para respostas
- **CDN**: Para assets estáticos

### Monitoring Scale
- **Metrics Aggregation**: Agregação de métricas em tempo real
- **Alert Thresholds**: Limiares dinâmicos baseados em uso
- **Auto-scaling**: Escalabilidade automática baseada em carga</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/features/partner-financial-summary/ARCHITECTURE.md