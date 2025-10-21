# Plano Detalhado de Refatoração - VehicleChecklistModal

## Visão Geral
O componente `VehicleChecklistModal` atualmente possui mais de 650 linhas e viola múltiplos princípios de desenvolvimento. Este plano visa refatorar o componente de forma gradual, mantendo todas as funcionalidades existentes enquanto melhora a manutenibilidade, testabilidade e aderência aos princípios SOLID, DRY, KISS e arquitetura modular.

## Responsabilidades Atuais Identificadas

### 1. Gerenciamento de Estado do Formulário
- Campos básicos (data, quilometragem, combustível, observações)
- Estado dos serviços necessários
- Validação de campos

### 2. Gerenciamento de Imagens
- Upload de novas imagens
- Carregamento de imagens existentes
- Geração de URLs assinadas
- Pré-visualização e remoção

### 3. Persistência de Dados
- Salvamento do checklist
- Finalização do checklist
- Carregamento de dados existentes

### 4. Validação e Regras de Negócio
- Validação de campos obrigatórios
- Regras de finalização
- Sanitização de dados

### 5. Renderização da UI
- Formulário completo
- Modal container
- Estados de loading/erro/sucesso

## Plano de Refatoração Gradual

### Fase 1: Extração de Lógica de Validação
**Objetivo:** Separar a lógica de validação em um hook reutilizável.

**Passos:**
1. Criar `useChecklistValidation.ts`
2. Extrair funções de validação:
   - `validateChecklistForm()` - validação completa do formulário
   - `validateDate()` - validação específica de data
   - `validateOdometer()` - validação de quilometragem
3. Retornar objeto com métodos de validação e mensagens de erro

**Benefícios:**
- Reutilização em outros componentes
- Testabilidade isolada
- Separação de responsabilidades

### Fase 2: Criação do Serviço de Checklist
**Objetivo:** Centralizar todas as operações de API relacionadas ao checklist.

**Passos:**
1. Criar `ChecklistService.ts` em `/modules/specialist/services/`
2. Métodos a extrair:
   - `saveChecklist(payload)` - salvar checklist
   - `finalizeChecklist(vehicleId)` - finalizar checklist
   - `loadChecklist(vehicleId)` - carregar dados existentes
   - `getServiceCategories()` - buscar categorias de serviço

**Estrutura do Serviço:**
```typescript
class ChecklistService {
  async save(payload: SaveChecklistPayload): Promise<void>
  async finalize(vehicleId: string): Promise<void>
  async load(vehicleId: string): Promise<ChecklistData>
  async getCategories(): Promise<ServiceCategory[]>
}
```

### Fase 3: Criação do Serviço de Imagens
**Objetivo:** Centralizar toda lógica relacionada ao gerenciamento de imagens.

**Passos:**
1. Criar `ImageService.ts` em `/modules/specialist/services/`
2. Métodos a extrair:
   - `uploadImages(files, userId, vehicleId)` - upload para storage
   - `generateSignedUrls(paths)` - gerar URLs assinadas
   - `deleteImages(paths)` - remover imagens (futuro)

**Integração:** Manter compatibilidade com o hook `useImageUploader` existente.

### Fase 4: Extração de Hooks de Submissão
**Objetivo:** Separar a lógica complexa de salvar e finalizar.

**Passos:**
1. Criar `useChecklistSubmission.ts`
   - Gerenciar estado de salvamento
   - Coordenar validação + upload + API call
   - Retornar função `handleSubmit` e estados

2. Criar `useChecklistFinalization.ts`
   - Lógica específica de finalização
   - Sequência: validar → salvar → finalizar
   - Retornar função `handleFinalize` e estados

**Diferença chave:** Submissão permite edições futuras, finalização torna read-only.

### Fase 5: Hook de Gerenciamento de Dados
**Objetivo:** Centralizar carregamento inicial e sincronização de dados.

**Passos:**
1. Criar `useChecklistData.ts`
2. Responsabilidades:
   - Carregar checklist existente ao abrir modal
   - Carregar categorias de serviço
   - Sincronizar dados do veículo
   - Gerenciar estado de carregamento

### Fase 6: Quebra em Componentes Menores
**Objetivo:** Aplicar composition pattern e reduzir complexidade visual.

