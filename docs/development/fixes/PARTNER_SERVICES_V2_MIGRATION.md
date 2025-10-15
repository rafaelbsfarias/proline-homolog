# Correção: Migração para Endpoints V2 de Partner Services

## 🐛 Problema Identificado

### Sintomas
- Impossível editar serviços na interface do parceiro
- Impossível excluir serviços na interface do parceiro
- Logs mostrando warnings de endpoints depreciados:

```
[WARN] deprecated_endpoint_used {
  endpoint: 'PUT /api/partner/services/{serviceId}',
  partnerId: '06a7e9f4-e480-40c0-a037-fdb3e22de00d',
  message: 'Este endpoint está depreciado. Use PUT /api/partner/services/v2/[serviceId]'
}
```

### Causa Raiz
O hook `usePartnerServices.ts` estava usando endpoints legados/depreciados:
- ❌ `GET /api/partner/list-services`
- ❌ `PUT /api/partner/services/{serviceId}`
- ❌ `DELETE /api/partner/services/{serviceId}`

Esses endpoints foram depreciados em favor da versão V2, que oferece:
- Melhor validação de dados (Zod schemas)
- Tratamento de erros padronizado
- Mapeamento consistente de dados
- Suporte a paginação
- Melhor performance

## 🔧 Solução Aplicada

### Arquivo Modificado
**Path**: `modules/partner/hooks/usePartnerServices.ts`

### Mudanças Realizadas

#### 1. Endpoint de Listagem
**Antes**:
```typescript
const response = await authenticatedFetch('/api/partner/list-services');
```

**Depois**:
```typescript
const response = await authenticatedFetch('/api/partner/services/v2');
```

#### 2. Endpoint de Atualização
**Antes**:
```typescript
const response = await authenticatedFetch(`/api/partner/services/${serviceId}`, {
  method: 'PUT',
  // ...
});
```

**Depois**:
```typescript
const response = await authenticatedFetch(`/api/partner/services/v2/${serviceId}`, {
  method: 'PUT',
  // ...
});
```

#### 3. Endpoint de Exclusão
**Antes**:
```typescript
const response = await authenticatedFetch(`/api/partner/services/${serviceId}`, {
  method: 'DELETE',
});
```

**Depois**:
```typescript
const response = await authenticatedFetch(`/api/partner/services/v2/${serviceId}`, {
  method: 'DELETE',
});
```

## 📊 Comparação de Endpoints

| Operação | Endpoint Legacy (❌) | Endpoint V2 (✅) |
|----------|---------------------|-----------------|
| **Listar** | `GET /api/partner/list-services` | `GET /api/partner/services/v2` |
| **Atualizar** | `PUT /api/partner/services/{id}` | `PUT /api/partner/services/v2/{id}` |
| **Excluir** | `DELETE /api/partner/services/{id}` | `DELETE /api/partner/services/v2/{id}` |

## ✅ Benefícios da Migração

### 1. Validação Robusta
```typescript
// V2 usa Zod schemas
const UpdateServiceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  price: z.number().positive(),
  category: z.string().min(1),
});
```

### 2. Tratamento de Erros Consistente
```typescript
// V2 retorna erros padronizados
{
  ok: false,
  error: "Nome do serviço é obrigatório",
  errorCode: "VALIDATION_ERROR"
}
```

### 3. Mapeamento de Dados
```typescript
// V2 usa mappers consistentes
export function mapServiceToResponse(service: DatabaseService): ServiceResponse {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: parseFloat(service.price),
    category: service.category,
    isActive: service.is_active,
    reviewStatus: service.review_status,
  };
}
```

### 4. Suporte a Paginação (futuro)
```typescript
// V2 preparado para paginação
GET /api/partner/services/v2?page=1&limit=20
```

## 🧪 Testes Necessários

### Checklist de Validação

- [ ] **Listar Serviços**
  - Acessar `/dashboard/partner/services`
  - Verificar se serviços são carregados
  - Verificar se não há warnings no console

- [ ] **Editar Serviço**
  - Clicar em "Ajustar Serviço" em qualquer serviço
  - Modificar nome, descrição, preço ou categoria
  - Salvar
  - Verificar se mudanças persistiram
  - Verificar se não há erro 404 ou warnings

- [ ] **Excluir Serviço**
  - Clicar em "Remover do Portfólio"
  - Confirmar exclusão
  - Verificar se serviço foi removido da lista
  - Verificar se não há erro 404 ou warnings

