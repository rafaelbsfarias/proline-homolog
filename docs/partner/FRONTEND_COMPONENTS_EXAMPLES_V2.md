# Guia Prático: Componentes React com Hooks V2

## 📋 Exemplos Completos de Componentes

Este documento complementa `FRONTEND_HOOKS_MIGRATION_V2.md` com exemplos práticos e prontos para uso.

---

## 🎨 Componente Completo: Página de Serviços

```tsx
// app/dashboard/partner/services/page.tsx

'use client';

import { useState } from 'react';
import { usePartnerServicesV2 } from '@/modules/partner/hooks/usePartnerServicesV2';
import { ServiceCard } from './components/ServiceCard';
import { CreateServiceModal } from './components/CreateServiceModal';
import { EditServiceModal } from './components/EditServiceModal';
import { SearchBar } from './components/SearchBar';
import { Pagination } from './components/Pagination';
import { LoadingSpinner } from '@/modules/common/components/LoadingSpinner';
import { ErrorAlert } from '@/modules/common/components/ErrorAlert';
import type { PartnerServiceV2 } from '@/modules/partner/hooks/usePartnerServicesV2';

export default function PartnerServicesPage() {
  // Estado do hook V2
  const {
    services,
    pagination,
    loading,
    error,
    fetchServices,
    deleteService,
    nextPage,
    previousPage,
    goToPage,
    hasNextPage,
    hasPreviousPage,
  } = usePartnerServicesV2({ limit: 12 });

  // Estado local
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<PartnerServiceV2 | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchServices(1, term || undefined);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    setDeleteLoading(serviceId);
    try {
      await deleteService(serviceId);
    } catch (err) {
      console.error('Erro ao deletar serviço:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (service: PartnerServiceV2) => {
    setEditingService(service);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    // Hook já adiciona na lista local automaticamente
  };

  const handleEditSuccess = () => {
    setEditingService(null);
    // Hook já atualiza na lista local automaticamente
  };

  // Renderização de estados
  if (loading && services.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Serviços</h1>
          <p className="text-gray-600 mt-2">
            {pagination.total} {pagination.total === 1 ? 'serviço' : 'serviços'} cadastrados
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Serviço
        </button>
      </div>

      {/* Busca */}
      <SearchBar
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Buscar por nome do serviço..."
        className="mb-6"
      />

      {/* Error State */}
      {error && (
        <ErrorAlert
          title="Erro ao carregar serviços"
          message={error.message}
          details={error.details}
          onRetry={() => fetchServices()}
          className="mb-6"
        />
      )}

      {/* Empty State */}
      {!loading && services.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Comece criando seu primeiro serviço'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar Primeiro Serviço
            </button>
          )}
        </div>
      )}

      {/* Grid de Serviços */}
      {services.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => handleEdit(service)}
                onDelete={() => handleDelete(service.id)}
                deleteLoading={deleteLoading === service.id}
              />
            ))}
          </div>

          {/* Paginação */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={goToPage}
            onNext={nextPage}
            onPrevious={previousPage}
            hasNext={hasNextPage}
            hasPrevious={hasPreviousPage}
            loading={loading}
          />
        </>
      )}

      {/* Modais */}
      {isCreateModalOpen && (
        <CreateServiceModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
```

---

## 🃏 Componente: ServiceCard

```tsx
// app/dashboard/partner/services/components/ServiceCard.tsx

'use client';

import type { PartnerServiceV2 } from '@/modules/partner/hooks/usePartnerServicesV2';

interface ServiceCardProps {
  service: PartnerServiceV2;
  onEdit: () => void;
  onDelete: () => void;
  deleteLoading?: boolean;
}

export function ServiceCard({ service, onEdit, onDelete, deleteLoading }: ServiceCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(service.price);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(service.updatedAt));

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
          <p className="text-2xl font-bold text-blue-600">{formattedPrice}</p>
        </div>
        
        {/* Status Badge */}
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            service.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {service.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          Atualizado em {formattedDate}
        </span>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            disabled={deleteLoading}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
          >
            {deleteLoading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## ➕ Componente: CreateServiceModal

```tsx
// app/dashboard/partner/services/components/CreateServiceModal.tsx

