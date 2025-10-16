# 🎨 Componentes de UI - Resumo Financeiro do Parceiro

**Data**: 16/10/2025
**Versão**: 1.0.0

---

## 📋 Visão Geral dos Componentes

Os componentes de UI seguem o padrão de **Composition Pattern**, onde páginas principais atuam como containers que compõem componentes filhos especializados. Cada componente tem responsabilidade única e interfaces bem definidas.

### Princípios de Design

#### Composition Pattern
- **Containers**: Gerenciam estado e orquestram componentes filhos
- **Presentational Components**: Focados apenas em renderização
- **Props Interface**: Contratos claros entre componentes
- **Separation of Concerns**: Lógica separada de apresentação

#### Design System Consistency
- **Componentes Base**: Utilizar componentes existentes do design system
- **Estilos Consistentes**: Seguir padrões de cores, tipografia e espaçamento
- **Responsividade**: Componentes adaptáveis a diferentes tamanhos de tela
- **Acessibilidade**: Suporte a leitores de tela e navegação por teclado

#### Performance
- **Lazy Loading**: Componentes carregados sob demanda
- **Memoization**: Prevenção de re-renders desnecessários
- **Virtual Scrolling**: Para listas grandes
- **Code Splitting**: Divisão de bundles

---

## 🏗️ Estrutura de Componentes

```
modules/partner/components/financial-summary/
├── FinancialSummaryPage.tsx           # Container principal
├── FinancialSummaryHeader.tsx         # Cabeçalho com filtros de período
├── FinancialMetricsCards.tsx          # Cards de métricas principais
├── PartsInfoCard.tsx                  # Informações sobre peças
├── ProjectedValueCard.tsx             # Valores projetados
├── FinancialSummarySkeleton.tsx       # Loading states
├── types.ts                          # Tipos TypeScript
├── styles/
│   ├── FinancialSummaryPage.module.css
│   ├── FinancialMetricsCards.module.css
│   ├── PartsInfoCard.module.css
│   └── ...
└── __tests__/
    ├── FinancialSummaryPage.test.tsx
    ├── FinancialMetricsCards.test.tsx
    └── ...
```

---

## 📄 FinancialSummaryPage (Container)

Componente principal que orquestra toda a funcionalidade básica.

### Responsabilidades
- Gerenciamento do estado global da página
- Coordenação de filtros de período customizado
- Tratamento de estados de loading e erro
- Comunicação com hooks de dados
- Layout simples e direto

### Interface
```typescript
interface FinancialSummaryPageProps {
  className?: string
  initialPeriod?: DateRange
  showExportButton?: boolean
  onDataLoaded?: (data: FinancialSummary) => void
}
```

### Implementação
```tsx
const FinancialSummaryPage: React.FC<FinancialSummaryPageProps> = ({
  className,
  initialPeriod = DateRange.lastMonth(),
  showExportButton = false, // Simplificado - sem export na v1
  onDataLoaded
}) => {
  // Estado local simplificado
  const [period, setPeriod] = useState<DateRange>(initialPeriod)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hooks
  const { getFinancialSummary } = useFinancialSummary()

  // Efeitos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getFinancialSummary(period)
        setSummary(data)
        onDataLoaded?.(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [period, getFinancialSummary, onDataLoaded])

  // Handlers
  const handlePeriodChange = useCallback((newPeriod: DateRange) => {
    setPeriod(newPeriod)
  }, [])

  // Render
  if (error) {
    return (
      <div className={cn('financial-summary-error', className)}>
        <ErrorState
          message={error}
          onRetry={() => handlePeriodChange(period)}
        />
      </div>
    )
  }

  return (
    <div className={cn('financial-summary-page', className)}>
      <FinancialSummaryHeader
        period={period}
        onPeriodChange={handlePeriodChange}
        showExportButton={showExportButton}
      />

      {loading ? (
        <FinancialSummarySkeleton />
      ) : summary ? (
        <div className="financial-summary-content">
          <FinancialMetricsCards metrics={summary.metrics} />

          <div className="financial-summary-secondary-cards">
            <PartsInfoCard parts={summary.metrics.parts} />
            <ProjectedValueCard projected={summary.metrics.projected_value} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
```

---

## 🎯 FinancialMetricsCards

Exibe métricas principais em formato de cards.