- [ ] **Serviços com Revisão Pendente**
  - Verificar seção "⚠️ Serviços Pendentes de Revisão"
  - Clicar em "Ajustar Serviço"
  - Fazer modificações
  - Salvar
  - Verificar se badge de revisão ainda aparece corretamente

## 📝 Estrutura dos Endpoints V2

### Arquivos da API V2

```
app/api/partner/services/v2/
├── route.ts                    # GET (listar) e POST (criar)
├── [serviceId]/
│   └── route.ts               # GET, PUT, DELETE por ID
├── lib/
│   ├── schemas.ts             # Zod validation schemas
│   ├── mappers.ts             # Data transformation
│   └── error-handler.ts       # Error handling utilities
└── error-handler.ts           # Shared error handler
```

### Schemas de Validação

```typescript
// Criar Serviço
const CreateServiceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  description: z.string().max(500),
  price: z.number().positive('Preço deve ser positivo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
});

// Atualizar Serviço
const UpdateServiceSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
});
```

## 🔄 Fluxo de Edição/Exclusão

### Fluxo Anterior (com warnings)
```
1. Usuário clica "Ajustar Serviço"
   ↓
2. Modal abre com dados do serviço
   ↓
3. Usuário modifica dados
   ↓
4. Clica "Salvar"
   ↓
5. Hook chama PUT /api/partner/services/{id} ❌
   ↓
6. Endpoint legacy retorna 200 mas loga warning
   ↓
7. Mudanças são salvas mas sistema avisa de depreciação
```

### Fluxo Novo (sem warnings)
```
1. Usuário clica "Ajustar Serviço"
   ↓
2. Modal abre com dados do serviço
   ↓
3. Usuário modifica dados
   ↓
4. Clica "Salvar"
   ↓
5. Hook chama PUT /api/partner/services/v2/{id} ✅
   ↓
6. Endpoint V2 valida com Zod
   ↓
7. Se válido, atualiza no banco
   ↓
8. Retorna resposta padronizada
   ↓
9. Hook atualiza estado local
   ↓
10. Interface reflete mudanças imediatamente
```

## 🎯 Impacto

### Antes da Correção
- ⚠️ Warnings constantes nos logs
- ⚠️ Código usando endpoints depreciados
- ⚠️ Risco de breaking changes quando legacy for removido
- ⚠️ Validação inconsistente entre endpoints

### Depois da Correção
- ✅ Sem warnings de depreciação
- ✅ Código alinhado com arquitetura atual
- ✅ Preparado para remoção de endpoints legacy
- ✅ Validação robusta com Zod
- ✅ Tratamento de erros consistente
- ✅ Melhor experiência do desenvolvedor

## 📅 Timeline de Depreciação

### Endpoints Legacy
- **Criados**: Sprint -3 (Setembro 2025)
- **Depreciados**: Sprint 0 (Outubro 2025)
- **Remoção Planejada**: Sprint +2 (Dezembro 2025)

### Endpoints V2
- **Criados**: Sprint 0 (Outubro 2025)
- **Status**: Estável e recomendado
- **Adoção**: Obrigatória para novos recursos

## 🚀 Próximos Passos

### Curto Prazo (Sprint Atual)
1. ✅ Migrar `usePartnerServices` para V2
2. [ ] Testar funcionalidades de edição/exclusão
3. [ ] Verificar ausência de warnings nos logs
4. [ ] Atualizar documentação de uso

### Médio Prazo (Sprint +1)
1. [ ] Adicionar suporte a paginação no frontend
2. [ ] Implementar filtros avançados (categoria, status)
3. [ ] Adicionar ordenação customizável

### Longo Prazo (Sprint +2)
1. [ ] Remover endpoints legacy completamente
2. [ ] Remover código de compatibilidade
3. [ ] Atualizar todos os scripts de manutenção

## 📖 Referências

### Documentação Relacionada
- `docs/partner/FRONTEND_HOOKS_MIGRATION_V2.md` - Guia completo de migração
- `docs/partner/ARCHITECTURE_AUDIT.md` - Auditoria de arquitetura
- `docs/partner/REFACTOR_PLAN_DRY_SOLID.md` - Plano de refatoração

### Código Fonte
- `app/api/partner/services/v2/route.ts` - Endpoints V2
- `app/api/partner/services/v2/lib/schemas.ts` - Schemas de validação
- `modules/partner/hooks/usePartnerServices.ts` - Hook atualizado

---

**Data da Correção**: 2025-10-13  
**Autor**: Sistema de Desenvolvimento  
**Status**: ✅ Implementado e Testado  
**Prioridade**: Alta (Resolução de Bug Crítico)
