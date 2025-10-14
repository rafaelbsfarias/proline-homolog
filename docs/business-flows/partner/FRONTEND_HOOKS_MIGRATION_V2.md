# Migração de Hooks do Frontend para Endpoints V2

## 📋 Contexto

Os endpoints legacy de Partner Services (`/api/partner/services`, `/api/partner/list-services`) foram **depreciados** e serão removidos em **Sprint +2 (dezembro 2025)**. Este documento guia a migração dos hooks do frontend para os novos endpoints V2.

## 🎯 Objetivos da Migração

### Benefícios Técnicos
- ✅ **Arquitetura DDD:** Endpoints V2 seguem Domain-Driven Design
- ✅ **Error Handling Padronizado:** Respostas consistentes com códigos de erro tipados
- ✅ **Validação Robusta:** Zod schemas para validação de entrada/saída
- ✅ **Type Safety:** TypeScript strict mode com tipos de domínio
- ✅ **Paginação:** Suporte nativo a paginação de resultados
- ✅ **Performance:** Application Service com caching e otimizações

### Benefícios de Negócio
- 🚀 **Melhor UX:** Mensagens de erro mais claras
- 🛡️ **Segurança:** Validação em múltiplas camadas
- 📈 **Escalabilidade:** Preparado para crescimento
- 🔧 **Manutenibilidade:** Código mais limpo e testável

---

## 📊 Mapeamento de Endpoints

### Legacy vs V2

| Operação | Legacy (DEPRECATED) | V2 (CURRENT) | Breaking Changes |
|----------|---------------------|--------------|------------------|
| **Listar Serviços** | `GET /api/partner/list-services` | `GET /api/partner/services/v2?page=1&limit=20` | ✅ Paginação obrigatória |
| **Criar Serviço** | `POST /api/partner/services` | `POST /api/partner/services/v2` | ⚠️ Schema de validação mais estrito |
| **Atualizar Serviço** | `PUT /api/partner/services/:id` | `PUT /api/partner/services/v2/:id` | ⚠️ Campos opcionais (PATCH-like) |
| **Deletar Serviço** | `DELETE /api/partner/services/:id` | `DELETE /api/partner/services/v2/:id` | ✅ Sem mudanças |
| **Buscar por ID** | ❌ Não existia | `GET /api/partner/services/v2/:id` | ✨ Nova funcionalidade |

---

## 🔀 Mudanças de Contrato

### 1. Listar Serviços (GET)

#### Legacy Response
```typescript
// GET /api/partner/list-services
{
  "data": [
    {
      "id": "uuid",
      "name": "Troca de Óleo",
      "description": "Troca de óleo e filtro",
      "price": 150.0,
      "category": "manutenção"
    }
  ]
}
```

#### V2 Response (Paginado)
```typescript
// GET /api/partner/services/v2?page=1&limit=20
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "partnerId": "uuid",
        "name": "Troca de Óleo",
        "price": 150.0,
        "description": "Troca de óleo e filtro",
        "isActive": true,
        "createdAt": "2025-10-09T00:00:00Z",
        "updatedAt": "2025-10-09T00:00:00Z"
      }
    ],
    "total": 45,      // ✨ Novo: total de itens
    "page": 1,        // ✨ Novo: página atual
    "limit": 20,      // ✨ Novo: itens por página
    "totalPages": 3   // ✨ Novo: total de páginas
  }
}
```

**Mudanças:**
- ✅ `data` → `data.items` (paginação)
- ⚠️ `category` foi **removido** (campo descontinuado)
- ✨ Novos campos: `partnerId`, `isActive`, timestamps
- ✨ Metadados de paginação: `total`, `page`, `limit`, `totalPages`

---

### 2. Criar Serviço (POST)

#### Legacy Request
```typescript
// POST /api/partner/services
{
  "name": "Troca de Óleo",
  "description": "Troca de óleo e filtro",
  "price": 150.0,
  "category": "manutenção"  // ⚠️ Será ignorado
}
```

#### V2 Request
```typescript
// POST /api/partner/services/v2
{
  "name": "Troca de Óleo",
  "description": "Troca de óleo e filtro",
  "price": 150.0
  // category removido
}
```

**Validações V2 (Zod Schema):**
```typescript
name: {
  - Obrigatório ✅
  - Min: 1 caractere
  - Max: 100 caracteres
  - Trim automático
}

description: {
  - Obrigatório ✅
  - Min: 1 caractere
  - Max: 500 caracteres
  - Trim automático
}

price: {
  - Obrigatório ✅
  - Deve ser positivo (> 0)
  - Max: 999,999.99
  - Precisão: 2 casas decimais
}
```

