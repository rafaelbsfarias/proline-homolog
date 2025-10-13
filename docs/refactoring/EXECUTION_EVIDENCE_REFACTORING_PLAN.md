# 🔧 Plano de Refatoração: execution-evidence/page.tsx

**Arquivo:** `app/dashboard/partner/execution-evidence/page.tsx`  
**Linhas Atuais:** 866 linhas  
**Status:** 🔴 **CRÍTICO - Violando múltiplos princípios do projeto**

---

## 📋 Análise de Violações

### ❌ Princípios Violados

1. **Single Responsibility Principle (SOLID)**
   - O componente gerencia: carregamento de dados, upload de imagens, estado de evidências, toast notifications, validações, finalização de serviços
   - Responsabilidade única violada: faz TUDO ao mesmo tempo

2. **Composition Pattern**
   - Monolítico: não usa composição de componentes menores
   - 700+ linhas de JSX inline
   - Estilos inline em todo lugar

3. **KISS (Keep It Simple, Stupid)**
   - Complexidade extrema: 866 linhas em um único arquivo
   - Lógica de negócio misturada com apresentação
   - Difícil de entender e manter

4. **DRY (Don't Repeat Yourself)**
   - Estilos inline repetidos centenas de vezes
   - Lógica de manipulação de estado duplicada
   - Validações inline repetidas

5. **Object Calisthenics**
   - Níveis de indentação excessivos (6-8 níveis)
   - Funções muito longas (50+ linhas)
   - Múltiplos estados gerenciados no mesmo componente

6. **Separation of Concerns**
   - Lógica de API misturada com UI
   - Validações inline
   - Toast system embutido no componente

---

## 🎯 Objetivos da Refatoração

1. **Reduzir complexidade**: componente principal < 150 linhas
2. **Separar responsabilidades**: cada seção em componente próprio
3. **Extrair estilos**: criar CSS Modules para todos os estilos inline
4. **Melhorar testabilidade**: componentes pequenos e isolados
5. **Facilitar manutenção**: mudanças localizadas, não globais
6. **Seguir composition pattern**: containers + componentes filhos
7. **Extrair lógica de negócio**: hooks e utils customizados

---

## 📦 Estrutura Proposta

```
app/dashboard/partner/execution-evidence/
├── page.tsx                              # 🎯 Container (< 150 linhas)
├── page.module.css                       # ✅ Estilos do container
│
├── components/                           # 📂 NOVO - Componentes da página
│   ├── ExecutionHeader.tsx               # Header com veículo + voltar
│   ├── ExecutionHeader.module.css
│   ├── ServiceCard.tsx                   # Card individual de serviço
│   ├── ServiceCard.module.css
│   ├── EvidenceGrid.tsx                  # Grid de evidências
│   ├── EvidenceGrid.module.css
│   ├── EvidenceCard.tsx                  # Card individual de evidência
│   ├── EvidenceCard.module.css
│   ├── ServiceActions.tsx                # Ações do serviço (upload, concluir)
│   ├── ServiceActions.module.css
│   ├── ServiceAlert.tsx                  # Alerta de falta de evidências
│   ├── ServiceAlert.module.css
│   ├── FinalizeActions.tsx               # Botões finais (salvar, finalizar)
│   ├── FinalizeActions.module.css
│   ├── EmptyState.tsx                    # Estado vazio
│   ├── EmptyState.module.css
│   ├── LoadingState.tsx                  # Estado de carregamento
│   ├── LoadingState.module.css
│   └── Toast.tsx                         # Sistema de toast
│       └── Toast.module.css
│
├── hooks/                                # 📂 NOVO - Hooks customizados
│   ├── useExecutionData.ts               # Carrega dados do orçamento
│   ├── useEvidenceManager.ts             # Gerencia estado das evidências
│   ├── useImageUpload.ts                 # Upload de imagens
│   ├── useServiceCompletion.ts           # Marcar serviço como concluído
│   ├── useExecutionFinalize.ts           # Finalizar execução completa
│   └── useToast.ts                       # Sistema de notificações
│
├── utils/                                # 📂 NOVO - Utilitários
│   ├── validations.ts                    # Validações de finalização
│   ├── imageHelpers.ts                   # Helpers de imagem
│   └── formatters.ts                     # Formatadores de dados
│
└── types/                                # 📂 NOVO - Types locais
    └── index.ts                          # QuoteItem, Evidence, ServiceWithEvidences, etc.
```

---

## 🔄 Fases da Refatoração

### **Fase 1: Preparação (Sem Breaking Changes)**

#### 1.1. Criar Estrutura de Diretórios
```bash
mkdir -p app/dashboard/partner/execution-evidence/{components,hooks,utils,types}
```

#### 1.2. Extrair Types
**Arquivo:** `app/dashboard/partner/execution-evidence/types/index.ts`
```typescript
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  completed_at?: string | null;
}

export interface Evidence {
  id?: string;
  quote_item_id: string;
  image_url: string;
  description: string;
  uploaded_at?: string;
}

export interface ServiceWithEvidences extends QuoteItem {
  evidences: Evidence[];
}

export interface VehicleInfo {
  plate: string;
  brand: string;
  model: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ServiceOrderResponse {
  ok: boolean;
  serviceOrder?: {
    vehicle: VehicleInfo;
    items: QuoteItem[];
    evidences?: Evidence[];
  };
  error?: string;
}
```

#### 1.3. Extrair Validações
**Arquivo:** `app/dashboard/partner/execution-evidence/utils/validations.ts`
```typescript
import { ServiceWithEvidences } from '../types';

export const validateCanFinalize = (services: ServiceWithEvidences[]) => {
  const servicesWithoutEvidences = services.filter(s => s.evidences.length === 0);
  const servicesNotCompleted = services.filter(s => !s.completed_at);

  return {
    canFinalize: servicesWithoutEvidences.length === 0 && servicesNotCompleted.length === 0,
    servicesWithoutEvidences,
    servicesNotCompleted,
  };
};

export const getValidationMessage = (
  servicesWithoutEvidences: ServiceWithEvidences[],
  servicesNotCompleted: ServiceWithEvidences[]
): string => {
  if (servicesWithoutEvidences.length > 0) {
    const names = servicesWithoutEvidences.map(s => `"${s.description}"`).join(', ');
    return `❌ Não é possível finalizar: os seguintes serviços não possuem evidências: ${names}`;
  }
  
  if (servicesNotCompleted.length > 0) {
    const names = servicesNotCompleted.map(s => `"${s.description}"`).join(', ');
    return `❌ Não é possível finalizar: os seguintes serviços não foram marcados como concluídos: ${names}`;
  }
  
  return '';
};

export const getTooltipMessage = (
  servicesWithoutEvidences: ServiceWithEvidences[],
  servicesNotCompleted: ServiceWithEvidences[]
): string => {
  if (servicesWithoutEvidences.length > 0) {
    return `${servicesWithoutEvidences.length} serviço(s) sem evidências`;
  }
  if (servicesNotCompleted.length > 0) {
    return `${servicesNotCompleted.length} serviço(s) não concluído(s)`;
  }
  return '';
};
```

#### 1.4. Extrair Image Helpers
**Arquivo:** `app/dashboard/partner/execution-evidence/utils/imageHelpers.ts`
```typescript
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop() || '';
};

export const generateFileName = (
  userId: string,
  quoteId: string,
  serviceId: string,
  extension: string
): string => {
  return `${userId}/${quoteId}/${serviceId}/${Date.now()}.${extension}`;
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Arquivo deve ser uma imagem' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Imagem deve ter no máximo 10MB' };
  }
  
  return { valid: true };
};
```

#### 1.5. Extrair Formatters
**Arquivo:** `app/dashboard/partner/execution-evidence/utils/formatters.ts`
```typescript
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR');
};

export const formatVehicleInfo = (brand: string, model: string, plate: string): string => {
  return `${plate} - ${brand} ${model}`;
};
```

---

### **Fase 2: Criar Hooks Customizados**

#### 2.1. useToast
**Arquivo:** `app/dashboard/partner/execution-evidence/hooks/useToast.ts`
```typescript
import { useState } from 'react';
import { ToastState } from '../types';

const INITIAL_TOAST: ToastState = {
  show: false,
  message: '',
  type: 'success',
};

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>(INITIAL_TOAST);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(INITIAL_TOAST);
    }, 4000);
  };

  const hideToast = () => {
    setToast(INITIAL_TOAST);
  };

  return { toast, showToast, hideToast };
};
```

#### 2.2. useExecutionData
**Arquivo:** `app/dashboard/partner/execution-evidence/hooks/useExecutionData.ts`
```typescript
import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { ServiceWithEvidences, VehicleInfo, Evidence } from '../types';

const logger = getLogger('partner:execution-evidence');

export const useExecutionData = (quoteId: string | null) => {
  const { get } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceWithEvidences[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    plate: '',
    brand: '',
    model: '',
  });

  const loadData = async () => {
    if (!quoteId) return;

    try {
      setLoading(true);
      logger.info('load_service_order_start', { quoteId });

      const resp = await get(`/api/partner/service-order/${quoteId}`, { requireAuth: true });

      if (!resp.ok) {
        logger.error('load_service_order_failed', { status: resp.status, quoteId });
        return { error: resp.error || 'Falha ao carregar ordem de serviço' };
      }

      const serviceOrder = (resp.data as any)?.serviceOrder;
      if (!serviceOrder) {
        logger.info('no_items_in_service_order');
        return { error: 'Nenhum serviço encontrado neste orçamento' };
      }

      // Processar veículo
      setVehicleInfo({
        plate: serviceOrder.vehicle?.plate || '',
        brand: serviceOrder.vehicle?.brand || '',
        model: serviceOrder.vehicle?.model || '',
      });

      // Processar evidências
      const items = serviceOrder.items || [];
      const existingEvidences = serviceOrder.evidences || [];

      const evidencesByItem = new Map<string, Evidence[]>();
      existingEvidences.forEach((ev: Evidence) => {
        if (!evidencesByItem.has(ev.quote_item_id)) {
          evidencesByItem.set(ev.quote_item_id, []);
        }
        evidencesByItem.get(ev.quote_item_id)!.push(ev);
      });

      // Combinar dados
      const servicesWithEvidences: ServiceWithEvidences[] = items.map((item: any) => ({
        id: item.id,
        description: item.description || '',
        quantity: item.quantity || 0,
        unit_price: Number(item.unit_price ?? 0),
        total_price: Number(item.total_price ?? 0),
        completed_at: item.completed_at,
        evidences: evidencesByItem.get(item.id) || [],
      }));

      setServices(servicesWithEvidences);
      logger.info('services_ready', { count: servicesWithEvidences.length });

      return { success: true };
    } catch (e) {
      logger.error('load_quote_data_error', { error: e instanceof Error ? e.message : String(e) });
      return { error: 'Erro ao carregar dados do orçamento' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quoteId]);

  return {
    loading,
    services,
    vehicleInfo,
    setServices,
    reloadData: loadData,
  };
};
```

#### 2.3. useEvidenceManager
**Arquivo:** `app/dashboard/partner/execution-evidence/hooks/useEvidenceManager.ts`
```typescript
import { ServiceWithEvidences } from '../types';

export const useEvidenceManager = (
  setServices: React.Dispatch<React.SetStateAction<ServiceWithEvidences[]>>
) => {
  const addEvidence = (serviceId: string, imageUrl: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: [
                ...service.evidences,
                {
                  quote_item_id: serviceId,
                  image_url: imageUrl,
                  description: '',
                },
              ],
            }
          : service
      )
    );
  };

  const removeEvidence = (serviceId: string, evidenceIndex: number) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: service.evidences.filter((_, idx) => idx !== evidenceIndex),
            }
          : service
      )
    );
  };

  const updateEvidenceDescription = (
    serviceId: string,
    evidenceIndex: number,
    description: string
  ) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: service.evidences.map((ev, idx) =>
                idx === evidenceIndex ? { ...ev, description } : ev
              ),
            }
          : service
      )
    );
  };

  return {
    addEvidence,
    removeEvidence,
    updateEvidenceDescription,
  };
};
```

#### 2.4. useImageUpload
**Arquivo:** `app/dashboard/partner/execution-evidence/hooks/useImageUpload.ts`
```typescript
import { useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';
import { getFileExtension, generateFileName, validateImageFile } from '../utils/imageHelpers';

const logger = getLogger('partner:image-upload');

export const useImageUpload = (quoteId: string | null) => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (serviceId: string, file: File): Promise<{ 
    success: boolean; 
    url?: string; 
    error?: string 
  }> => {
    try {
      setUploading(true);
      logger.info('upload_image_start', { serviceId, size: file.size });

      // Validar arquivo
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Autenticar
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('upload_image_no_user');
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Upload
      const fileExt = getFileExtension(file.name);
      const fileName = generateFileName(user.id, quoteId!, serviceId, fileExt);
      
      const { error: uploadError } = await supabase.storage
        .from('execution-evidences')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('execution-evidences')
        .getPublicUrl(fileName);

      logger.info('upload_image_success', { serviceId, url: publicUrl });
      return { success: true, url: publicUrl };
    } catch (e) {
      logger.error('upload_image_error', { error: e instanceof Error ? e.message : String(e) });
      return { success: false, error: 'Erro ao fazer upload da imagem' };
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadImage };
};
```

#### 2.5. useServiceCompletion
**Arquivo:** `app/dashboard/partner/execution-evidence/hooks/useServiceCompletion.ts`
```typescript
import { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';

const logger = getLogger('partner:service-completion');

export const useServiceCompletion = (quoteId: string | null) => {
  const { post } = useAuthenticatedFetch();
  const [completing, setCompleting] = useState(false);

  const completeService = async (serviceId: string, serviceName: string) => {
    try {
      setCompleting(true);
      logger.info('complete_service_start', { serviceId, serviceName });

      const response = await post(
        '/api/partner/complete-service',
        { quote_id: quoteId, quote_item_id: serviceId },
        { requireAuth: true }
      );

      if (!response.ok || !response.data?.ok) {
        const error = response.error || response.data?.error || 'Erro ao marcar serviço como concluído';
        logger.error('complete_service_api_error', { status: response.status, error });
        return { success: false, error };
      }

      const message = response.data?.all_services_completed
        ? '✅ Serviço concluído! Todos os serviços foram finalizados.'
        : `✅ Serviço "${serviceName}" marcado como concluído`;

      logger.info('complete_service_success', {
        serviceId,
        all_completed: response.data?.all_services_completed,
      });

      return { success: true, message };
    } catch (e) {
      logger.error('complete_service_error', { error: e instanceof Error ? e.message : String(e) });
      return { success: false, error: 'Erro ao marcar serviço como concluído' };
    } finally {
      setCompleting(false);
    }
  };

  return { completing, completeService };
};
```

#### 2.6. useExecutionFinalize
**Arquivo:** `app/dashboard/partner/execution-evidence/hooks/useExecutionFinalize.ts`
```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { ServiceWithEvidences } from '../types';
import { validateCanFinalize, getValidationMessage } from '../utils/validations';

const logger = getLogger('partner:execution-finalize');

export const useExecutionFinalize = (quoteId: string | null) => {
  const router = useRouter();
  const { post } = useAuthenticatedFetch();
  const [finalizing, setFinalizing] = useState(false);

  const saveEvidences = async (services: ServiceWithEvidences[]) => {
    const allEvidences = services.flatMap(service =>
      service.evidences.map(ev => ({
        quote_item_id: service.id,
        image_url: ev.image_url,
        description: ev.description || null,
      }))
    );

    logger.info('save_evidences_prepared', { count: allEvidences.length });

    const response = await post(
      '/api/partner/execution-evidences',
      { quote_id: quoteId, evidences: allEvidences },
      { requireAuth: true }
    );

    if (!response.ok || !response.data?.ok) {
      throw new Error(response.error || response.data?.error || 'Erro ao salvar evidências');
    }

    logger.info('save_evidences_success', { inserted: response.data?.inserted });
  };

  const finalize = async (services: ServiceWithEvidences[]) => {
    try {
      setFinalizing(true);
      logger.info('finalize_execution_start');

      // Validar
      const { canFinalize, servicesWithoutEvidences, servicesNotCompleted } = validateCanFinalize(services);

      if (!canFinalize) {
        const message = getValidationMessage(servicesWithoutEvidences, servicesNotCompleted);
        logger.warn('finalize_blocked', { servicesWithoutEvidences: servicesWithoutEvidences.length });
        return { success: false, error: message };
      }

      // Salvar evidências
      await saveEvidences(services);

      // Finalizar execução
      const response = await post(
        '/api/partner/finalize-execution',
        { quote_id: quoteId },
        { requireAuth: true }
      );

      if (!response.ok || !response.data?.ok) {
        throw new Error(response.error || response.data?.error || 'Erro ao finalizar execução');
      }

      logger.info('finalize_execution_success', {
        completed_at: response.data?.completed_at,
        vehicle_status: response.data?.vehicle_status,
      });

      setTimeout(() => router.push('/dashboard'), 2000);

      return { 
        success: true, 
        message: '✅ Execução finalizada com sucesso! Veículo marcado como "Execução Finalizada"' 
      };
    } catch (e) {
      logger.error('finalize_execution_error', { error: e instanceof Error ? e.message : String(e) });
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao finalizar execução' };
    } finally {
      setFinalizing(false);
    }
  };

  const saveProgress = async (services: ServiceWithEvidences[]) => {
    try {
      setFinalizing(true);
      await saveEvidences(services);
      return { success: true, message: 'Evidências salvas com sucesso' };
    } catch (e) {
      logger.error('save_progress_error', { error: e instanceof Error ? e.message : String(e) });
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar evidências' };
    } finally {
      setFinalizing(false);
    }
  };

  return { finalizing, finalize, saveProgress };
};
```

---

### **Fase 3: Criar Componentes Base**

#### 3.1. Toast
**Arquivo:** `app/dashboard/partner/execution-evidence/components/Toast.tsx`
```typescript
import React from 'react';
import { ToastState } from '../types';
import styles from './Toast.module.css';

interface ToastProps {
  toast: ToastState;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast.show) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      {toast.message}
    </div>
  );
};
```

**CSS:** `Toast.module.css`
```css
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 400px;
  font-size: 14px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #ef4444;
}

.toast.info {
  background: #3b82f6;
}
```

#### 3.2. LoadingState
**Arquivo:** `app/dashboard/partner/execution-evidence/components/LoadingState.tsx`
```typescript
import React from 'react';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import styles from './LoadingState.module.css';

export const LoadingState: React.FC = () => {
  return (
    <div className={styles.container}>
      <Header />
      <Loading />
    </div>
  );
};
```

**CSS:** `LoadingState.module.css`
```css
.container {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}
```

#### 3.3. ExecutionHeader
**Arquivo:** `app/dashboard/partner/execution-evidence/components/ExecutionHeader.tsx`
```typescript
import React from 'react';
import { VehicleInfo } from '../types';
import { formatVehicleInfo } from '../utils/formatters';
import styles from './ExecutionHeader.module.css';

interface ExecutionHeaderProps {
  vehicleInfo: VehicleInfo;
  onBack: () => void;
}

export const ExecutionHeader: React.FC<ExecutionHeaderProps> = ({ vehicleInfo, onBack }) => {
  return (
    <>
      <div className={styles.backButtonContainer}>
        <button onClick={onBack} className={styles.backButton}>
          ← Voltar ao Dashboard
        </button>
      </div>

      <div className={styles.card}>
        <h1 className={styles.title}>Evidências de Execução</h1>
        <p className={styles.subtitle}>
          Veículo: {formatVehicleInfo(vehicleInfo.brand, vehicleInfo.model, vehicleInfo.plate)}
        </p>
      </div>
    </>
  );
};
```

**CSS:** `ExecutionHeader.module.css`
```css
.backButtonContainer {
  margin-bottom: 24px;
}

.backButton {
  background: transparent;
  border: none;
  color: #072e4c;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  transition: opacity 0.2s;
}

.backButton:hover {
  opacity: 0.7;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}
```

#### 3.4. EmptyState
**Arquivo:** `app/dashboard/partner/execution-evidence/components/EmptyState.tsx`
```typescript
import React from 'react';
import styles from './EmptyState.module.css';

export const EmptyState: React.FC = () => {
  return (
    <div className={styles.card}>
      <p className={styles.title}>📋 Nenhum serviço encontrado neste orçamento</p>
      <p className={styles.subtitle}>
        Este orçamento não possui serviços cadastrados ou ainda não foi completamente processado.
      </p>
    </div>
  );
};
```

**CSS:** `EmptyState.module.css`
```css
.card {
  background: #fff;
  border-radius: 10px;
  padding: 48px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  text-align: center;
}

.title {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 16px;
}

.subtitle {
  color: #999;
  font-size: 0.95rem;
  margin: 0;
}
```

#### 3.5. ServiceAlert
**Arquivo:** `app/dashboard/partner/execution-evidence/components/ServiceAlert.tsx`
```typescript
import React from 'react';
import styles from './ServiceAlert.module.css';

export const ServiceAlert: React.FC = () => {
  return (
    <div className={styles.alert}>
      <span className={styles.icon}>⚠️</span>
      <span>
        <strong>Atenção:</strong> Este serviço precisa de pelo menos uma evidência antes da finalização
      </span>
    </div>
  );
};
```

**CSS:** `ServiceAlert.module.css`
```css
.alert {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #92400e;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.icon {
  font-size: 18px;
}
```

#### 3.6. ServiceActions
**Arquivo:** `app/dashboard/partner/execution-evidence/components/ServiceActions.tsx`
```typescript
import React from 'react';
import { FaCamera, FaCheck } from 'react-icons/fa';
import styles from './ServiceActions.module.css';

interface ServiceActionsProps {
  serviceId: string;
  onImageUpload: (file: File) => void;
  onComplete: () => void;
  uploading: boolean;
  completing: boolean;
}

export const ServiceActions: React.FC<ServiceActionsProps> = ({
  serviceId,
  onImageUpload,
  onComplete,
  uploading,
  completing,
}) => {
  return (
    <div className={styles.actions}>
      <label htmlFor={`upload-${serviceId}`} className={styles.uploadButton}>
        <FaCamera size={16} />
        {uploading ? 'Enviando...' : 'Adicionar Foto'}
      </label>
      <input
        id={`upload-${serviceId}`}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onImageUpload(file);
        }}
        disabled={uploading}
      />

      <button
        onClick={onComplete}
        disabled={completing}
        className={styles.completeButton}
      >
        <FaCheck size={16} />
        {completing ? 'Processando...' : 'Marcar como Concluído'}
      </button>
    </div>
  );
};
```

**CSS:** `ServiceActions.module.css`
```css
.actions {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.uploadButton {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.uploadButton:hover {
  background: #2563eb;
}

.fileInput {
  display: none;
}

.completeButton {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.completeButton:hover:not(:disabled) {
  background: #059669;
}

.completeButton:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

#### 3.7. EvidenceCard
**Arquivo:** `app/dashboard/partner/execution-evidence/components/EvidenceCard.tsx`
```typescript
import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { Evidence } from '../types';
import styles from './EvidenceCard.module.css';

interface EvidenceCardProps {
  evidence: Evidence;
  evidenceIndex: number;
  onDescriptionChange: (description: string) => void;
  onRemove: () => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  evidenceIndex,
  onDescriptionChange,
  onRemove,
}) => {
  return (
    <div className={styles.card}>
      <img
        src={evidence.image_url}
        alt={`Evidência ${evidenceIndex + 1}`}
        className={styles.image}
      />
      <div className={styles.content}>
        <textarea
          placeholder="Descrição da evidência (opcional)"
          value={evidence.description}
          onChange={e => onDescriptionChange(e.target.value)}
          className={styles.textarea}
        />
        <button onClick={onRemove} className={styles.removeButton}>
          <FaTrash size={12} />
          Remover
        </button>
      </div>
    </div>
  );
};
```

**CSS:** `EvidenceCard.module.css`
```css
.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.content {
  padding: 12px;
}

.textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 8px;
  font-family: inherit;
}

.textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.removeButton {
  width: 100%;
  padding: 6px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  transition: background 0.2s;
}

.removeButton:hover {
  background: #dc2626;
}
```

#### 3.8. EvidenceGrid
**Arquivo:** `app/dashboard/partner/execution-evidence/components/EvidenceGrid.tsx`
```typescript
import React from 'react';
import { Evidence } from '../types';
import { EvidenceCard } from './EvidenceCard';
import styles from './EvidenceGrid.module.css';

interface EvidenceGridProps {
  evidences: Evidence[];
  onDescriptionChange: (index: number, description: string) => void;
  onRemove: (index: number) => void;
}

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({
  evidences,
  onDescriptionChange,
  onRemove,
}) => {
  if (evidences.length === 0) {
    return <p className={styles.empty}>Nenhuma evidência adicionada ainda</p>;
  }

  return (
    <div className={styles.grid}>
      {evidences.map((evidence, index) => (
        <EvidenceCard
          key={index}
          evidence={evidence}
          evidenceIndex={index}
          onDescriptionChange={desc => onDescriptionChange(index, desc)}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
};
```

**CSS:** `EvidenceGrid.module.css`
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.empty {
  color: #999;
  font-style: italic;
  margin-top: 16px;
}
```

#### 3.9. ServiceCard
**Arquivo:** `app/dashboard/partner/execution-evidence/components/ServiceCard.tsx`
```typescript
import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { ServiceWithEvidences } from '../types';
import { ServiceAlert } from './ServiceAlert';
import { ServiceActions } from './ServiceActions';
import { EvidenceGrid } from './EvidenceGrid';
import { formatDateTime } from '../utils/formatters';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  service: ServiceWithEvidences;
  serviceIndex: number;
  onImageUpload: (file: File) => void;
  onComplete: () => void;
  onEvidenceDescriptionChange: (index: number, description: string) => void;
  onEvidenceRemove: (index: number) => void;
  uploading: boolean;
  completing: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  serviceIndex,
  onImageUpload,
  onComplete,
  onEvidenceDescriptionChange,
  onEvidenceRemove,
  uploading,
  completing,
}) => {
  const isCompleted = !!service.completed_at;
  const hasNoEvidences = service.evidences.length === 0;

  return (
    <div className={`${styles.card} ${isCompleted ? styles.completed : ''}`}>
      {isCompleted && (
        <div className={styles.completedBadge}>
          <FaCheck size={12} />
          Concluído
        </div>
      )}

      <h3 className={styles.title}>
        {serviceIndex + 1}. {service.description}
      </h3>

      {!isCompleted && hasNoEvidences && <ServiceAlert />}

      {!isCompleted && (
        <ServiceActions
          serviceId={service.id}
          onImageUpload={onImageUpload}
          onComplete={onComplete}
          uploading={uploading}
          completing={completing}
        />
      )}

      {isCompleted && (
        <p className={styles.completedText}>
          ✓ Serviço concluído em {formatDateTime(service.completed_at!)}
        </p>
      )}

      <EvidenceGrid
        evidences={service.evidences}
        onDescriptionChange={onEvidenceDescriptionChange}
        onRemove={onEvidenceRemove}
      />
    </div>
  );
};
```

**CSS:** `ServiceCard.module.css`
```css
.card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  border: 1px solid #e5e7eb;
  position: relative;
}

.card.completed {
  border: 2px solid #10b981;
}

.completedBadge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #10b981;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  padding-right: 100px;
}

.completedText {
  color: #10b981;
  font-size: 14px;
  margin-bottom: 16px;
  font-style: italic;
}
```

#### 3.10. FinalizeActions
**Arquivo:** `app/dashboard/partner/execution-evidence/components/FinalizeActions.tsx`
```typescript
import React from 'react';
import { FaSave, FaCheck } from 'react-icons/fa';
import { ServiceWithEvidences } from '../types';
import { validateCanFinalize, getTooltipMessage } from '../utils/validations';
import styles from './FinalizeActions.module.css';

interface FinalizeActionsProps {
  services: ServiceWithEvidences[];
  onSave: () => void;
  onFinalize: () => void;
  saving: boolean;
}

export const FinalizeActions: React.FC<FinalizeActionsProps> = ({
  services,
  onSave,
  onFinalize,
  saving,
}) => {
  const { canFinalize, servicesWithoutEvidences, servicesNotCompleted } = validateCanFinalize(services);
  const tooltipMessage = getTooltipMessage(servicesWithoutEvidences, servicesNotCompleted);

  return (
    <div className={styles.actions}>
      <button onClick={onSave} disabled={saving} className={styles.saveButton}>
        <FaSave size={16} />
        {saving ? 'Salvando...' : 'Salvar Progresso'}
      </button>

      <div className={styles.finalizeContainer}>
        <button
          onClick={onFinalize}
          disabled={saving || !canFinalize}
          title={!canFinalize ? tooltipMessage : 'Finalizar execução do orçamento'}
          className={`${styles.finalizeButton} ${!canFinalize ? styles.disabled : ''}`}
        >
          <FaCheck size={16} />
          {saving ? 'Finalizando...' : 'Finalizar Execução'}
        </button>
        
        {!canFinalize && !saving && (
          <div className={styles.tooltip}>
            ⚠️ {tooltipMessage}
          </div>
        )}
      </div>
    </div>
  );
};
```

**CSS:** `FinalizeActions.module.css`
```css
.actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
}

.saveButton,
.finalizeButton {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.saveButton {
  background: #10b981;
  color: white;
}

.saveButton:hover:not(:disabled) {
  background: #059669;
}

.finalizeButton {
  background: #072e4c;
  color: white;
}

.finalizeButton:hover:not(:disabled) {
  background: #0a3d63;
}

.finalizeButton.disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.saveButton:disabled,
.finalizeButton:disabled {
  cursor: not-allowed;
}

.finalizeContainer {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  bottom: -30px;
  right: 0;
  background: #ef4444;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

---

### **Fase 4: Refatorar page.tsx (Container)**

**Arquivo Refatorado:** `app/dashboard/partner/execution-evidence/page.tsx`

```typescript
'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';

// Hooks
import { useToast } from './hooks/useToast';
import { useExecutionData } from './hooks/useExecutionData';
import { useEvidenceManager } from './hooks/useEvidenceManager';
import { useImageUpload } from './hooks/useImageUpload';
import { useServiceCompletion } from './hooks/useServiceCompletion';
import { useExecutionFinalize } from './hooks/useExecutionFinalize';

// Components
import { LoadingState } from './components/LoadingState';
import { ExecutionHeader } from './components/ExecutionHeader';
import { EmptyState } from './components/EmptyState';
import { ServiceCard } from './components/ServiceCard';
import { FinalizeActions } from './components/FinalizeActions';
import { Toast } from './components/Toast';

import styles from './page.module.css';

function ExecutionEvidenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');

  // Hooks
  const { toast, showToast } = useToast();
  const { loading, services, vehicleInfo, setServices, reloadData } = useExecutionData(quoteId);
  const { addEvidence, removeEvidence, updateEvidenceDescription } = useEvidenceManager(setServices);
  const { uploading, uploadImage } = useImageUpload(quoteId);
  const { completing, completeService } = useServiceCompletion(quoteId);
  const { finalizing, finalize, saveProgress } = useExecutionFinalize(quoteId);

  // Handlers
  const handleBack = () => router.push('/dashboard');

  const handleImageUpload = async (serviceId: string, file: File) => {
    const result = await uploadImage(serviceId, file);
    
    if (result.success && result.url) {
      addEvidence(serviceId, result.url);
      showToast('Imagem carregada com sucesso', 'success');
    } else {
      showToast(result.error || 'Erro ao fazer upload', 'error');
    }
  };

  const handleCompleteService = async (serviceId: string, serviceName: string) => {
    const result = await completeService(serviceId, serviceName);
    
    if (result.success) {
      showToast(result.message!, 'success');
      await reloadData();
    } else {
      showToast(result.error || 'Erro ao concluir serviço', 'error');
    }
  };

  const handleSave = async () => {
    const result = await saveProgress(services);
    
    if (result.success) {
      showToast(result.message!, 'success');
      await reloadData();
    } else {
      showToast(result.error || 'Erro ao salvar', 'error');
    }
  };

  const handleFinalize = async () => {
    const result = await finalize(services);
    
    if (result.success) {
      showToast(result.message!, 'success');
    } else {
      showToast(result.error || 'Erro ao finalizar', 'error');
    }
  };

  // Check for missing quoteId
  if (!quoteId) {
    router.push('/dashboard');
    return null;
  }

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Main render
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.container}>
        <ExecutionHeader vehicleInfo={vehicleInfo} onBack={handleBack} />

        {services.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                serviceIndex={index}
                onImageUpload={file => handleImageUpload(service.id, file)}
                onComplete={() => handleCompleteService(service.id, service.description)}
                onEvidenceDescriptionChange={(evidenceIndex, desc) =>
                  updateEvidenceDescription(service.id, evidenceIndex, desc)
                }
                onEvidenceRemove={evidenceIndex => removeEvidence(service.id, evidenceIndex)}
                uploading={uploading}
                completing={completing}
              />
            ))}

            <FinalizeActions
              services={services}
              onSave={handleSave}
              onFinalize={handleFinalize}
              saving={finalizing}
            />
          </>
        )}
      </main>

      <Toast toast={toast} />
    </div>
  );
}

