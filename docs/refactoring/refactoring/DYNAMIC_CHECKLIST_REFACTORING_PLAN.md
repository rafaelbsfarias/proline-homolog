# 🔧 Plano de Refatoração: dynamic-checklist/page.tsx

**Arquivo:** `app/dashboard/partner/dynamic-checklist/page.tsx`  
**Linhas Atuais:** 1045 linhas  
**Status:** 🔴 **CRÍTICO - Violando múltiplos princípios do projeto**

---

## 📋 Análise de Violações

### ❌ Princípios Violados

1. **Single Responsibility Principle (SOLID)**
   - O componente gerencia: estado de anomalias, modal de peças, upload de fotos, validações, navegação, renderização de UI
   - Responsabilidade única violada: faz TUDO ao mesmo tempo

2. **Composition Pattern**
   - Monolítico: não usa composição de componentes menores
   - Tudo inline com 1045 linhas de código
   - Estilos inline em todo lugar

3. **KISS (Keep It Simple, Stupid)**
   - Complexidade extrema: 1045 linhas em um único arquivo
   - Impossível de entender rapidamente
   - Difícil de testar e manter

4. **DRY (Don't Repeat Yourself)**
   - Estilos inline repetidos dezenas de vezes
   - Lógica de manipulação de estado duplicada
   - Estruturas de layout similares repetidas

5. **Object Calisthenics**
   - Níveis de indentação excessivos (6-8 níveis)
   - Funções muito longas
   - Múltiplos estados gerenciados no mesmo componente

6. **Separation of Concerns**
   - Lógica de negócio misturada com apresentação
   - Validações inline
   - Sem separação entre container e presentation

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
app/dashboard/partner/dynamic-checklist/
├── page.tsx                              # 🎯 Container (< 150 linhas)
├── page.module.css                       # ✅ Estilos do container
│
├── components/                           # 📂 NOVO - Componentes da página
│   ├── DynamicChecklistHeader.tsx        # Header com botão voltar
│   ├── DynamicChecklistHeader.module.css
│   ├── VehicleInfoCard.tsx               # Card de informações do veículo
│   ├── VehicleInfoCard.module.css
│   ├── InspectionDataCard.tsx            # Card de dados de inspeção
│   ├── InspectionDataCard.module.css
│   ├── AnomaliesSection.tsx              # Seção principal de anomalias
│   ├── AnomaliesSection.module.css
│   ├── AnomalyCard.tsx                   # Card individual de anomalia
│   ├── AnomalyCard.module.css
│   ├── PhotoGallery.tsx                  # Galeria de fotos com preview
│   ├── PhotoGallery.module.css
│   ├── PartRequestCard.tsx               # Card de solicitação de peça
│   ├── PartRequestCard.module.css
│   ├── PartRequestModal.tsx              # Modal de solicitação de peça
│   ├── PartRequestModal.module.css
│   ├── ActionButtons.tsx                 # Botões de ação (Salvar/Cancelar)
│   ├── ActionButtons.module.css
│   ├── MessageBanner.tsx                 # Banner de mensagens (erro/sucesso)
│   ├── MessageBanner.module.css
│   └── LoadingState.tsx                  # Estado de carregamento
│
├── hooks/                                # 📂 NOVO - Hooks customizados
│   ├── useAnomaliesManager.ts            # Gerencia estado das anomalias
│   ├── usePartRequestModal.ts            # Gerencia estado do modal de peças
│   ├── usePhotoUpload.ts                 # Gerencia upload de fotos
│   └── useDynamicChecklistSave.ts        # Gerencia salvamento completo
│
├── utils/                                # 📂 NOVO - Utilitários
│   ├── anomalyValidation.ts              # Validações de anomalias
│   ├── photoHelpers.ts                   # Helpers para manipulação de fotos
│   └── formatters.ts                     # Formatadores de dados
│
└── types/                                # 📂 NOVO - Types locais
    └── index.ts                          # AnomalyEvidence, PartRequest, etc.
```

---

## 🔄 Fases da Refatoração

### **Fase 1: Preparação (Sem Breaking Changes)**

#### 1.1. Criar Estrutura de Diretórios
```bash
mkdir -p app/dashboard/partner/dynamic-checklist/{components,hooks,utils,types}
```

#### 1.2. Extrair Types
**Arquivo:** `app/dashboard/partner/dynamic-checklist/types/index.ts`
```typescript
export interface AnomalyEvidence {
  id: string;
  description: string;
  photos: (File | string)[];
  partRequest?: PartRequest;
}

export interface PartRequest {
  partName: string;
  partDescription?: string;
  quantity: number;
  estimatedPrice?: number;
}

export interface PartRequestModalState {
  isOpen: boolean;
  anomalyId: string | null;
  partName: string;
  partDescription: string;
  quantity: number;
  estimatedPrice: string;
}

export interface VehicleInfo {
  brand: string;
  model: string;
  year?: number;
  plate: string;
  color?: string;
}

export interface InspectionFormData {
  date: string;
  odometer: number;
  fuelLevel: string;
  observations: string;
}
```

#### 1.3. Extrair Validações
**Arquivo:** `app/dashboard/partner/dynamic-checklist/utils/anomalyValidation.ts`
```typescript
import { AnomalyEvidence } from '../types';

export const hasValidAnomaly = (anomalies: AnomalyEvidence[]): boolean => {
  return anomalies.some(anomaly => anomaly.description.trim() !== '');
};

export const validatePartRequest = (partName: string, quantity: number): boolean => {
  return partName.trim().length > 0 && quantity > 0;
};

export const isAnomalyComplete = (anomaly: AnomalyEvidence): boolean => {
  return anomaly.description.trim().length > 0 && anomaly.photos.length > 0;
};
```

#### 1.4. Extrair Photo Helpers
**Arquivo:** `app/dashboard/partner/dynamic-checklist/utils/photoHelpers.ts`
```typescript
export const isFilePhoto = (photo: File | string): photo is File => {
  return photo instanceof File;
};

export const isUrlPhoto = (photo: File | string): photo is string => {
  return typeof photo === 'string';
};

export const getPhotoPreviewUrl = (photo: File | string): string => {
  if (isFilePhoto(photo)) {
    return URL.createObjectURL(photo);
  }
  return photo;
};

export const getPhotoType = (photo: File | string): 'new' | 'saved' => {
  return isFilePhoto(photo) ? 'new' : 'saved';
};

export const cleanupPhotoUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
```

---

### **Fase 2: Criar Hooks Customizados**

#### 2.1. useAnomaliesManager
**Arquivo:** `app/dashboard/partner/dynamic-checklist/hooks/useAnomaliesManager.ts`
```typescript
import { useState, useEffect } from 'react';
import { AnomalyEvidence } from '../types';

interface UseAnomaliesManagerProps {
  initialAnomalies: AnomalyEvidence[];
  loading: boolean;
}

export const useAnomaliesManager = ({ initialAnomalies, loading }: UseAnomaliesManagerProps) => {
  const [anomalies, setAnomalies] = useState<AnomalyEvidence[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sincronizar apenas na primeira carga
  useEffect(() => {
    if (!hasInitialized && !loading) {
      setAnomalies(initialAnomalies);
      setHasInitialized(true);
    }
  }, [initialAnomalies, loading, hasInitialized]);

  const addAnomaly = () => {
    const newAnomaly: AnomalyEvidence = {
      id: Date.now().toString(),
      description: '',
      photos: [],
    };
    setAnomalies(prev => [...prev, newAnomaly]);
  };

  const removeAnomaly = (id: string) => {
    setAnomalies(prev => prev.filter(anomaly => anomaly.id !== id));
  };

  const updateDescription = (id: string, description: string) => {
    setAnomalies(prev =>
      prev.map(anomaly => (anomaly.id === id ? { ...anomaly, description } : anomaly))
    );
  };

  const addPhotos = (id: string, files: FileList) => {
    setAnomalies(prev =>
      prev.map(anomaly => {
        if (anomaly.id === id) {
          const existingUrls = anomaly.photos.filter(photo => typeof photo === 'string');
          const newFiles = Array.from(files);
          return { ...anomaly, photos: [...existingUrls, ...newFiles] };
        }
        return anomaly;
      })
    );
  };

  const removePhoto = (anomalyId: string, photoIndex: number) => {
    setAnomalies(prev =>
      prev.map(anomaly => {
        if (anomaly.id === anomalyId) {
          const updatedPhotos = anomaly.photos.filter((_, index) => index !== photoIndex);
          return { ...anomaly, photos: updatedPhotos };
        }
        return anomaly;
      })
    );
  };

  const updatePartRequest = (anomalyId: string, partRequest: AnomalyEvidence['partRequest']) => {
    setAnomalies(prev =>
      prev.map(anomaly => (anomaly.id === anomalyId ? { ...anomaly, partRequest } : anomaly))
    );
  };

  const removePartRequest = (anomalyId: string) => {
    setAnomalies(prev =>
      prev.map(anomaly =>
        anomaly.id === anomalyId ? { ...anomaly, partRequest: undefined } : anomaly
      )
    );
  };

  return {
    anomalies,
    addAnomaly,
    removeAnomaly,
    updateDescription,
    addPhotos,
    removePhoto,
    updatePartRequest,
    removePartRequest,
  };
};
```

#### 2.2. usePartRequestModal
**Arquivo:** `app/dashboard/partner/dynamic-checklist/hooks/usePartRequestModal.ts`
```typescript
import { useState } from 'react';
import { PartRequestModalState, PartRequest } from '../types';

const INITIAL_MODAL_STATE: PartRequestModalState = {
  isOpen: false,
  anomalyId: null,
  partName: '',
  partDescription: '',
  quantity: 1,
  estimatedPrice: '',
};

export const usePartRequestModal = () => {
  const [modalState, setModalState] = useState<PartRequestModalState>(INITIAL_MODAL_STATE);

  const open = (anomalyId: string, existingRequest?: PartRequest) => {
    setModalState({
      isOpen: true,
      anomalyId,
      partName: existingRequest?.partName || '',
      partDescription: existingRequest?.partDescription || '',
      quantity: existingRequest?.quantity || 1,
      estimatedPrice: existingRequest?.estimatedPrice?.toString() || '',
    });
  };

  const close = () => {
    setModalState(INITIAL_MODAL_STATE);
  };

  const updateField = (field: keyof PartRequestModalState, value: string | number) => {
    setModalState(prev => ({ ...prev, [field]: value }));
  };

  const buildPartRequest = (): PartRequest | null => {
    if (!modalState.partName.trim()) return null;

    return {
      partName: modalState.partName,
      partDescription: modalState.partDescription,
      quantity: modalState.quantity,
      estimatedPrice: modalState.estimatedPrice
        ? parseFloat(modalState.estimatedPrice)
        : undefined,
    };
  };

  return {
    modalState,
    open,
    close,
    updateField,
    buildPartRequest,
  };
};
```

#### 2.3. useDynamicChecklistSave
**Arquivo:** `app/dashboard/partner/dynamic-checklist/hooks/useDynamicChecklistSave.ts`
```typescript
import { useRouter } from 'next/navigation';
import { AnomalyEvidence } from '../types';

interface UseDynamicChecklistSaveProps {
  saveChecklist: () => Promise<void>;
  saveAnomalies: (anomalies: AnomalyEvidence[]) => Promise<void>;
}

export const useDynamicChecklistSave = ({
  saveChecklist,
  saveAnomalies,
}: UseDynamicChecklistSaveProps) => {
  const router = useRouter();

  const save = async (anomalies: AnomalyEvidence[]) => {
    try {
      // Persistir checklist técnico para habilitar edição de orçamento
      await saveChecklist();

      // Salvar anomalias
      await saveAnomalies(anomalies);

      // Voltar ao dashboard após salvar
      router.push('/dashboard');
    } catch (error) {
      // Erro já é tratado pelo hook
      throw error;
    }
  };

  return { save };
};
```

---

### **Fase 3: Criar Componentes Base**

#### 3.1. MessageBanner
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/MessageBanner.tsx`
```typescript
import React from 'react';
import styles from './MessageBanner.module.css';

interface MessageBannerProps {
  type: 'error' | 'success';
  message: string;
}

export const MessageBanner: React.FC<MessageBannerProps> = ({ type, message }) => {
  return <div className={`${styles.banner} ${styles[type]}`}>{message}</div>;
};
```

**CSS:** `MessageBanner.module.css`
```css
.banner {
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.banner.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.banner.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}
```

#### 3.2. LoadingState
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/LoadingState.tsx`
```typescript
import React from 'react';
import { Loading } from '@/modules/common/components/Loading/Loading';
import styles from './LoadingState.module.css';

export const LoadingState: React.FC = () => {
  return (
    <div className={styles.container}>
      <Loading />
    </div>
  );
};
```

#### 3.3. DynamicChecklistHeader
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/DynamicChecklistHeader.tsx`
```typescript
import React from 'react';
import styles from './DynamicChecklistHeader.module.css';

interface DynamicChecklistHeaderProps {
  onBack: () => void;
}

export const DynamicChecklistHeader: React.FC<DynamicChecklistHeaderProps> = ({ onBack }) => {
  return (
    <div className={styles.header}>
      <div className={styles.container}>
        <button onClick={onBack} className={styles.backButton}>
          ← Voltar ao Dashboard
        </button>
        <h1 className={styles.title}>Anomalias do Veículo</h1>
      </div>
    </div>
  );
};
```

#### 3.4. VehicleInfoCard
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/VehicleInfoCard.tsx`
```typescript
import React from 'react';
import { VehicleInfo } from '../types';
import styles from './VehicleInfoCard.module.css';

interface VehicleInfoCardProps {
  vehicle: VehicleInfo;
}

export const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({ vehicle }) => {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Informações do Veículo</h2>
      <div className={styles.grid}>
        <div className={styles.item}>
          <strong>Veículo:</strong> {vehicle.brand} {vehicle.model}{' '}
          {vehicle.year && `(${vehicle.year})`}
        </div>
        <div className={styles.item}>
          <strong>Placa:</strong> {vehicle.plate}
        </div>
        {vehicle.color && (
          <div className={styles.item}>
            <strong>Cor:</strong> {vehicle.color}
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 3.5. PhotoGallery
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/PhotoGallery.tsx`
```typescript
import React from 'react';
import { getPhotoPreviewUrl, getPhotoType } from '../utils/photoHelpers';
import styles from './PhotoGallery.module.css';

interface PhotoGalleryProps {
  photos: (File | string)[];
  onRemove: (index: number) => void;
  onError?: (index: number) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onRemove, onError }) => {
  if (photos.length === 0) return null;

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Imagens ({photos.length}):</h4>
      <div className={styles.grid}>
        {photos.map((photo, index) => {
          const previewUrl = getPhotoPreviewUrl(photo);
          const type = getPhotoType(photo);

          return (
            <div key={index} className={styles.photoWrapper}>
              <img
                src={previewUrl}
                alt={`Evidência ${index + 1}`}
                className={styles.photo}
                onError={() => onError?.(index)}
              />
              <div className={`${styles.badge} ${styles[type]}`}>
                {type === 'new' ? 'NOVA' : 'SALVA'}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className={styles.removeButton}
                title="Remover imagem"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### 3.6. PartRequestCard
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/PartRequestCard.tsx`
```typescript
import React from 'react';
import { PartRequest } from '../types';
import styles from './PartRequestCard.module.css';

interface PartRequestCardProps {
  partRequest?: PartRequest;
  onEdit: () => void;
  onRemove: () => void;
  onAdd: () => void;
}

export const PartRequestCard: React.FC<PartRequestCardProps> = ({
  partRequest,
  onEdit,
  onRemove,
  onAdd,
}) => {
  if (!partRequest) {
    return (
      <button type="button" onClick={onAdd} className={styles.addButton}>
        🛒 Solicitar Compra de Peças
      </button>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>🔧 Solicitação de Peça</h4>
        <button type="button" onClick={onRemove} className={styles.removeButton}>
          Remover
        </button>
      </div>
      <div className={styles.content}>
        <p className={styles.item}>
          <strong>Peça:</strong> {partRequest.partName}
        </p>
        {partRequest.partDescription && (
          <p className={styles.item}>
            <strong>Descrição:</strong> {partRequest.partDescription}
          </p>
        )}
        <p className={styles.item}>
          <strong>Quantidade:</strong> {partRequest.quantity}
        </p>
        {partRequest.estimatedPrice && (
          <p className={styles.item}>
            <strong>Preço Estimado:</strong> R$ {partRequest.estimatedPrice.toFixed(2)}
          </p>
        )}
      </div>
      <button type="button" onClick={onEdit} className={styles.editButton}>
        Editar Solicitação
      </button>
    </div>
  );
};
```

#### 3.7. AnomalyCard
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/AnomalyCard.tsx`
```typescript
import React from 'react';
import { AnomalyEvidence } from '../types';
import { PhotoGallery } from './PhotoGallery';
import { PartRequestCard } from './PartRequestCard';
import styles from './AnomalyCard.module.css';

interface AnomalyCardProps {
  anomaly: AnomalyEvidence;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onUpdateDescription: (description: string) => void;
  onAddPhotos: (files: FileList) => void;
  onRemovePhoto: (photoIndex: number) => void;
  onOpenPartRequestModal: () => void;
  onRemovePartRequest: () => void;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({
  anomaly,
  index,
  canRemove,
  onRemove,
  onUpdateDescription,
  onAddPhotos,
  onRemovePhoto,
  onOpenPartRequestModal,
  onRemovePartRequest,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Anomalia {index + 1}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className={styles.removeButton}>
            Remover
          </button>
        )}
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Descrição da Anomalia *</label>
        <textarea
          value={anomaly.description}
          onChange={e => onUpdateDescription(e.target.value)}
          placeholder="Descreva a anomalia encontrada..."
          required
          className={styles.textarea}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Evidências (Fotos)</label>

        <PhotoGallery
          photos={anomaly.photos}
          onRemove={onRemovePhoto}
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={e => e.target.files && onAddPhotos(e.target.files)}
          className={styles.fileInput}
        />
        <p className={styles.hint}>
          Você pode enviar múltiplas imagens. Imagens com borda azul são novas, com borda verde já
          foram salvas.
        </p>
      </div>

      <div className={styles.partRequestSection}>
        <PartRequestCard
          partRequest={anomaly.partRequest}
          onEdit={onOpenPartRequestModal}
          onRemove={onRemovePartRequest}
          onAdd={onOpenPartRequestModal}
        />
      </div>
    </div>
  );
};
```

#### 3.8. AnomaliesSection
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/AnomaliesSection.tsx`
```typescript
import React from 'react';
import { AnomalyEvidence } from '../types';
import { AnomalyCard } from './AnomalyCard';
import styles from './AnomaliesSection.module.css';

interface AnomaliesSectionProps {
  anomalies: AnomalyEvidence[];
  onAddAnomaly: () => void;
  onRemoveAnomaly: (id: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onAddPhotos: (id: string, files: FileList) => void;
  onRemovePhoto: (anomalyId: string, photoIndex: number) => void;
  onOpenPartRequestModal: (anomalyId: string) => void;
  onRemovePartRequest: (anomalyId: string) => void;
}

export const AnomaliesSection: React.FC<AnomaliesSectionProps> = ({
  anomalies,
  onAddAnomaly,
  onRemoveAnomaly,
  onUpdateDescription,
  onAddPhotos,
  onRemovePhoto,
  onOpenPartRequestModal,
  onRemovePartRequest,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Evidências e Anomalias {anomalies.length > 0 && `(${anomalies.length})`}
        </h2>
        <button type="button" onClick={onAddAnomaly} className={styles.addButton}>
          + Adicionar Anomalia
        </button>
      </div>

      {anomalies.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            Nenhuma anomalia registrada. Clique em &quot;+ Adicionar Anomalia&quot; para começar.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {anomalies.map((anomaly, index) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              index={index}
              canRemove={anomalies.length > 1}
              onRemove={() => onRemoveAnomaly(anomaly.id)}
              onUpdateDescription={description => onUpdateDescription(anomaly.id, description)}
              onAddPhotos={files => onAddPhotos(anomaly.id, files)}
              onRemovePhoto={photoIndex => onRemovePhoto(anomaly.id, photoIndex)}
              onOpenPartRequestModal={() => onOpenPartRequestModal(anomaly.id)}
              onRemovePartRequest={() => onRemovePartRequest(anomaly.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

#### 3.9. PartRequestModal
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/PartRequestModal.tsx`
```typescript
import React from 'react';
import { PartRequestModalState } from '../types';
import styles from './PartRequestModal.module.css';

interface PartRequestModalProps {
  modalState: PartRequestModalState;
  onClose: () => void;
  onSave: () => void;
  onUpdateField: (field: keyof PartRequestModalState, value: string | number) => void;
}

export const PartRequestModal: React.FC<PartRequestModalProps> = ({
  modalState,
  onClose,
  onSave,
  onUpdateField,
}) => {
  if (!modalState.isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Solicitar Compra de Peças</h3>

        <div className={styles.field}>
          <label className={styles.label}>Nome da Peça *</label>
          <input
            type="text"
            value={modalState.partName}
            onChange={e => onUpdateField('partName', e.target.value)}
            placeholder="Ex: Pastilha de freio dianteira"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descrição (opcional)</label>
          <textarea
            value={modalState.partDescription}
            onChange={e => onUpdateField('partDescription', e.target.value)}
            placeholder="Especificações, marca sugerida, etc."
            rows={3}
            className={styles.textarea}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Quantidade *</label>
          <input
            type="number"
            min="1"
            value={modalState.quantity}
            onChange={e => onUpdateField('quantity', parseInt(e.target.value) || 1)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Preço Estimado (opcional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={modalState.estimatedPrice}
            onChange={e => onUpdateField('estimatedPrice', e.target.value)}
            placeholder="0.00"
            className={styles.input}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!modalState.partName.trim()}
            className={styles.saveButton}
          >
            Salvar Solicitação
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### 3.10. ActionButtons
**Arquivo:** `app/dashboard/partner/dynamic-checklist/components/ActionButtons.tsx`
```typescript
import React from 'react';
import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onCancel, onSave, saving }) => {
  return (
    <div className={styles.card}>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={styles.cancelButton}
        >
          Cancelar
        </button>

        <button type="button" onClick={onSave} disabled={saving} className={styles.saveButton}>
          {saving ? 'Salvando...' : 'Salvar Anomalias'}
        </button>
      </div>
    </div>
  );
};
```

---

### **Fase 4: Refatorar page.tsx (Container)**

**Arquivo Refatorado:** `app/dashboard/partner/dynamic-checklist/page.tsx`

```typescript
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePartnerChecklist } from '@/modules/partner/hooks/usePartnerChecklist';
import InspectionData from '@/modules/partner/components/InspectionData';
import { getLogger } from '@/modules/logger';

// Hooks
import { useAnomaliesManager } from './hooks/useAnomaliesManager';
import { usePartRequestModal } from './hooks/usePartRequestModal';
import { useDynamicChecklistSave } from './hooks/useDynamicChecklistSave';

// Components
import { LoadingState } from './components/LoadingState';
import { DynamicChecklistHeader } from './components/DynamicChecklistHeader';
import { VehicleInfoCard } from './components/VehicleInfoCard';
import { AnomaliesSection } from './components/AnomaliesSection';
import { PartRequestModal } from './components/PartRequestModal';
import { MessageBanner } from './components/MessageBanner';
import { ActionButtons } from './components/ActionButtons';

import styles from './page.module.css';

const logger = getLogger('partner:dynamic-checklist');

const DynamicChecklistPage = () => {
  const router = useRouter();
  const {
    form,
    vehicle,
    loading,
    error,
    success,
    saving,
    saveChecklist,
    anomalies: initialAnomalies,
    saveAnomalies,
  } = usePartnerChecklist();

  // Hooks customizados
  const {
    anomalies,
    addAnomaly,
    removeAnomaly,
    updateDescription,
    addPhotos,
    removePhoto,
    updatePartRequest,
    removePartRequest,
  } = useAnomaliesManager({ initialAnomalies, loading });

  const { modalState, open, close, updateField, buildPartRequest } = usePartRequestModal();

  const { save } = useDynamicChecklistSave({ saveChecklist, saveAnomalies });

  // Handlers
  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleOpenPartRequestModal = (anomalyId: string) => {
    const anomaly = anomalies.find(a => a.id === anomalyId);
    open(anomalyId, anomaly?.partRequest);
  };

  const handleSavePartRequest = () => {
    const partRequest = buildPartRequest();
    if (partRequest && modalState.anomalyId) {
      updatePartRequest(modalState.anomalyId, partRequest);
      close();
    }
  };

  const handleSave = async () => {
    try {
      await save(anomalies);
    } catch {
      // Erro já é tratado pelo hook
    }
  };

  // Loading State
  if (loading) {
    return <LoadingState />;
  }

  // Error State - Vehicle not found
  if (!vehicle) {
    return (
      <div className={styles.errorContainer}>
        <h1 className={styles.errorTitle}>Veículo não encontrado</h1>
        <p className={styles.errorMessage}>
          Não foi possível encontrar o veículo para este orçamento.
        </p>
        <button onClick={handleBack} className={styles.errorButton}>
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  // Main Render
  return (
    <div className={styles.page}>
      <DynamicChecklistHeader onBack={handleBack} />

      <div className={styles.container}>
        <VehicleInfoCard vehicle={vehicle} />

        <InspectionData
          inspectionDate={form.date}
          odometer={form.odometer}
          fuelLevel={form.fuelLevel}
          observations={form.observations}
        />

        <AnomaliesSection
          anomalies={anomalies}
          onAddAnomaly={addAnomaly}
          onRemoveAnomaly={removeAnomaly}
          onUpdateDescription={updateDescription}
          onAddPhotos={addPhotos}
          onRemovePhoto={removePhoto}
          onOpenPartRequestModal={handleOpenPartRequestModal}
          onRemovePartRequest={removePartRequest}
        />

        {error && <MessageBanner type="error" message={error} />}
        {success && <MessageBanner type="success" message={success} />}

        <ActionButtons onCancel={handleBack} onSave={handleSave} saving={saving} />
      </div>

      <PartRequestModal
        modalState={modalState}
        onClose={close}
        onSave={handleSavePartRequest}
        onUpdateField={updateField}
      />
    </div>
  );
};

export default DynamicChecklistPage;
```

**Resultado:**
- **Antes:** 1045 linhas
- **Depois:** ~150 linhas ✅
- **Complexidade:** Reduzida drasticamente
- **Testabilidade:** Cada componente pode ser testado isoladamente
- **Manutenibilidade:** Mudanças localizadas

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Linhas de Código** | 1045 | ~150 | ✅ 86% redução |
| **Componentes Extraídos** | 0 | 11 | ✅ Composição |
| **Hooks Customizados** | 1 | 4 | ✅ Separação de lógica |
| **CSS Modules** | 0 | 11 | ✅ Estilos organizados |
| **Níveis de Indentação** | 6-8 | 2-3 | ✅ Simplicidade |
| **Responsabilidades** | ~15 | 1 | ✅ SRP |
| **Testabilidade** | Impossível | Alta | ✅ Isolamento |

---

## 🧪 Checklist de Testes

Após refatoração, validar:

- [ ] Carregamento inicial de anomalias existentes
- [ ] Adicionar nova anomalia
- [ ] Remover anomalia
- [ ] Editar descrição da anomalia
- [ ] Upload de múltiplas fotos
- [ ] Remoção de fotos (novas e salvas)
- [ ] Preview de fotos (Files e URLs)
- [ ] Abrir modal de solicitação de peças
- [ ] Preencher formulário de peças
- [ ] Salvar solicitação de peças
- [ ] Editar solicitação existente
- [ ] Remover solicitação de peças
- [ ] Cancelar edição (voltar ao dashboard)
- [ ] Salvar anomalias completas
- [ ] Loading states funcionam
- [ ] Error states funcionam
- [ ] Success states funcionam
- [ ] Validações de campos obrigatórios

---

## 🚀 Ordem de Implementação

1. ✅ **Fase 1**: Criar estrutura de diretórios e extrair types, utils, validações
2. ✅ **Fase 2**: Criar hooks customizados (useAnomaliesManager, usePartRequestModal, etc.)
3. ✅ **Fase 3**: Criar componentes base (MessageBanner, LoadingState, PhotoGallery, etc.)
4. ✅ **Fase 4**: Criar componentes especializados (AnomalyCard, AnomaliesSection, etc.)
5. ✅ **Fase 5**: Refatorar page.tsx como container
6. ✅ **Fase 6**: Criar todos os CSS Modules
7. ✅ **Testes**: Validar todos os fluxos
8. ✅ **Limpeza**: Remover código antigo, logs de debug

---

## 📝 Notas Importantes

- **Não quebrar funcionalidade**: Cada fase deve ser testada antes de continuar
- **Commits incrementais**: Um commit por componente/hook criado
- **CSS Modules**: Cada componente tem seu próprio CSS (sem estilos inline)
- **Types centralizados**: `types/index.ts` na pasta do feature
- **Hooks reutilizáveis**: Podem ser usados em outros contextos
- **Documentação**: Cada componente com comentário de responsabilidade
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

**Este arquivo é CRÍTICO e deve ser refatorado o quanto antes.**

Com 1045 linhas, ele é:
- ❌ Impossível de manter
- ❌ Impossível de testar
- ❌ Impossível de entender rapidamente
- ❌ Violando todos os princípios SOLID
- ❌ Gerando débito técnico massivo

**Estimativa de esforço:** 2-3 dias de trabalho focado

**ROI:** ALTÍSSIMO - A manutenção futura será 10x mais rápida

---

**Status:** 📋 **Plano Aprovado - ALTA PRIORIDADE**

**Próximos Passos:**
1. Revisar e aprovar o plano
2. Criar branch `refactor/dynamic-checklist`
3. Executar fases 1-6
4. Testar extensivamente
5. Merge e deploy