'use client';

import { useState } from 'react';
import { usePartnerServicesV2 } from '@/modules/partner/hooks/usePartnerServicesV2';
import { Modal } from '@/modules/common/components/Modal';
import { FormField } from '@/modules/common/components/FormField';
import { Button } from '@/modules/common/components/Button';
import { ErrorAlert } from '@/modules/common/components/ErrorAlert';

interface CreateServiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateServiceModal({ onClose, onSuccess }: CreateServiceModalProps) {
  const { createService, loading, error } = usePartnerServicesV2({ autoFetch: false });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validação client-side
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.length > 100) {
      errors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    } else if (formData.description.length > 500) {
      errors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      errors.price = 'Preço é obrigatório';
    } else if (price <= 0) {
      errors.price = 'Preço deve ser maior que zero';
    } else if (price > 999999.99) {
      errors.price = 'Preço deve ser menor que R$ 1.000.000,00';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createService({
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
      });
      onSuccess();
    } catch (err) {
      // Erro já está no estado do hook
      console.error('Falha ao criar serviço:', err);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Criar Novo Serviço"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error global do servidor */}
        {error && (
          <ErrorAlert
            title="Erro ao criar serviço"
            message={error.message}
            details={error.details}
          />
        )}

        {/* Nome */}
        <FormField
          label="Nome do Serviço"
          required
          error={validationErrors.name}
        >
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="Ex: Troca de Óleo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.name.length}/100 caracteres
          </p>
        </FormField>

        {/* Descrição */}
        <FormField
          label="Descrição"
          required
          error={validationErrors.description}
        >
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Descreva o serviço oferecido..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={500}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 caracteres
          </p>
        </FormField>

        {/* Preço */}
        <FormField
          label="Preço"
          required
          error={validationErrors.price}
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              value={formData.price}
              onChange={e => handleChange('price', e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0"
              max="999999.99"
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
        </FormField>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Criar Serviço
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

---

## ✏️ Componente: EditServiceModal

```tsx
// app/dashboard/partner/services/components/EditServiceModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { usePartnerServicesV2, type PartnerServiceV2 } from '@/modules/partner/hooks/usePartnerServicesV2';
import { Modal } from '@/modules/common/components/Modal';
import { FormField } from '@/modules/common/components/FormField';
import { Button } from '@/modules/common/components/Button';
import { ErrorAlert } from '@/modules/common/components/ErrorAlert';

interface EditServiceModalProps {
  service: PartnerServiceV2;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditServiceModal({ service, onClose, onSuccess }: EditServiceModalProps) {
  const { updateService, loading, error } = usePartnerServicesV2({ autoFetch: false });

  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description,
    price: service.price.toString(),
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Detectar mudanças
  useEffect(() => {
    const changed =
      formData.name !== service.name ||
      formData.description !== service.description ||
      parseFloat(formData.price) !== service.price;
    setHasChanges(changed);
  }, [formData, service]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.length > 100) {
      errors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    } else if (formData.description.length > 500) {
      errors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      errors.price = 'Preço é obrigatório';
    } else if (price <= 0) {
      errors.price = 'Preço deve ser maior que zero';
    } else if (price > 999999.99) {
      errors.price = 'Preço deve ser menor que R$ 1.000.000,00';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      onClose();
      return;
    }

    if (!validateForm()) return;

    // Montar objeto apenas com campos que mudaram (partial update)
    const updates: { name?: string; description?: string; price?: number } = {};

    if (formData.name !== service.name) {
      updates.name = formData.name.trim();
    }
    if (formData.description !== service.description) {
      updates.description = formData.description.trim();
    }
    if (parseFloat(formData.price) !== service.price) {
      updates.price = parseFloat(formData.price);
    }

    try {
      await updateService(service.id, updates);
      onSuccess();
    } catch (err) {
      console.error('Falha ao atualizar serviço:', err);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Editar Serviço"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <ErrorAlert
            title="Erro ao atualizar serviço"
            message={error.message}
            details={error.details}
          />
        )}

        {/* Nome */}
        <FormField
          label="Nome do Serviço"
          required
          error={validationErrors.name}
        >
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            maxLength={100}
            disabled={loading}
          />
        </FormField>

        {/* Descrição */}
        <FormField
          label="Descrição"
          required
          error={validationErrors.description}
        >
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            maxLength={500}
            disabled={loading}
          />
        </FormField>

        {/* Preço */}
        <FormField
          label="Preço"
          required
          error={validationErrors.price}
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              value={formData.price}
              onChange={e => handleChange('price', e.target.value)}
              step="0.01"
              min="0"
              max="999999.99"
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </FormField>

        {/* Info sobre mudanças */}
        {!hasChanges && (
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            💡 Nenhuma alteração detectada
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!hasChanges}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

---

## 🔍 Componente: SearchBar

```tsx
// app/dashboard/partner/services/components/SearchBar.tsx

'use client';

import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/modules/common/hooks/useDebouncedValue';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
  debounceMs = 500,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebouncedValue(localValue, debounceMs);

  // Propagar mudança debounced para o parent
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sincronizar com prop externa
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </div>
      <input
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

---

## 📄 Componente: Pagination

```tsx
// app/dashboard/partner/services/components/Pagination.tsx

'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  loading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  loading,
}: PaginationProps) {
  // Gerar array de páginas visíveis (ex: [1, 2, 3, ..., 10])
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Máximo de páginas visíveis

    if (totalPages <= showPages) {
      // Mostrar todas as páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar primeira, última e algumas do meio
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Páginas ao redor da atual
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Botão Anterior */}
      <button
        onClick={onPrevious}
        disabled={!hasPrevious || loading}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ← Anterior
      </button>

      {/* Números de página */}
      <div className="flex gap-1">
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              {page}
            </button>
          ) : (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-gray-400"
            >
              {page}
            </span>
          )
        )}
      </div>

      {/* Botão Próxima */}
      <button
        onClick={onNext}
        disabled={!hasNext || loading}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Próxima →
      </button>
    </div>
  );
}
```

---

## 🪝 Hook Auxiliar: useDebouncedValue

```typescript
// modules/common/hooks/useDebouncedValue.ts

import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 📊 Exemplo: Uso com Server Actions (Next.js 14+)

```tsx
// app/dashboard/partner/services/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateServices() {
  revalidatePath('/dashboard/partner/services');
}

// app/dashboard/partner/services/components/CreateServiceModal.tsx (atualizado)

import { revalidateServices } from '../actions';

// Dentro do handleSubmit:
try {
  await createService(serviceData);
  await revalidateServices(); // ✨ Revalidar cache do Next.js
  onSuccess();
} catch (err) {
  // ...
}
```

---

## 🎯 Dicas de Performance

### 1. Memoização de Componentes
```tsx
import { memo } from 'react';

export const ServiceCard = memo(function ServiceCard({ service, onEdit, onDelete }: Props) {
  // ...
}, (prevProps, nextProps) => {
  // Custom comparison: re-render apenas se serviço mudou
  return prevProps.service.id === nextProps.service.id &&
         prevProps.service.updatedAt === nextProps.service.updatedAt;
});
```

### 2. Virtual Scrolling para Listas Grandes
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function ServicesList({ services }: { services: PartnerServiceV2[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Altura estimada do card
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ServiceCard service={services[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Lazy Loading de Modais
```tsx
import { lazy, Suspense } from 'react';

const CreateServiceModal = lazy(() => import('./components/CreateServiceModal'));

// No componente:
{isCreateModalOpen && (
  <Suspense fallback={<LoadingSpinner />}>
    <CreateServiceModal onClose={...} onSuccess={...} />
  </Suspense>
)}
```

---

**Última atualização:** Outubro 2025  
**Autor:** Refatoração P2 - Exemplos Práticos  
**Relacionado:** FRONTEND_HOOKS_MIGRATION_V2.md