export default function ExecutionEvidencePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExecutionEvidenceContent />
    </Suspense>
  );
}
```

**CSS:** `page.module.css`
```css
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
}
```

**Resultado:**
- **Antes:** 866 linhas
- **Depois:** ~140 linhas ✅
- **Complexidade:** Reduzida drasticamente
- **Testabilidade:** Cada componente pode ser testado isoladamente
- **Manutenibilidade:** Mudanças localizadas

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Linhas de Código** | 866 | ~140 | ✅ 84% redução |
| **Componentes Extraídos** | 0 | 10 | ✅ Composição |
| **Hooks Customizados** | 0 | 6 | ✅ Separação de lógica |
| **CSS Modules** | 0 | 11 | ✅ Estilos organizados |
| **Níveis de Indentação** | 6-8 | 2-3 | ✅ Simplicidade |
| **Responsabilidades** | ~12 | 1 | ✅ SRP |
| **Testabilidade** | Impossível | Alta | ✅ Isolamento |

---

## 🧪 Checklist de Testes

Após refatoração, validar:

**Carregamento de Dados:**
- [ ] Carrega ordem de serviço do quoteId
- [ ] Exibe informações do veículo
- [ ] Carrega evidências existentes
- [ ] Trata erro de serviço não encontrado

**Upload de Imagens:**
- [ ] Upload de imagem funciona
- [ ] Preview da imagem aparece
- [ ] Valida tipo de arquivo
- [ ] Valida tamanho de arquivo
- [ ] Exibe progresso de upload

**Gerenciamento de Evidências:**
- [ ] Adiciona evidência ao serviço
- [ ] Remove evidência
- [ ] Edita descrição da evidência
- [ ] Mantém evidências salvas após reload

**Conclusão de Serviços:**
- [ ] Marca serviço como concluído
- [ ] Atualiza visual do serviço concluído
- [ ] Exibe data/hora de conclusão
- [ ] Detecta quando todos serviços concluídos

**Validações:**
- [ ] Bloqueia finalização sem evidências
- [ ] Bloqueia finalização sem serviços concluídos
- [ ] Exibe mensagens de validação claras
- [ ] Tooltip mostra motivo do bloqueio

**Salvar e Finalizar:**
- [ ] Salva progresso corretamente
- [ ] Finaliza execução completa
- [ ] Atualiza status do veículo
- [ ] Redireciona ao dashboard após finalização

**UI/UX:**
- [ ] Loading states funcionam
- [ ] Toast notifications aparecem
- [ ] Botão "Voltar" funciona
- [ ] Estilos responsivos

---

## 🚀 Ordem de Implementação

1. ✅ **Fase 1**: Criar estrutura de diretórios e extrair types, utils, validações
2. ✅ **Fase 2**: Criar hooks customizados (6 hooks)
3. ✅ **Fase 3**: Criar componentes base (10 componentes + CSS)
4. ✅ **Fase 4**: Refatorar page.tsx como container
5. ✅ **Testes**: Validar todos os fluxos
6. ✅ **Limpeza**: Remover código antigo, logs desnecessários

---

## 📝 Notas Importantes

- **Não quebrar funcionalidade**: Cada fase deve ser testada antes de continuar
- **Commits incrementais**: Um commit por componente/hook criado
- **CSS Modules**: Cada componente tem seu próprio CSS (sem estilos inline)
- **Types centralizados**: `types/index.ts` na pasta do feature
- **Hooks reutilizáveis**: Podem ser usados em outros contextos
- **Validações extraídas**: Facilita testes e reutilização
- **Logger**: Manter logs onde fazem sentido (erros, eventos importantes)

---

## ✨ Benefícios Esperados

1. **Manutenibilidade**: Mudanças localizadas, fácil de encontrar código
2. **Testabilidade**: Componentes pequenos, fáceis de testar isoladamente
3. **Reusabilidade**: Componentes podem ser usados em outros lugares
4. **Legibilidade**: Código mais limpo, fácil de entender (10x mais fácil)
5. **Escalabilidade**: Fácil adicionar novas funcionalidades
6. **Performance**: Componentes podem ser otimizados individualmente (React.memo)
7. **Colaboração**: Múltiplos devs podem trabalhar em componentes diferentes
8. **Onboarding**: Novos devs entendem código muito mais rapidamente
9. **Debug**: Erros são mais fáceis de localizar e corrigir
10. **Refactoring**: Mudanças futuras serão muito mais simples

---

## 🔥 PRIORIDADE

**Este arquivo é CRÍTICO e deve ser refatorado.**

Com 866 linhas, ele é:
- ❌ Difícil de manter
- ❌ Difícil de testar
- ❌ Violando princípios SOLID
- ❌ Gerando débito técnico

**Estimativa de esforço:** 2-3 dias de trabalho focado

**ROI:** ALTO - A manutenção futura será 10x mais rápida

---

**Status:** 📋 **Plano Aprovado - PRIORIDADE ALTA**

**Próximos Passos:**
1. Revisar e aprovar o plano
2. Criar branch `refactor/execution-evidence`
3. Executar fases 1-4
4. Testar extensivamente
5. Merge e deploy

---

**Padrão Similar:** Este plano segue o mesmo padrão bem-sucedido usado em:
- ✅ `dynamic-checklist` (1045→143 linhas, 86% redução)
- ✅ `VehicleDetails` (628→180 linhas, 71% redução)