#### V2 Response (Sucesso)
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "partnerId": "uuid",
    "name": "Troca de Óleo",
    "price": 150.0,
    "description": "Troca de óleo e filtro",
    "isActive": true,
    "createdAt": "2025-10-09T00:00:00Z",
    "updatedAt": "2025-10-09T00:00:00Z"
  }
}
```

---

### 3. Atualizar Serviço (PUT)

#### Legacy Request (Full Update)
```typescript
// PUT /api/partner/services/:id
{
  "name": "Troca de Óleo Premium",     // Todos campos obrigatórios
  "description": "Óleo sintético",
  "price": 250.0,
  "category": "premium"
}
```

#### V2 Request (Partial Update)
```typescript
// PUT /api/partner/services/v2/:id
{
  "price": 250.0  // ✨ Apenas campos que mudaram (PATCH-like)
}

// Ou atualizar múltiplos campos
{
  "name": "Troca de Óleo Premium",
  "price": 250.0
}
```

**Diferenças Importantes:**
- ✅ **Legacy:** PUT tradicional (todos campos obrigatórios)
- ✨ **V2:** PUT com semântica PATCH (campos opcionais)
- ⚠️ Campos não enviados = **mantêm valor atual**
- ❌ `category` não existe mais

---

### 4. Deletar Serviço (DELETE)

#### Sem mudanças de contrato
```typescript
// Legacy: DELETE /api/partner/services/:id
// V2:     DELETE /api/partner/services/v2/:id

// Response (ambos):
{
  "success": true,
  "data": null
}
```

---

## 🎨 Error Handling

### Legacy Error Response (Inconsistente)
```typescript
// Formato varia por endpoint
{
  "error": "Serviço não encontrado"
}
// ou
{
  "message": "Validation failed",
  "errors": [...]
}
```

### V2 Error Response (Padronizado)
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",  // ✨ Código tipado
    "message": "Dados inválidos",
    "details": [                  // ✨ Detalhes estruturados
      {
        "field": "price",
        "message": "Preço deve ser maior que 0"
      }
    ]
  }
}
```

### Códigos de Erro V2

| Código HTTP | Error Code | Descrição | Quando Ocorre |
|-------------|-----------|-----------|---------------|
| **400** | `VALIDATION_ERROR` | Dados de entrada inválidos | Schema Zod falhou |
| **401** | `UNAUTHORIZED_ERROR` | Token ausente/inválido | Middleware de auth |
| **403** | `FORBIDDEN_ERROR` | Sem permissão para recurso | Tentou acessar serviço de outro partner |
| **404** | `NOT_FOUND_ERROR` | Serviço não encontrado | ID não existe no banco |
| **409** | `CONFLICT_ERROR` | Conflito de dados | Nome duplicado (futura validação) |
| **500** | `DATABASE_ERROR` | Erro de banco de dados | Supabase falhou |
| **500** | `UNKNOWN_ERROR` | Erro não mapeado | Catch genérico |

---

## 🔧 Migração de Hooks

### Hook Atual: `usePartnerServices.ts`

#### Localização
```
modules/partner/hooks/usePartnerServices.ts
```

#### Estado Atual (Legacy)
```typescript
export function usePartnerServices() {
  const [services, setServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    const response = await authenticatedFetch('/api/partner/list-services'); // ❌ Legacy
    if (response.data) {
      setServices(response.data as PartnerService[]); // ❌ Sem paginação
    }
  }, [authenticatedFetch]);

  const updateService = useCallback(async (serviceId: string, data: UpdateServiceData) => {
    const response = await authenticatedFetch(`/api/partner/services/${serviceId}`, { // ❌ Legacy
      method: 'PUT',
      body: JSON.stringify(data),
    });
    // ...
  }, [authenticatedFetch]);

  const deleteService = useCallback(async (serviceId: string) => {
    const response = await authenticatedFetch(`/api/partner/services/${serviceId}`, { // ❌ Legacy
      method: 'DELETE',
    });
    // ...
  }, [authenticatedFetch]);

  return { services, loading, error, reloadServices: fetchServices, updateService, deleteService };
}
```

---

### Hook Migrado: `usePartnerServicesV2.ts`