### Interface
```typescript
interface FinancialMetricsCardsProps {
  metrics: {
    total_revenue: Money
    total_quotes: number
    average_quote_value: Money
  }
  className?: string
}
```

### Implementação
```tsx
const FinancialMetricsCards: React.FC<FinancialMetricsCardsProps> = ({
  metrics,
  className
}) => {
  const cards = useMemo(() => [
    {
      title: 'Receita Total',
      value: metrics.total_revenue.formatted,
      icon: '💰',
      subtitle: 'Valor faturado no período'
    },
    {
      title: 'Orçamentos Realizados',
      value: metrics.total_quotes.toLocaleString('pt-BR'),
      icon: '�',
      subtitle: 'Total de orçamentos'
    },
    {
      title: 'Valor Médio',
      value: metrics.average_quote_value.formatted,
      icon: '📊',
      subtitle: 'Média por orçamento'
    }
  ], [metrics])

  return (
    <div className={cn('metrics-cards-grid', className)}>
      {cards.map((card, index) => (
        <MetricCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          subtitle={card.subtitle}
        />
      ))}
    </div>
  )
}
```

### MetricCard (Componente Base)
```tsx
interface MetricCardProps {
  title: string
  value: string
  icon: string
  trend?: {
    value: number
    formatted: string
    isPositive: boolean
  }
  subtitle?: string
  className?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  className
}) => {
  return (
    <div className={cn('metric-card', className)}>
      <div className="metric-card-header">
        <span className="metric-card-icon">{icon}</span>
        {trend && (
          <span className={cn('metric-card-trend', {
            'metric-card-trend--positive': trend.isPositive,
            'metric-card-trend--negative': !trend.isPositive
          })}>
            {trend.formatted}
          </span>
        )}
      </div>

      <div className="metric-card-content">
        <h3 className="metric-card-value">{value}</h3>
        <p className="metric-card-title">{title}</p>
        {subtitle && (
          <p className="metric-card-subtitle">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
```

---

## � PartsInfoCard

Exibe informações sobre peças solicitadas nos orçamentos.

### Interface
```typescript
interface PartsInfoCardProps {
  parts: {
    total_parts_requested: number
    total_parts_value: Money
  }
  className?: string
}
```

