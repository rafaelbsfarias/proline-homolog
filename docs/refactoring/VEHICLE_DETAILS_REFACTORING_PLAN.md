# 🔧 Plano de Refatoração: VehicleDetails.tsx

**Arquivo:** `modules/vehicles/components/VehicleDetails.tsx`  
**Linhas Atuais:** 628 linhas  
**Status:** 🔴 **Violando múltiplos princípios do projeto**

---

## 📋 Análise de Violações

### ❌ Princípios Violados

1. **Single Responsibility Principle (SOLID)**
   - O componente gerencia: estado de modais, carregamento de checklists, formatação de dados, renderização de 7+ seções diferentes
   - Responsabilidade única violada: faz tudo ao mesmo tempo

2. **Composition Pattern**
   - Monolítico: não usa composição de componentes menores
   - Renderiza tudo inline sem separação de responsabilidades

3. **KISS (Keep It Simple, Stupid)**
   - Complexidade excessiva: 628 linhas em um único arquivo
   - Difícil de entender, testar e manter

4. **DRY (Don't Repeat Yourself)**
   - Lógica de formatação inline repetida (formatCurrency, formatDateBR, getStatusLabel)
   - Estrutura de cards similar repetida 7+ vezes

5. **Object Calisthenics**
   - Níveis de indentação excessivos
   - Múltiplos estados gerenciados no mesmo componente

---

## 🎯 Objetivos da Refatoração

1. **Reduzir complexidade**: componente principal < 150 linhas
2. **Separar responsabilidades**: cada seção em componente próprio
3. **Melhorar testabilidade**: componentes pequenos e isolados
4. **Facilitar manutenção**: mudanças localizadas, não globais
5. **Seguir composition pattern**: containers + componentes filhos
6. **Extrair lógica de negócio**: hooks e utils

---

## 📦 Estrutura Proposta

```
modules/vehicles/components/
├── VehicleDetails.tsx                    # 🎯 Container (< 150 linhas)
├── VehicleDetails.module.css             # ✅ Mantém
│
├── sections/                             # 📂 NOVO - Seções do VehicleDetails
│   ├── VehicleBasicInfo.tsx             # Informações básicas do veículo
│   ├── VehicleBasicInfo.module.css
│   ├── VehicleServicesSection.tsx        # Serviços necessários
│   ├── VehicleServicesSection.module.css
│   ├── VehicleMediaSection.tsx           # Fotos do veículo
│   ├── VehicleMediaSection.module.css
│   ├── PartnerEvidencesSection.tsx       # Evidências do parceiro + checklists
│   ├── PartnerEvidencesSection.module.css
│   ├── ExecutionEvidencesSection.tsx     # Evidências de execução
│   ├── ExecutionEvidencesSection.module.css
│   ├── InspectionObservationsSection.tsx # Observações do especialista
│   └── InspectionObservationsSection.module.css
│
├── cards/                                # 📂 NOVO - Componentes reutilizáveis
│   ├── ServiceCard.tsx                   # Card de serviço individual
│   ├── ServiceCard.module.css
│   ├── MediaCard.tsx                     # Card de mídia (foto)
│   ├── MediaCard.module.css
│   ├── StatusBadge.tsx                   # Badge de status
│   ├── StatusBadge.module.css
│   ├── SectionCard.tsx                   # Card genérico para seções
│   └── SectionCard.module.css
│
├── modals/                               # 📂 Reorganizar modais existentes
│   ├── ChecklistViewer.tsx              # ✅ Já existe
│   ├── ChecklistReadOnlyViewer.tsx      # ✅ Já existe
│   └── ImageViewerModal.tsx             # ✅ Mover de modules/client/components
│
└── BudgetPhaseSection.tsx               # ✅ Já existe (Timeline)

modules/vehicles/hooks/
├── usePartnerEvidences.ts               # ✅ Já existe
├── usePartnerChecklist.ts               # ✅ Já existe
├── usePartnerChecklistCategories.ts     # ✅ Já existe
├── useExecutionEvidences.ts             # ✅ Já existe
├── useDynamicChecklistLoader.ts         # 📂 NOVO - Extrai lógica de loadDynamicChecklist
└── useVehicleDetailsState.ts            # 📂 NOVO - Centraliza estados dos modais

modules/vehicles/utils/                   # 📂 NOVO
├── formatters.ts                         # formatCurrency, formatDateBR, getStatusLabel
└── vehicleHelpers.ts                     # Helpers diversos
```

---

## 🔄 Fases da Refatoração

### **Fase 1: Preparação (Sem Breaking Changes)**

#### 1.1. Criar Estrutura de Diretórios
```bash
mkdir -p modules/vehicles/components/sections
mkdir -p modules/vehicles/components/cards
mkdir -p modules/vehicles/components/modals
mkdir -p modules/vehicles/utils
```

#### 1.2. Extrair Interfaces e Types
**Arquivo:** `modules/vehicles/types/VehicleDetailsTypes.ts`
```typescript
export interface AnomalyEvidence {
  id: string;
  description: string;
  photos: string[];
  partRequest?: {
    partName: string;
    partDescription?: string;
    quantity: number;
    estimatedPrice?: number;
  };
}

export interface VehicleDetails {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: string;
  created_at: string;
  fipe_value?: number;
  current_odometer?: number;
  fuel_level?: string;
  estimated_arrival_date?: string;
  preparacao?: boolean;
  comercializacao?: boolean;
}

export interface InspectionData {
  id: string;
  inspection_date: string;
  odometer: number;
  fuel_level: string;
  observations: string;
  finalized: boolean;
  services: ServiceData[];
  media: MediaData[];
}

export interface ServiceData {
  category: string;
  required: boolean;
  notes: string;
}

export interface MediaData {
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface VehicleDetailsProps {
  vehicle: VehicleDetails | null;
  inspection: InspectionData | null;
  mediaUrls: Record<string, string>;
  loading: boolean;
  error: string | null;
}
```

#### 1.3. Extrair Formatters
**Arquivo:** `modules/vehicles/utils/formatters.ts`
```typescript
import { VEHICLE_CONSTANTS } from '@/app/constants/messages';

export const formatCurrency = (value: number | undefined): string => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getStatusLabel = (status: string): string => {
  return (
    VEHICLE_CONSTANTS.VEHICLE_STATUS[
      status as keyof typeof VEHICLE_CONSTANTS.VEHICLE_STATUS
    ] || status
  );
};

export const formatDateBR = (date: string | undefined): string => {
  if (!date) return 'N/A';
  // Importar de modules/client/utils/date
  return new Date(date).toLocaleDateString('pt-BR');
};
```

#### 1.4. Criar Hook de Estado Centralizado
**Arquivo:** `modules/vehicles/hooks/useVehicleDetailsState.ts`
```typescript
import { useState } from 'react';
import { AnomalyEvidence } from '../types/VehicleDetailsTypes';

export const useVehicleDetailsState = () => {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDynamicChecklistModal, setShowDynamicChecklistModal] = useState(false);
  const [dynamicChecklistData, setDynamicChecklistData] = useState<{
    anomalies: AnomalyEvidence[];
    savedAt: string;
    category?: string;
  } | null>(null);

  return {
    imageViewer: {
      isOpen: isImageViewerOpen,
      open: () => setIsImageViewerOpen(true),
      close: () => setIsImageViewerOpen(false),
    },
    checklistModal: {
      isOpen: showChecklistModal,
      open: () => setShowChecklistModal(true),
      close: () => setShowChecklistModal(false),
    },
    dynamicChecklistModal: {
      isOpen: showDynamicChecklistModal,
      data: dynamicChecklistData,
      open: (data: { anomalies: AnomalyEvidence[]; savedAt: string; category?: string }) => {
        setDynamicChecklistData(data);
        setShowDynamicChecklistModal(true);
      },
      close: () => {
        setShowDynamicChecklistModal(false);
        setDynamicChecklistData(null);
      },
    },
  };
};
```

#### 1.5. Criar Hook para Carregamento de Checklist Dinâmico
**Arquivo:** `modules/vehicles/hooks/useDynamicChecklistLoader.ts`
```typescript
import { useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';
import { AnomalyEvidence } from '../types/VehicleDetailsTypes';

const logger = getLogger('hooks:useDynamicChecklistLoader');

export const useDynamicChecklistLoader = () => {
  const [loading, setLoading] = useState(false);

  const loadChecklist = async (
    vehicleId: string,
    inspectionId: string,
    category?: string
  ): Promise<AnomalyEvidence[] | null> => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        logger.error('session_error_dynamic_checklist', {
          error: sessionError,
          hasSession: !!session,
        });
        return null;
      }

      const params = new URLSearchParams({
        vehicle_id: vehicleId,
        inspection_id: inspectionId,
      });

      if (category) {
        params.append('partner_category', category);
      }

      const response = await fetch(`/api/checklist/view?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('dynamic_checklist_loaded', {
          anomalies_count: data.data?.length || 0,
        });
        return data.data || [];
      }

      const errorData = await response.json();
      logger.error('load_dynamic_checklist_failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return null;
    } catch (err) {
      logger.error('load_dynamic_checklist_error', { error: err });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loadChecklist, loading };
};
```

---

### **Fase 2: Criar Componentes Base (Cards Reutilizáveis)**

#### 2.1. SectionCard (Card Genérico)
**Arquivo:** `modules/vehicles/components/cards/SectionCard.tsx`
```typescript
import React from 'react';
import styles from './SectionCard.module.css';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  fullWidth?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  headerAction,
  fullWidth = false,
}) => {
  return (
    <div className={`${styles.card} ${fullWidth ? styles.fullWidth : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {headerAction && <div className={styles.action}>{headerAction}</div>}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
```

#### 2.2. StatusBadge
**Arquivo:** `modules/vehicles/components/cards/StatusBadge.tsx`
```typescript
import React from 'react';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'info' | 'error';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'info' }) => {
  return <span className={`${styles.badge} ${styles[variant]}`}>{status}</span>;
};
```

#### 2.3. ServiceCard
**Arquivo:** `modules/vehicles/components/cards/ServiceCard.tsx`
```typescript
import React from 'react';
import { translateServiceCategory } from '@/app/constants/messages';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  category: string;
  required: boolean;
  notes?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ category, required, notes }) => {
  return (
    <div className={`${styles.card} ${required ? styles.required : ''}`}>
      <div className={styles.header}>
        <span className={styles.category}>{translateServiceCategory(category)}</span>
        <span className={required ? styles.requiredBadge : styles.optionalBadge}>
          {required ? 'Necessário' : 'Opcional'}
        </span>
      </div>
      {notes && (
        <div className={styles.notes}>
          <strong>Observações:</strong> {notes}
        </div>
      )}
    </div>
  );
};
```

#### 2.4. MediaCard
**Arquivo:** `modules/vehicles/components/cards/MediaCard.tsx`
```typescript
import React from 'react';
import { formatDateBR } from '../../utils/formatters';
import styles from './MediaCard.module.css';

interface MediaCardProps {
  src: string;
  alt: string;
  date: string;
  description?: string;
  onError?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  src,
  alt,
  date,
  description,
  onError,
}) => {
  return (
    <div className={styles.card}>
      <img src={src} alt={alt} className={styles.image} onError={onError} />
      <div className={styles.footer}>
        <div className={styles.date}>{formatDateBR(date)}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
    </div>
  );
};
```

---

### **Fase 3: Criar Seções Especializadas**

#### 3.1. VehicleBasicInfo
**Arquivo:** `modules/vehicles/components/sections/VehicleBasicInfo.tsx`
```typescript
import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { StatusBadge } from '../cards/StatusBadge';
import { VehicleDetails } from '../../types/VehicleDetailsTypes';
import { formatCurrency, formatDateBR, getStatusLabel } from '../../utils/formatters';
import { translateFuelLevel } from '@/app/constants/messages';
import styles from './VehicleBasicInfo.module.css';

interface VehicleBasicInfoProps {
  vehicle: VehicleDetails;
  onViewEvidences?: () => void;
  mediaCount?: number;
}

export const VehicleBasicInfo: React.FC<VehicleBasicInfoProps> = ({
  vehicle,
  onViewEvidences,
  mediaCount = 0,
}) => {
  const headerAction = mediaCount > 0 && onViewEvidences && (
    <button onClick={onViewEvidences} className={styles.evidenceButton}>
      Ver Evidências ({mediaCount})
    </button>
  );

  return (
    <SectionCard title="Informações Básicas" headerAction={headerAction}>
      <div className={styles.grid}>
        <InfoRow label="Placa" value={vehicle.plate} monospace />
        <InfoRow label="Marca" value={vehicle.brand} />
        <InfoRow label="Modelo" value={`${vehicle.model} (${vehicle.year})`} />
        <InfoRow label="Cor" value={vehicle.color || 'N/A'} />
        <InfoRow
          label="Status"
          value={<StatusBadge status={getStatusLabel(vehicle.status)} />}
        />
        <InfoRow label="Valor FIPE" value={formatCurrency(vehicle.fipe_value)} />
        <InfoRow label="KM Atual" value={vehicle.current_odometer?.toString() || 'N/A'} />
        <InfoRow label="Nível de Combustível" value={translateFuelLevel(vehicle.fuel_level)} />
        <InfoRow label="Cadastrado em" value={formatDateBR(vehicle.created_at)} />
        <InfoRow label="Previsão de Chegada" value={formatDateBR(vehicle.estimated_arrival_date)} />
      </div>
    </SectionCard>
  );
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  monospace?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, monospace = false }) => {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}:</span>
      <span className={monospace ? styles.valueMonospace : ''}>{value}</span>
    </div>
  );
};
```

#### 3.2. VehicleServicesSection
**Arquivo:** `modules/vehicles/components/sections/VehicleServicesSection.tsx`
```typescript
import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { ServiceCard } from '../cards/ServiceCard';
import { ServiceData } from '../../types/VehicleDetailsTypes';
import styles from './VehicleServicesSection.module.css';

interface VehicleServicesSectionProps {
  services: ServiceData[];
}

export const VehicleServicesSection: React.FC<VehicleServicesSectionProps> = ({ services }) => {
  if (!services || services.length === 0) return null;

  return (
    <SectionCard title="Serviços Necessários" fullWidth>
      <div className={styles.grid}>
        {services.map((service, index) => (
          <ServiceCard
            key={index}
            category={service.category}
            required={service.required}
            notes={service.notes}
          />
        ))}
      </div>
    </SectionCard>
  );
};
```

#### 3.3. VehicleMediaSection
**Arquivo:** `modules/vehicles/components/sections/VehicleMediaSection.tsx`
```typescript
import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { MediaCard } from '../cards/MediaCard';
import { MediaData } from '../../types/VehicleDetailsTypes';
import styles from './VehicleMediaSection.module.css';

interface VehicleMediaSectionProps {
  media: MediaData[];
  mediaUrls: Record<string, string>;
}

export const VehicleMediaSection: React.FC<VehicleMediaSectionProps> = ({ media, mediaUrls }) => {
  if (!media || media.length === 0) return null;

  const getMediaUrl = (storagePath: string) => {
    return (
      mediaUrls[storagePath] ||
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${storagePath}`
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, storagePath: string) => {
    const target = e.target as HTMLImageElement;
    if (!target.src.includes('public')) {
      target.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${storagePath}`;
    }
  };

  return (
    <SectionCard title="Evidências" fullWidth>
      <div className={styles.grid}>
        {media.map((item, index) => (
          <MediaCard
            key={index}
            src={getMediaUrl(item.storage_path)}
            alt={`Foto ${index + 1}`}
            date={item.created_at}
            onError={() => handleImageError as any}
          />
        ))}
      </div>
    </SectionCard>
  );
};
```

#### 3.4. PartnerEvidencesSection
**Arquivo:** `modules/vehicles/components/sections/PartnerEvidencesSection.tsx`
```typescript
import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { MediaCard } from '../cards/MediaCard';
import styles from './PartnerEvidencesSection.module.css';

interface PartnerEvidence {
  item_key: string;
  label: string;
  url: string;
}

interface ChecklistCategory {
  category: string;
  partner_id: string;
  partner_name: string;
  has_anomalies: boolean;
}

interface PartnerEvidencesSectionProps {
  evidenceByCategory: Record<string, PartnerEvidence[]>;
  checklistCategories: ChecklistCategory[];
  checklistData: any;
  checklistLoading: boolean;
  categoriesLoading: boolean;
  loadingDynamicChecklist: boolean;
  onOpenStaticChecklist: () => void;
  onOpenDynamicChecklist: (category: string) => void;
}

export const PartnerEvidencesSection: React.FC<PartnerEvidencesSectionProps> = ({
  evidenceByCategory,
  checklistCategories,
  checklistData,
  checklistLoading,
  categoriesLoading,
  loadingDynamicChecklist,
  onOpenStaticChecklist,
  onOpenDynamicChecklist,
}) => {
  const hasAnyEvidence =
    checklistData || Object.keys(evidenceByCategory).length > 0 || checklistCategories.length > 0;

  if (!hasAnyEvidence) return null;

  const headerAction = (
    <div className={styles.buttonGroup}>
      {/* Botão Checklist Estático (Mecânica) */}
      {checklistLoading ? (
        <span className={styles.loadingText}>Carregando checklist...</span>
      ) : (
        checklistData && (
          <button onClick={onOpenStaticChecklist} className={styles.checklistButtonStatic}>
            Mecânica
          </button>
        )
      )}

      {/* Botões Checklist Dinâmico (Por Categoria) */}
      {categoriesLoading ? (
        <span className={styles.loadingText}>Carregando categorias...</span>
      ) : checklistCategories.length > 0 ? (
        checklistCategories.map(cat => (
          <button
            key={`${cat.partner_id}-${cat.category}`}
            onClick={() => onOpenDynamicChecklist(cat.category)}
            disabled={loadingDynamicChecklist}
            className={styles.checklistButtonDynamic}
          >
            {loadingDynamicChecklist ? 'Carregando...' : `Ver Checklist - ${cat.category}`}
          </button>
        ))
      ) : (
        <span className={styles.emptyText}>Nenhum checklist dinâmico disponível.</span>
      )}
    </div>
  );

  return (
    <SectionCard title="Evidências do Parceiro" headerAction={headerAction} fullWidth>
      {Object.keys(evidenceByCategory).length === 0 ? (
        <p className={styles.emptyMessage}>Nenhuma evidência enviada pelo parceiro.</p>
      ) : (
        Object.entries(evidenceByCategory).map(([category, items]) => (
          <div key={category} className={styles.categorySection}>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <div className={styles.grid}>
              {items.map((ev, idx) => (
                <MediaCard
                  key={`${ev.item_key}-${idx}`}
                  src={ev.url}
                  alt={`Evidência Parceiro - ${ev.label}`}
                  date={new Date().toISOString()}
                  description={ev.label}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </SectionCard>
  );
};
```

#### 3.5. ExecutionEvidencesSection
**Arquivo:** `modules/vehicles/components/sections/ExecutionEvidencesSection.tsx`
```typescript
import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { MediaCard } from '../cards/MediaCard';
import { formatDateBR } from '../../utils/formatters';
import styles from './ExecutionEvidencesSection.module.css';

interface ExecutionEvidence {
  id: string;
  image_url: string;
  uploaded_at: string;
  description?: string;
}

interface ServiceExecution {
  serviceName: string;
  completed: boolean;
  completedAt?: string;
  evidences: ExecutionEvidence[];
}

interface ExecutionEvidencesSectionProps {
  services: ServiceExecution[];
  loading: boolean;
}

export const ExecutionEvidencesSection: React.FC<ExecutionEvidencesSectionProps> = ({
  services,
  loading,
}) => {
  if (loading || !services || services.length === 0) return null;

  return (
    <SectionCard
      title="Evidências de Execução"
      headerAction={<p className={styles.subtitle}>Fotos dos serviços realizados pelo parceiro</p>}
      fullWidth
    >
      {services.map((service, serviceIndex) => (
        <div
          key={serviceIndex}
          className={`${styles.serviceSection} ${
            serviceIndex < services.length - 1 ? styles.withBorder : ''
          }`}
        >
          <div className={styles.serviceHeader}>
            <h3 className={styles.serviceName}>{service.serviceName}</h3>
            {service.completed && (
              <span className={styles.completedBadge}>
                ✓ Concluído
                {service.completedAt && (
                  <span className={styles.completedDate}> • {formatDateBR(service.completedAt)}</span>
                )}
              </span>
            )}
          </div>

          {service.evidences.length > 0 ? (
            <div className={styles.grid}>
              {service.evidences.map((evidence, evidenceIndex) => (
                <MediaCard
                  key={evidence.id}
                  src={evidence.image_url}
                  alt={`${service.serviceName} - Evidência ${evidenceIndex + 1}`}
                  date={evidence.uploaded_at}
                  description={evidence.description}
                  onError={() => {
                    /* hide image on error */
                  }}
                />
              ))}
            </div>
          ) : (
            <p className={styles.emptyMessage}>Nenhuma evidência registrada para este serviço</p>
          )}
        </div>
      ))}
    </SectionCard>
  );
};
```

#### 3.6. InspectionObservationsSection
**Arquivo:** `modules/vehicles/components/sections/InspectionObservationsSection.tsx`
```typescript
import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import styles from './InspectionObservationsSection.module.css';

interface InspectionObservationsSectionProps {
  observations: string;
}

export const InspectionObservationsSection: React.FC<InspectionObservationsSectionProps> = ({
  observations,
}) => {
  if (!observations) return null;

  return (
    <SectionCard title="Observações do Especialista" fullWidth>
      <div className={styles.container}>{observations}</div>
    </SectionCard>
  );
};
```

---

### **Fase 4: Refatorar VehicleDetails.tsx (Container)**

**Arquivo Refatorado:** `modules/vehicles/components/VehicleDetails.tsx`

```typescript
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/modules/common/components/Loading/Loading';
import ImageViewerModal from '@/modules/client/components/ImageViewerModal';
import { ChecklistViewer } from './ChecklistViewer';
import ChecklistReadOnlyViewer from './ChecklistReadOnlyViewer';
import BudgetPhaseSection from './BudgetPhaseSection';
import { IconTextButton } from '@/modules/common/components/IconTextButton/IconTextButton';
import { LuArrowLeft } from 'react-icons/lu';

// Hooks
import { usePartnerEvidences } from '@/modules/vehicles/hooks/usePartnerEvidences';
import { usePartnerChecklist } from '@/modules/vehicles/hooks/usePartnerChecklist';
import { usePartnerChecklistCategories } from '@/modules/vehicles/hooks/usePartnerChecklistCategories';
import { useExecutionEvidences } from '@/modules/vehicles/hooks/useExecutionEvidences';
import { useVehicleDetailsState } from '@/modules/vehicles/hooks/useVehicleDetailsState';
import { useDynamicChecklistLoader } from '@/modules/vehicles/hooks/useDynamicChecklistLoader';

// Sections
import { VehicleBasicInfo } from './sections/VehicleBasicInfo';
import { VehicleServicesSection } from './sections/VehicleServicesSection';
import { VehicleMediaSection } from './sections/VehicleMediaSection';
import { PartnerEvidencesSection } from './sections/PartnerEvidencesSection';
import { ExecutionEvidencesSection } from './sections/ExecutionEvidencesSection';
import { InspectionObservationsSection } from './sections/InspectionObservationsSection';

// Types
import { VehicleDetailsProps } from '../types/VehicleDetailsTypes';

import styles from './VehicleDetails.module.css';

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  inspection,
  mediaUrls,
  loading,
  error,
}) => {
  const router = useRouter();
  const modalState = useVehicleDetailsState();
  const { loadChecklist, loading: loadingDynamicChecklist } = useDynamicChecklistLoader();

  // Data Hooks
  const { grouped: partnerEvidenceByCategory } = usePartnerEvidences(vehicle?.id, inspection?.id);
  const { data: checklistData, loading: checklistLoading } = usePartnerChecklist(vehicle?.id);
  const { evidences: executionEvidences, loading: executionLoading } = useExecutionEvidences(
    vehicle?.id
  );
  const { categories: checklistCategories, loading: categoriesLoading } =
    usePartnerChecklistCategories(vehicle?.id, inspection?.id);

  // Handlers
  const handleLoadDynamicChecklist = async (category: string) => {
    if (!vehicle?.id || !inspection?.id) return;

    const anomalies = await loadChecklist(vehicle.id, inspection.id, category);
    if (anomalies) {
      modalState.dynamicChecklistModal.open({
        anomalies,
        savedAt: new Date().toISOString(),
        category,
      });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading />
      </div>
    );
  }

  // Error State
  if (error || !vehicle) {
    return (
      <main className={styles.main}>
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Erro</h1>
          <p>{error || 'Veículo não encontrado'}</p>
          <button onClick={() => router.back()} className={styles.errorButton}>
            Voltar
          </button>
        </div>
      </main>
    );
  }

  // Main Render
  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.header}>
        <IconTextButton
          onClick={() => router.back()}
          title="Voltar"
          icon={<LuArrowLeft size={20} />}
          className="mr-4"
        >
          Voltar
        </IconTextButton>
        <h1 className={styles.title}>Detalhes do Veículo</h1>
        <p className={styles.subtitle}>
          {vehicle.brand} {vehicle.model} • {vehicle.plate}
        </p>
      </div>

      {/* Sections Grid */}
      <div className={styles.gridContainer}>
        <VehicleBasicInfo
          vehicle={vehicle}
          onViewEvidences={modalState.imageViewer.open}
          mediaCount={inspection?.media?.length || 0}
        />

        <BudgetPhaseSection
          vehicleId={vehicle.id}
          createdAt={vehicle.created_at}
          estimatedArrivalDate={vehicle.estimated_arrival_date}
          inspectionDate={inspection?.inspection_date}
          inspectionFinalized={inspection?.finalized}
        />

        <VehicleServicesSection services={inspection?.services || []} />

        <VehicleMediaSection media={inspection?.media || []} mediaUrls={mediaUrls} />

        <PartnerEvidencesSection
          evidenceByCategory={partnerEvidenceByCategory}
          checklistCategories={checklistCategories}
          checklistData={checklistData}
          checklistLoading={checklistLoading}
          categoriesLoading={categoriesLoading}
          loadingDynamicChecklist={loadingDynamicChecklist}
          onOpenStaticChecklist={modalState.checklistModal.open}
          onOpenDynamicChecklist={handleLoadDynamicChecklist}
        />

        <InspectionObservationsSection observations={inspection?.observations || ''} />

        <ExecutionEvidencesSection
          services={executionEvidences || []}
          loading={executionLoading}
        />
      </div>

      {/* Modals */}
      {inspection?.media && inspection.media.length > 0 && (
        <ImageViewerModal
          isOpen={modalState.imageViewer.isOpen}
          onClose={modalState.imageViewer.close}
          images={inspection.media}
          mediaUrls={mediaUrls}
          vehiclePlate={vehicle?.plate || ''}
        />
      )}

      {modalState.checklistModal.isOpen && checklistData && (
        <ChecklistViewer data={checklistData} onClose={modalState.checklistModal.close} />
      )}

      {modalState.dynamicChecklistModal.isOpen && modalState.dynamicChecklistModal.data && (
        <ChecklistReadOnlyViewer
          data={{
            items: [],
            anomalies: modalState.dynamicChecklistModal.data.anomalies,
            savedAt: modalState.dynamicChecklistModal.data.savedAt,
          }}
          partnerCategory={modalState.dynamicChecklistModal.data.category}
          onClose={modalState.dynamicChecklistModal.close}
        />
      )}
    </main>
  );
};

export default VehicleDetails;
```

**Resultado:**
- **Antes:** 628 linhas
- **Depois:** ~150 linhas ✅
- **Complexidade:** Reduzida drasticamente
- **Testabilidade:** Cada seção pode ser testada isoladamente
- **Manutenibilidade:** Mudanças localizadas

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Linhas de Código** | 628 | ~150 | ✅ 76% redução |
| **Componentes Extraídos** | 0 | 11 | ✅ Composição |
| **Hooks Customizados** | 4 | 6 | ✅ Separação de lógica |
| **Níveis de Indentação** | 6-8 | 2-3 | ✅ Simplicidade |
| **Responsabilidades** | ~10 | 1 | ✅ SRP |
| **Testabilidade** | Baixa | Alta | ✅ Isolamento |

---

## 🧪 Checklist de Testes

Após refatoração, validar:

- [ ] Informações básicas renderizam corretamente
- [ ] Timeline aparece em ordem cronológica
- [ ] Serviços necessários exibem badge correto
- [ ] Fotos do veículo carregam com fallback
- [ ] Botão de checklist estático (Mecânica) funciona
- [ ] Botões de checklist dinâmico aparecem por categoria
- [ ] Modal de checklist dinâmico abre com anomalias
- [ ] Evidências do parceiro agrupadas por categoria
- [ ] Evidências de execução separadas por serviço
- [ ] Observações do especialista aparecem
- [ ] Modal de imagens funciona
- [ ] Loading states funcionam
- [ ] Error states funcionam
- [ ] Voltar para dashboard funciona

---

## 🚀 Ordem de Implementação

1. ✅ **Fase 1.2-1.5**: Extrair types, formatters, hooks de estado
2. ✅ **Fase 2**: Criar cards reutilizáveis (SectionCard, StatusBadge, ServiceCard, MediaCard)
3. ✅ **Fase 3**: Criar seções especializadas (VehicleBasicInfo, VehicleServicesSection, etc.)
4. ✅ **Fase 4**: Refatorar VehicleDetails.tsx como container
5. ✅ **Testes**: Validar todos os fluxos
6. ✅ **Limpeza**: Remover código antigo, logs de debug

---

## 📝 Notas Importantes

- **Não quebrar funcionalidade**: Cada fase deve ser testada antes de continuar
- **Commits incrementais**: Um commit por seção criada
- **CSS Modules**: Cada componente tem seu próprio CSS
- **Types centralizados**: `modules/vehicles/types/VehicleDetailsTypes.ts`
- **Hooks reutilizáveis**: Podem ser usados em outros contextos
- **Documentação**: Cada componente com comentário de responsabilidade

---

## ✨ Benefícios Esperados

1. **Manutenibilidade**: Mudanças localizadas, fácil de encontrar código
2. **Testabilidade**: Componentes pequenos, fáceis de testar isoladamente
3. **Reusabilidade**: Cards e sections podem ser usados em outros lugares
4. **Legibilidade**: Código mais limpo, fácil de entender
5. **Escalabilidade**: Fácil adicionar novas seções sem aumentar complexidade
6. **Performance**: Componentes podem ser otimizados individualmente (React.memo)
7. **Colaboração**: Múltiplos devs podem trabalhar em seções diferentes
8. **Onboarding**: Novos devs entendem código mais rapidamente

---

**Status:** 📋 **Plano Aprovado - Aguardando Implementação**