**Componentes a criar:**

#### `VehicleChecklistHeader.tsx`
- Exibir informações do veículo
- Status de finalização
- Observações do cliente

#### `VehicleChecklistForm.tsx`
- Campos básicos (data, quilometragem, combustível)
- Campo de observações
- Seção de serviços necessários

#### `VehicleChecklistImageSection.tsx`
- Upload de imagens
- Galeria de pré-visualização
- Gerenciamento de imagens existentes

#### `VehicleChecklistActions.tsx`
- Botões de ação (salvar/finalizar)
- Estados de loading/erro/sucesso

### Fase 7: Refatoração do Componente Principal
**Objetivo:** Tornar o componente principal um coordinator/container.

**Estrutura final:**
```typescript
const VehicleChecklistModal: React.FC<Props> = (props) => {
  // Hooks para lógica de negócio
  const validation = useChecklistValidation();
  const submission = useChecklistSubmission();
  const finalization = useChecklistFinalization();
  const data = useChecklistData(props.vehicle);
  const images = useImageUploader();

  // Estado local mínimo (abrir/fechar modal)

  return (
    <Modal>
      <VehicleChecklistHeader {...headerProps} />
      <VehicleChecklistForm {...formProps} />
      <VehicleChecklistImageSection {...imageProps} />
      <VehicleChecklistActions {...actionsProps} />
    </Modal>
  );
};
```

## Ordem de Implementação Recomendada

### Semana 1: Fundamentos
1. **Dia 1-2:** Criar `ChecklistService` e `ImageService`
2. **Dia 3:** Criar `useChecklistValidation`
3. **Dia 4-5:** Testes dos serviços e hook de validação

### Semana 2: Hooks de Estado
1. **Dia 1-2:** Criar `useChecklistSubmission`
2. **Dia 3:** Criar `useChecklistFinalization`
3. **Dia 4-5:** Criar `useChecklistData`

### Semana 3: Componentes
1. **Dia 1-2:** Criar `VehicleChecklistHeader`
2. **Dia 3:** Criar `VehicleChecklistForm`
3. **Dia 4:** Criar `VehicleChecklistImageSection`
4. **Dia 5:** Criar `VehicleChecklistActions`

### Semana 4: Integração e Testes
1. **Dia 1-3:** Refatorar componente principal
2. **Dia 4:** Testes de integração
3. **Dia 5:** Ajustes finais e documentação

## Critérios de Aceitação

### Funcionalidades Preservadas
- [ ] Salvamento de checklist (draft)
- [ ] Finalização de checklist (read-only)
- [ ] Upload de imagens
- [ ] Carregamento de dados existentes
- [ ] Validações de formulário
- [ ] Estados de loading/erro/sucesso
- [ ] Filtros de serviços por tipo de veículo

### Qualidade de Código
- [ ] Componente principal < 100 linhas
- [ ] Cada hook < 50 linhas
- [ ] Cobertura de testes > 80%
- [ ] Zero violações de linting
- [ ] Documentação completa

### Performance
- [ ] Tempo de carregamento mantido
- [ ] Bundle size não aumentado significativamente
- [ ] Memoização adequada para re-renders

## Riscos e Mitigações

### Risco: Regressões funcionais
**Mitigação:** Testes de integração abrangentes + QA manual

### Risco: Performance degradation
**Mitigação:** Profiling antes/depois + otimização de re-renders

### Risco: Complexidade acidental
**Mitigação:** Code reviews frequentes + pareamento

## Métricas de Sucesso

- **Manutenibilidade:** Redução de 80% no tamanho do componente principal
- **Testabilidade:** Aumento de 300% na cobertura de testes
- **Reutilização:** Hooks reutilizáveis em outros contextos
- **Legibilidade:** Código auto-documentado com responsabilidades claras

## Considerações Finais

Esta refatoração segue os princípios estabelecidos:
- **SOLID:** Cada classe/hook tem responsabilidade única
- **DRY:** Eliminação completa de código duplicado
- **KISS:** Lógica simplificada e direta
- **Modular:** Componentes independentes e testáveis
- **Composition:** Páginas como containers compostos

O plano é conservador e gradual, permitindo rollback se necessário, enquanto estabelece foundations sólidas para futuras expansões.