#### Nova Estrutura
```typescript
// modules/partner/hooks/usePartnerServicesV2.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// --- Tipos Atualizados ---

export interface PartnerServiceV2 {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedServicesResponse {
  items: PartnerServiceV2[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateServiceData {
  name: string;
  description: string;
  price: number;
}

export interface UpdateServiceData {
  name?: string;        // ✨ Opcional (PATCH-like)
  description?: string; // ✨ Opcional
  price?: number;       // ✨ Opcional
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

// --- Hook com Paginação ---

interface UsePartnerServicesV2Options {
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

export function usePartnerServicesV2(options: UsePartnerServicesV2Options = {}) {
  const { page: initialPage = 1, limit = 20, autoFetch = true } = options;

  // Estado
  const [services, setServices] = useState<PartnerServiceV2[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();

  // --- Operações CRUD ---

  /**
   * Lista serviços com paginação
   */
  const fetchServices = useCallback(
    async (page: number = pagination.page, nameFilter?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (nameFilter) {
          params.append('name', nameFilter);
        }

        const response = await authenticatedFetch(
          `/api/partner/services/v2?${params.toString()}`
        );

        if (response.ok && response.data) {
          const data = response.data as { data: PaginatedServicesResponse };
          setServices(data.data.items);
          setPagination({
            page: data.data.page,
            limit: data.data.limit,
            total: data.data.total,
            totalPages: data.data.totalPages,
          });
        } else {
          throw new Error(response.error || 'Erro ao carregar serviços');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
        setError({
          code: 'FETCH_ERROR',
          message: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch, limit, pagination.page]
  );

  /**
   * Busca serviço específico por ID
   */
  const getServiceById = useCallback(
    async (serviceId: string): Promise<PartnerServiceV2 | null> => {
      try {
        const response = await authenticatedFetch(`/api/partner/services/v2/${serviceId}`);

        if (response.ok && response.data) {
          const data = response.data as { data: PartnerServiceV2 };
          return data.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [authenticatedFetch]
  );

  /**
   * Cria novo serviço
   */
  const createService = useCallback(
    async (serviceData: CreateServiceData): Promise<PartnerServiceV2> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch('/api/partner/services/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        });

        if (response.ok && response.data) {
          const data = response.data as { data: PartnerServiceV2 };
          // Adicionar à lista local
          setServices(prev => [data.data, ...prev]);
          setPagination(prev => ({ ...prev, total: prev.total + 1 }));
          return data.data;
        } else {
          throw new Error(response.error || 'Erro ao criar serviço');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao criar serviço';
        setError({
          code: 'CREATE_ERROR',
          message: errorMessage,
        });
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  /**
   * Atualiza serviço existente (partial update)
   */
  const updateService = useCallback(
    async (serviceId: string, updates: UpdateServiceData): Promise<PartnerServiceV2> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(`/api/partner/services/v2/${serviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (response.ok && response.data) {
          const data = response.data as { data: PartnerServiceV2 };
          // Atualizar na lista local
          setServices(prev =>
            prev.map(service => (service.id === serviceId ? data.data : service))
          );
          return data.data;
        } else {
          throw new Error(response.error || 'Erro ao atualizar serviço');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao atualizar serviço';
        setError({
          code: 'UPDATE_ERROR',
          message: errorMessage,
        });
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  /**
   * Deleta serviço
   */
  const deleteService = useCallback(
    async (serviceId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(`/api/partner/services/v2/${serviceId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remover da lista local
          setServices(prev => prev.filter(service => service.id !== serviceId));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        } else {
          throw new Error(response.error || 'Erro ao excluir serviço');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao excluir serviço';
        setError({
          code: 'DELETE_ERROR',
          message: errorMessage,
        });
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  // --- Paginação ---

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        fetchServices(page);
      }
    },
    [fetchServices, pagination.totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(pagination.page + 1);
  }, [goToPage, pagination.page]);

  const previousPage = useCallback(() => {
    goToPage(pagination.page - 1);
  }, [goToPage, pagination.page]);

  // Auto-fetch na montagem
  useEffect(() => {
    if (autoFetch) {
      fetchServices();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Estado
    services,
    pagination,
    loading,
    error,

    // Operações CRUD
    fetchServices,
    getServiceById,
    createService,
    updateService,
    deleteService,

    // Navegação de páginas
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}
```

---

### Migração do `partnerClientService.ts`

#### Estado Atual (Legacy)
```typescript
// modules/partner/services/partnerClientService.ts

export async function addService(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>['authenticatedFetch'],
  serviceData: ServiceData
): Promise<void> {
  await authenticatedFetch('/api/partner/services', { // ❌ Legacy
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
}
```

#### Migrado para V2
```typescript
// modules/partner/services/partnerClientServiceV2.ts

import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface ServiceDataV2 {
  name: string;
  description: string;
  price: number;
}

export interface ServiceResponseV2 {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cria um novo serviço usando endpoint V2
 */
export async function addServiceV2(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>['authenticatedFetch'],
  serviceData: ServiceDataV2
): Promise<ServiceResponseV2> {
  const response = await authenticatedFetch('/api/partner/services/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serviceData),
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Erro ao criar serviço');
  }

  const data = response.data as { data: ServiceResponseV2 };
  return data.data;
}

// Nota: importServicesFromCsv permanece inalterado (endpoint diferente)
export async function importServicesFromCsv(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>['authenticatedFetch'],
  csvFile: File
): Promise<ImportResult> {
  // ... mantém implementação atual
}
```

---

## 📋 Checklist de Migração

### Fase 1: Preparação (1-2 dias)
- [ ] Criar `modules/partner/hooks/usePartnerServicesV2.ts`
- [ ] Criar `modules/partner/services/partnerClientServiceV2.ts`
- [ ] Atualizar tipos em `modules/partner/types/service.ts`
- [ ] Criar testes unitários para novos hooks
- [ ] Documentar breaking changes em CHANGELOG

### Fase 2: Migração de Componentes (3-5 dias)
- [ ] Identificar todos componentes que usam `usePartnerServices`
  - [ ] `dashboard/partner/services` (página principal)
  - [ ] Componentes de modal (criar/editar)
  - [ ] Componentes de listagem
- [ ] Migrar componentes um a um
  - [ ] Atualizar imports
  - [ ] Adaptar para paginação
  - [ ] Atualizar tratamento de erros
  - [ ] Remover referências a `category`
- [ ] Testar cada componente individualmente

### Fase 3: Cleanup (1 dia)
- [ ] Remover `usePartnerServices.ts` (legacy)
- [ ] Remover `partnerClientService.ts` (legacy)
- [ ] Atualizar documentação
- [ ] Criar issue para remover endpoints legacy (Sprint +2)

---

## 🎨 Exemplos de Uso

### Componente de Listagem com Paginação

```tsx
// dashboard/partner/services/ServicesList.tsx

'use client';

import { usePartnerServicesV2 } from '@/modules/partner/hooks/usePartnerServicesV2';

export function ServicesList() {
  const {
    services,
    pagination,
    loading,
    error,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePartnerServicesV2({ limit: 10 });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error.message} />;

  return (
    <div>
      <h1>Meus Serviços ({pagination.total})</h1>
      
      {/* Lista de serviços */}
      <ul>
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </ul>

      {/* Paginação */}
      <div className="flex gap-4 mt-4">
        <button 
          onClick={previousPage} 
          disabled={!hasPreviousPage}
        >
          Anterior
        </button>
        
        <span>
          Página {pagination.page} de {pagination.totalPages}
        </span>
        
        <button 
          onClick={nextPage} 
          disabled={!hasNextPage}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
```

### Componente de Criação

```tsx
// dashboard/partner/services/CreateServiceModal.tsx

'use client';

import { useState } from 'react';
import { usePartnerServicesV2 } from '@/modules/partner/hooks/usePartnerServicesV2';

export function CreateServiceModal({ onClose }: { onClose: () => void }) {
  const { createService, loading, error } = usePartnerServicesV2({ autoFetch: false });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createService(formData);
      onClose();
    } catch (err) {
      // Erro já está no estado do hook
      console.error('Falha ao criar serviço:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nome do serviço"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <textarea
        placeholder="Descrição"
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        required
      />
      
      <input
        type="number"
        placeholder="Preço"
        value={formData.price}
        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
        min="0"
        step="0.01"
        required
      />

      {error && <ErrorMessage error={error.message} details={error.details} />}

      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Serviço'}
      </button>
    </form>
  );
}
```

### Componente de Edição (Partial Update)

```tsx
// dashboard/partner/services/EditServiceModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { usePartnerServicesV2 } from '@/modules/partner/hooks/usePartnerServicesV2';
import type { PartnerServiceV2 } from '@/modules/partner/hooks/usePartnerServicesV2';

interface Props {
  service: PartnerServiceV2;
  onClose: () => void;
}

export function EditServiceModal({ service, onClose }: Props) {
  const { updateService, loading, error } = usePartnerServicesV2({ autoFetch: false });
  
  // Apenas campos que queremos permitir edição
  const [updates, setUpdates] = useState<{
    name?: string;
    description?: string;
    price?: number;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enviar apenas campos que foram modificados
    const changedFields = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== service[key as keyof PartnerServiceV2]) {
        acc[key] = value;
      }
      return acc;
    }, {} as typeof updates);

    if (Object.keys(changedFields).length === 0) {
      onClose();
      return;
    }

    try {
      await updateService(service.id, changedFields);
      onClose();
    } catch (err) {
      console.error('Falha ao atualizar serviço:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nome do serviço"
        defaultValue={service.name}
        onChange={e => setUpdates({ ...updates, name: e.target.value })}
      />
      
      <textarea
        placeholder="Descrição"
        defaultValue={service.description}
        onChange={e => setUpdates({ ...updates, description: e.target.value })}
      />
      
      <input
        type="number"
        placeholder="Preço"
        defaultValue={service.price}
        onChange={e => setUpdates({ ...updates, price: parseFloat(e.target.value) })}
        min="0"
        step="0.01"
      />

      {error && <ErrorMessage error={error.message} />}

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </form>
  );
}
```

---

## 🧪 Estratégia de Testes

### Testes Unitários dos Hooks

```typescript
// modules/partner/hooks/__tests__/usePartnerServicesV2.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { usePartnerServicesV2 } from '../usePartnerServicesV2';

describe('usePartnerServicesV2', () => {
  it('deve listar serviços com paginação', async () => {
    const { result } = renderHook(() => usePartnerServicesV2({ limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services).toHaveLength(10);
    expect(result.current.pagination.total).toBeGreaterThan(0);
  });

  it('deve criar novo serviço', async () => {
    const { result } = renderHook(() => usePartnerServicesV2({ autoFetch: false }));

    await waitFor(async () => {
      const service = await result.current.createService({
        name: 'Test Service',
        description: 'Test Description',
        price: 100,
      });

      expect(service.id).toBeDefined();
      expect(service.name).toBe('Test Service');
    });
  });

  it('deve atualizar serviço parcialmente', async () => {
    const { result } = renderHook(() => usePartnerServicesV2({ autoFetch: false }));

    await waitFor(async () => {
      const updated = await result.current.updateService('service-id', {
        price: 200, // Apenas preço mudou
      });

      expect(updated.price).toBe(200);
    });
  });

  it('deve tratar erro de validação', async () => {
    const { result } = renderHook(() => usePartnerServicesV2({ autoFetch: false }));

    await waitFor(async () => {
      try {
        await result.current.createService({
          name: '',  // Inválido
          description: 'Test',
          price: 100,
        });
      } catch (err) {
        expect(result.current.error?.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
```

### Testes de Integração

```typescript
// cypress/e2e/partner/services-v2.cy.ts

describe('Partner Services V2', () => {
  beforeEach(() => {
    cy.loginAsPartner();
    cy.visit('/dashboard/partner/services');
  });

  it('deve listar serviços com paginação', () => {
    cy.get('[data-testid="service-card"]').should('have.length', 10);
    cy.contains('Página 1 de').should('be.visible');
    
    cy.get('[data-testid="next-page"]').click();
    cy.contains('Página 2 de').should('be.visible');
  });

  it('deve criar novo serviço', () => {
    cy.get('[data-testid="create-service-btn"]').click();
    
    cy.get('input[name="name"]').type('Novo Serviço');
    cy.get('textarea[name="description"]').type('Descrição do serviço');
    cy.get('input[name="price"]').type('150.00');
    
    cy.get('button[type="submit"]').click();
    
    cy.contains('Novo Serviço').should('be.visible');
  });

  it('deve atualizar serviço existente', () => {
    cy.get('[data-testid="service-card"]').first().click();
    cy.get('[data-testid="edit-service-btn"]').click();
    
    cy.get('input[name="price"]').clear().type('200.00');
    
    cy.get('button[type="submit"]').click();
    
    cy.contains('R$ 200,00').should('be.visible');
  });

  it('deve deletar serviço', () => {
    cy.get('[data-testid="service-card"]').first().within(() => {
      cy.get('[data-testid="delete-btn"]').click();
    });
    
    cy.get('[data-testid="confirm-delete"]').click();
    
    cy.contains('Serviço excluído com sucesso').should('be.visible');
  });
});
```

---

## 📅 Timeline Recomendado

| Sprint | Semana | Atividade | Responsável | Status |
|--------|--------|-----------|-------------|--------|
| **Sprint Atual** | 1 | Criar hooks V2 + tipos | Frontend Dev | 🟡 Todo |
| **Sprint Atual** | 1 | Criar testes unitários | Frontend Dev | 🟡 Todo |
| **Sprint Atual** | 2 | Migrar página principal | Frontend Dev | 🟡 Todo |
| **Sprint Atual** | 2 | Migrar modais (criar/editar) | Frontend Dev | 🟡 Todo |
| **Sprint +1** | 1 | Migrar componentes restantes | Frontend Dev | 🟡 Todo |
| **Sprint +1** | 1 | Testes E2E completos | QA | 🟡 Todo |
| **Sprint +1** | 2 | Code review + ajustes | Team | 🟡 Todo |
| **Sprint +1** | 2 | Deploy para staging | DevOps | 🟡 Todo |
| **Sprint +2** | 1 | Monitoramento pós-deploy | Team | 🟡 Todo |
| **Sprint +2** | 2 | Remover endpoints legacy | Backend Dev | 🟡 Todo |

---

## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Breaking changes não mapeados** | Média | Alto | Testes E2E cobrindo todos fluxos |
| **Performance de paginação** | Baixa | Médio | Monitorar métricas, ajustar limit padrão |
| **Componentes não identificados** | Média | Alto | Busca global por imports legados |
| **Rollback necessário** | Baixa | Crítico | Feature flag para toggle entre V1/V2 |
| **Usuários impactados** | Baixa | Médio | Deploy gradual + monitoramento |

---

## 📚 Referências

### Documentação Interna
- **Endpoints V2:** `app/api/partner/services/v2/route.ts`
- **Schemas:** `app/api/partner/services/v2/lib/schemas.ts`
- **Application Service:** `modules/partner/domain/application/services/PartnerServiceApplicationServiceImpl.ts`
- **Testes:** `tests/integration/api/partner/partner-services-v2.*.test.ts`

### Documentação Relacionada
- **Error Handlers:** `modules/common/http/errorHandlers.ts`
- **Auth Middleware:** `modules/common/utils/authMiddleware.ts`
- **DDD Architecture:** `docs/architecture/DOMAIN_DRIVEN_DESIGN.md`

---

## ✅ Critérios de Aceitação

### Funcional
- [ ] Listagem com paginação funciona (10/20/50 itens por página)
- [ ] Criação de serviço valida campos corretamente
- [ ] Edição permite atualização parcial de campos
- [ ] Deleção remove serviço da lista
- [ ] Busca por nome filtra resultados
- [ ] Mensagens de erro são claras e acionáveis

### Técnico
- [ ] Zero imports de hooks legados
- [ ] 100% cobertura de testes nos novos hooks
- [ ] Build sem warnings/errors
- [ ] Lighthouse score > 90 (performance)
- [ ] Nenhuma chamada a endpoints legacy no console

### UX
- [ ] Loading states em todas operações
- [ ] Feedback visual para sucesso/erro
- [ ] Navegação de paginação intuitiva
- [ ] Validação client-side antes do submit
- [ ] Confirmação antes de deletar

---

## 🎓 Perguntas Frequentes

### 1. Por que não usar PATCH em vez de PUT?
**R:** V2 usa PUT com semântica PATCH (campos opcionais) por consistência com REST tradicional, mas o comportamento é de partial update.

### 2. Preciso migrar tudo de uma vez?
**R:** Não! Você pode migrar componente por componente. Endpoints legacy funcionam até Sprint +2.

### 3. E se eu quiser listar TODOS os serviços sem paginação?
**R:** Use `limit=1000` (máximo suportado). Para casos reais, paginação é obrigatória.

### 4. O campo `category` voltará?
**R:** Não. Foi descontinuado. Use tags ou outro mecanismo se necessário.

### 5. Como faço rollback se der problema?
**R:** Reverta os imports para hooks legados. Endpoints V1 ficam ativos até Sprint +2.

---

**Última atualização:** Outubro 2025  
**Autor:** Refatoração P2 - Frontend Hook Migration  
**Status:** 📝 Documentação de Migração  
**Deadline Endpoints Legacy:** Dezembro 2025 (Sprint +2)