### Implementação
```tsx
const PartsInfoCard: React.FC<PartsInfoCardProps> = ({
  parts,
  className
}) => {
  return (
    <div className={cn('parts-info-card', className)}>
      <div className="parts-info-header">
        <h3>Informações de Peças</h3>
      </div>

      <div className="parts-info-content">
        <div className="parts-info-metric">
          <span className="parts-info-label">Peças Solicitadas</span>
          <span className="parts-info-value">
            {parts.total_parts_requested.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="parts-info-metric">
          <span className="parts-info-label">Valor Total</span>
          <span className="parts-info-value">
            {parts.total_parts_value.formatted}
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## � ProjectedValueCard

Exibe valores projetados de orçamentos pendentes e em execução.

### Interface
```typescript
interface ProjectedValueCardProps {
  projected: {
    pending_approval: Money
    in_execution: Money
    total_projected: Money
  }
  className?: string
}
```

### Implementação
```tsx
const ProjectedValueCard: React.FC<ProjectedValueCardProps> = ({
  projected,
  className
}) => {
  return (
    <div className={cn('projected-value-card', className)}>
      <div className="projected-value-header">
        <h3>Valor Projetado</h3>
      </div>

      <div className="projected-value-content">
        <div className="projected-value-metric">
          <span className="projected-value-label">Pendente Aprovação</span>
          <span className="projected-value-value">
            {projected.pending_approval.formatted}
          </span>
        </div>

        <div className="projected-value-metric">
          <span className="projected-value-label">Em Execução</span>
          <span className="projected-value-value">
            {projected.in_execution.formatted}
          </span>
        </div>

        <div className="projected-value-total">
          <span className="projected-value-total-label">Total Projetado</span>
          <span className="projected-value-total-value">
            {projected.total_projected.formatted}
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔄 FinancialSummarySkeleton

Estados de loading para melhor UX.

### Implementação
```tsx
const FinancialSummarySkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('financial-summary-skeleton', className)}>
      <div className="skeleton-header">
        <Skeleton width={200} height={32} />
        <Skeleton width={150} height={24} />
      </div>

      <div className="skeleton-metrics">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-metric-card">
            <Skeleton width={40} height={40} circle />
            <Skeleton width={100} height={24} />
            <Skeleton width={80} height={32} />
          </div>
        ))}
      </div>

      <div className="skeleton-main-content">
        <div className="skeleton-chart">
          <Skeleton width="100%" height={300} />
        </div>

        <div className="skeleton-sidebar">
          <Skeleton width="100%" height={200} />
          <Skeleton width="100%" height={150} />
        </div>
      </div>

      <div className="skeleton-footer">
        <Skeleton width="100%" height={120} />
      </div>
    </div>
  )
}
```

---

## 🎨 Sistema de Estilos

### Arquitetura CSS
- **CSS Modules**: Escopo isolado por componente
- **Variáveis CSS**: Consistência de cores e espaçamento
- **BEM Methodology**: Nomenclatura consistente
- **Responsive Design**: Breakpoints móveis e desktop

### Exemplo de CSS Module
```css
/* FinancialSummaryPage.module.css */
.page {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.content {
  display: grid;
  gap: var(--spacing-lg);
}

.mainGrid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .mainGrid {
    grid-template-columns: 1fr;
  }
}
```

### Variáveis CSS Globais
```css
/* globals.css */
:root {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 🧪 Estratégia de Testes

### Testes Unitários
```tsx
describe('FinancialMetricsCards', () => {
  it('should render all metrics correctly', () => {
    const overview = createMockOverview()
    render(<FinancialMetricsCards overview={overview} />)

    expect(screen.getByText('R$ 45.250,00')).toBeInTheDocument()
    expect(screen.getByText('127')).toBeInTheDocument()
    expect(screen.getByText('R$ 356,30')).toBeInTheDocument()
  })

  it('should show growth indicators when enabled', () => {
    const overview = createMockOverview()
    render(<FinancialMetricsCards overview={overview} showGrowthIndicators />)

    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })
})
```

### Testes de Integração
```tsx
describe('FinancialSummaryPage Integration', () => {
  it('should load and display data correctly', async () => {
    const mockData = createMockFinancialSummary()
    mockGetFinancialSummary.mockResolvedValue(mockData)

    render(<FinancialSummaryPage />)

    await waitFor(() => {
      expect(screen.getByText('R$ 45.250,00')).toBeInTheDocument()
    })

    expect(mockGetFinancialSummary).toHaveBeenCalledWith(DateRange.lastMonth())
  })
})
```

### Testes de Acessibilidade
```tsx
describe('Accessibility', () => {
  it('should be keyboard navigable', async () => {
    const { container } = render(<FinancialSummaryPage />)

    const result = await axe(container)
    expect(result.violations).toHaveLength(0)
  })

  it('should have proper ARIA labels', () => {
    render(<RevenueChart data={mockData} />)

    expect(screen.getByRole('img', { name: /evolução da receita/i }))
      .toBeInTheDocument()
  })
})
```

---

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Layout Adaptativo
```css
/* Mobile First */
.metricsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

@media (min-width: 768px) {
  .metricsGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .metricsGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Componentes Touch-Friendly
- Botões com tamanho mínimo de 44px
- Espaçamento adequado entre elementos clicáveis
- Feedback visual para interações touch

---

## 🚀 Performance

### Otimizações Implementadas
- **React.memo**: Prevenção de re-renders desnecessários
- **useMemo**: Cache de cálculos pesados
- **useCallback**: Estabilidade de referências de função
- **Lazy Loading**: Componentes carregados sob demanda
- **Virtual Scrolling**: Para listas grandes

### Bundle Splitting
```typescript
// Dynamic imports para componentes pesados
const RevenueChart = lazy(() => import('./RevenueChart'))
const TopClientsList = lazy(() => import('./TopClientsList'))
```

### Image Optimization
- **WebP**: Formato otimizado para gráficos
- **Lazy Loading**: Imagens carregadas apenas quando visíveis
- **Compression**: Imagens comprimidas automaticamente

---

## 🎯 Próximos Passos

### Melhorias Planejadas
- [ ] Implementação de gráficos interativos avançados
- [ ] Suporte a temas dark/light
- [ ] Funcionalidade de drill-down nos dados
- [ ] Exportação para múltiplos formatos
- [ ] Notificações em tempo real
- [ ] Comparação entre períodos customizados
- [ ] Filtros avançados por categoria/região
- [ ] Dashboards personalizáveis pelo usuário</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/features/partner-financial-summary/UI_COMPONENTS.md