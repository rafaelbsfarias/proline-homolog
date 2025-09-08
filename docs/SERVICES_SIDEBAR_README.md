# Menu Lateral de Serviços - Documentação

## Visão Geral

O menu lateral da página `/dashboard/services` foi completamente redesenhado seguindo o padrão de **Composition Pattern**. Ele agora inclui:

1. **Campo de Pesquisa**: Permite buscar serviços por nome ou descrição
2. **Árvore de Categorias**: Estrutura expansível/colapsável organizada por categorias
3. **Seleção Visual**: Destaque visual para o serviço selecionado

## Componentes Criados

### 1. `ServicesSidebar` (Componente Principal)
- **Localização**: `/modules/partner/components/ServicesSidebar.tsx`
- **Responsabilidades**:
  - Gerenciar estado de pesquisa
  - Organizar serviços por categoria
  - Coordenar comunicação entre componentes filhos

### 2. `SearchInput` (Campo de Pesquisa)
- **Localização**: `/modules/partner/components/SearchInput.tsx`
- **Funcionalidades**:
  - Busca em tempo real
  - Placeholder customizável
  - Estilos consistentes com o design system

### 3. `CategoryTree` (Árvore de Categorias)
- **Localização**: `/modules/partner/components/CategoryTree.tsx`
- **Funcionalidades**:
  - Gerenciamento de estado de expansão/colapso
  - Organização automática por categoria
  - Tratamento de serviços sem categoria

### 4. `CategoryNode` (Nó de Categoria)
- **Localização**: `/modules/partner/components/CategoryNode.tsx`
- **Funcionalidades**:
  - Toggle de expansão/colapso
  - Contador de serviços por categoria
  - Hover states e transições suaves

### 5. `ServiceNode` (Nó de Serviço)
- **Localização**: `/modules/partner/components/ServiceNode.tsx`
- **Funcionalidades**:
  - Exibição de nome e preço do serviço
  - Estado de seleção visual
  - Indicador de status (bolinha verde)

## Como Usar

### Integração Básica

```tsx
import ServicesSidebar from '@/modules/partner/components/ServicesSidebar';

function MyPage() {
  const services = usePartnerServices();
  const [selectedServiceId, setSelectedServiceId] = useState();

  return (
    <ServicesSidebar
      services={services}
      onServiceSelect={(service) => setSelectedServiceId(service.id)}
      selectedServiceId={selectedServiceId}
    />
  );
}
```

### Personalização

```tsx
<ServicesSidebar
  services={services}
  onServiceSelect={handleServiceSelect}
  selectedServiceId={selectedServiceId}
  // Props adicionais podem ser passadas conforme necessário
/>
```

## Funcionalidades

### 🔍 Pesquisa
- Busca por nome do serviço
- Busca por descrição do serviço
- Resultados em tempo real
- Case-insensitive

### 📁 Organização por Categorias
- Serviços agrupados automaticamente por categoria
- Serviços sem categoria vão para "Sem Categoria"
- Contadores visuais de quantidade
- Expansão/colapso independente

### 🎯 Seleção Visual
- Destaque azul (#002e4c) para serviço selecionado
- Transições suaves
- Feedback visual imediato

## Design System

### Cores Utilizadas
- **Primária**: `#002e4c` (azul escuro)
- **Texto**: `#111827` (cinza escuro)
- **Texto Secundário**: `#6b7280` (cinza médio)
- **Fundo**: `#ffffff` (branco)
- **Hover**: `#f3f4f6` (cinza claro)

### Espaçamento
- **Padding Interno**: `24px` (lateral), `20px` (vertical)
- **Gaps**: `20px` entre seções
- **Margens**: `8px` entre nós

### Tipografia
- **Títulos**: `18px`, `600` (semibold)
- **Subtítulos**: `14px`, `500` (medium)
- **Corpo**: `13-14px`, `400-500` (normal-medium)

## Responsividade

- **Largura Fixa**: `280px` (menu lateral)
- **Altura**: `calc(100vh - 80px)` (viewport menos header)
- **Overflow**: Scroll automático quando necessário
- **Mobile**: Adaptável para telas menores

## Performance

- **Memoização**: Uso de `useMemo` para cálculos pesados
- **Renderização Condicional**: Componentes só renderizam quando necessário
- **Estado Otimizado**: Mínimas re-renderizações
- **Lazy Loading**: Componentes filhos carregados sob demanda

## Extensibilidade

O design modular permite facilmente:
- Adicionar novos tipos de filtros
- Implementar drag & drop
- Incluir ações contextuais
- Adicionar indicadores de status
- Integrar com sistemas de notificação

## Testabilidade

Cada componente é independente e testável:
- `SearchInput`: Teste de entrada e callbacks
- `CategoryTree`: Teste de organização e estado
- `CategoryNode`: Teste de toggle e contadores
- `ServiceNode`: Teste de seleção e exibição
- `ServicesSidebar`: Teste de integração geral
