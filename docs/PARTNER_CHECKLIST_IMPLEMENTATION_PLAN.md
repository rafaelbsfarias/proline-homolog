# 🎯 PLANO DE IMPLEMENTAÇÃO: Visualização de Checklists de Parceiros

## 📋 CONTEXTO

### Tipos de Checklist

O sistema possui **dois tipos diferentes** de checklist de parceiros:

#### 1. **Checklist de Mecânica** 🔧
- **Categoria**: Apenas `mechanic`
- **Tabelas**: `mechanics_checklist`, `mechanics_checklist_items`, `mechanics_checklist_evidences`
- **Estrutura**: 
  - Checklist principal com dados gerais (odômetro, combustível, observações)
  - Itens individuais com status (ok/nok) e observações por item
  - Evidências (imagens) vinculadas aos itens
- **Campos principais**:
  - `mechanics_checklist`: dados gerais do checklist
  - `mechanics_checklist_items.item_key`: identificador do item (ex: 'clutch', 'sparkPlugs', 'belts')
  - `mechanics_checklist_items.item_status`: status do item (**ok** ou **nok**)
  - `mechanics_checklist_items.item_notes`: observações específicas do item
  - `mechanics_checklist_evidences.storage_path`: caminho da imagem no storage
- **IMPORTANTE**: Checklist de mecânica usa apenas **ok/nok** (binário)

#### 2. **Checklist de Outras Categorias** 🎨🔩🚿🏪📦
- **Categorias**: 
  - `bodyshop` (Funilaria/Pintura)
  - `tire_shop` (Pneus)
  - `car_wash` (Lavagem)
  - `store` (Loja)
  - `yard_wholesale` (Pátio Atacado)
- **Tabela**: `vehicle_anomalies`
- **Estrutura**:
  - Descrição da anomalia
  - Array de fotos (`photos[]`)
  - Severidade e status
- **Campos principais**:
  - `vehicle_anomalies.description`: descrição textual da anomalia
  - `vehicle_anomalies.photos`: array de URLs das imagens
  - `vehicle_anomalies.severity`: gravidade (opcional)
  - `vehicle_anomalies.status`: estado da anomalia
- **Exemplo**: "Arranhão porta esquerda", "Amassado capô", "Pneu careca dianteiro direito"

### Situação Atual

- ✅ Dados salvos corretamente no banco
- ✅ Imagens no Supabase Storage
- ❌ Cliente/Admin/Especialista **não veem** checklist completo
- ❌ Apenas veem seção "Evidências do Parceiro" (incompleta)

### Objetivo

Adicionar botão **"Ver Checklist Completo"** que:
- Detecta tipo de parceiro (mecânica vs funilaria/pintura)
- Exibe modal com estrutura apropriada
- Funciona para Cliente, Admin e Especialista

---

## ⚙️ ARQUITETURA

### Estrutura do Banco

```sql
-- MECÂNICA
mechanics_checklist
├── id, vehicle_id, partner_id, inspection_id ⚠️
├── status, notes, created_at, updated_at
└── [FASE 2: adicionar quote_id, tornar inspection_id optional]

mechanics_checklist_items
├── id, checklist_id, inspection_id ⚠️, vehicle_id
├── item_key, item_status (ok/nok - binário) ✅
├── item_notes
└── [FASE 2: adicionar quote_id]
└── NOTA: Constraint atualizado em migration 20250929223210 para aceitar apenas ok/nok

mechanics_checklist_evidences
├── id, checklist_item_id, inspection_id ⚠️, vehicle_id
├── media_url, media_type, description
└── [FASE 2: adicionar quote_id]

-- FUNILARIA/PINTURA
vehicle_anomalies
├── id, vehicle_id, inspection_id ⚠️
├── description, photos[], severity, status
└── [FASE 2: adicionar quote_id, tornar inspection_id optional]
```

⚠️ **Problema do "Hack"**: Parceiros usam `inspection_id` "emprestado" do especialista. Isso será corrigido na Fase 2.

---

## 🚀 FASE 1: IMPLEMENTAÇÃO DA VISUALIZAÇÃO (2-3h)

**Risco**: Baixo (apenas adiciona funcionalidade)

### 1.1. Criar API Unificada

**Arquivo**: `app/api/partner-checklist/route.ts` (NOVO)

**Responsabilidades**:
1. Receber `vehicleId` como parâmetro
2. Detectar tipo de parceiro (buscar em `partners.partner_type`)
3. Se `mechanic` → buscar de `mechanics_checklist*`
4. Se outras categorias (`bodyshop`, `tire_shop`, `car_wash`, `store`, `yard_wholesale`) → buscar de `vehicle_anomalies`
5. Gerar signed URLs para imagens
6. Retornar JSON unificado

**Pseudocódigo**:
```typescript
export const GET = withAuth(async (request: NextRequest) => {
  const vehicleId = request.nextUrl.searchParams.get('vehicleId');
  
  // 1. Buscar qual parceiro trabalhou no veículo (via quotes)
  const partner = await getPartnerForVehicle(vehicleId);
  
  // 2. Detectar tipo
  if (partner.partner_type === 'mechanic') {
    return getMechanicsChecklist(vehicleId);
  } else {
    // Todas as outras categorias usam o mesmo checklist de anomalias
    // bodyshop, tire_shop, car_wash, store, yard_wholesale
    return getAnomaliesChecklist(vehicleId); 
  }
});

async function getMechanicsChecklist(vehicleId) {
  // Buscar mechanics_checklist
  // Buscar mechanics_checklist_items
  // Buscar mechanics_checklist_evidences
  // Agrupar por categoria
  // Calcular stats (total itens)
  return { type: 'mechanics', data: {...} };
}

async function getAnomaliesChecklist(vehicleId) {
  // Buscar vehicle_anomalies
  // Gerar signed URLs para photos[]
  // Calcular stats (total anomalias)
  return { type: 'anomalies', data: {...} };
}
```

**Interface de Resposta**:
```typescript
// Mecânica
interface MechanicsChecklistResponse {
  type: 'mechanics';
  checklist: {
    id: string;
    vehicle_id: string;
    partner: { id: string; name: string; type: 'mechanic'; };
    status: string;
    notes: string;
    created_at: string;
  };
  itemsByCategory: Record<string, Array<{
    id: string;
    item_key: string;
    item_status: 'ok' | 'nok';
    item_notes: string | null;
    evidences: Array<{
      id: string;
      media_url: string;
      description: string;
    }>;
  }>>;
  stats: {
    totalItems: number;
  };
}

// Outras Categorias (bodyshop, tire_shop, car_wash, store, yard_wholesale)
interface AnomaliesChecklistResponse {
  type: 'anomalies';
  checklist: {
    vehicle_id: string;
    partner: { 
      id: string; 
      name: string; 
      type: 'bodyshop' | 'tire_shop' | 'car_wash' | 'store' | 'yard_wholesale'; 
    };
  };
  anomalies: Array<{
    id: string;
    description: string;
    photos: string[]; // signed URLs
    severity: string;
    status: string;
    created_at: string;
  }>;
  stats: {
    totalAnomalies: number;
  };
}
```

---

### 1.2. Criar Hook Unificado

**Arquivo**: `modules/vehicles/hooks/usePartnerChecklist.ts` (NOVO)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export type ChecklistType = 'mechanics' | 'anomalies';

export interface PartnerChecklistData {
  type: ChecklistType;
  checklist: any; // Tipo específico baseado em `type`
  stats: any;
  // Para mechanics: itemsByCategory
  // Para anomalies: anomalies (todas as outras categorias)
  [key: string]: any;
}

export function usePartnerChecklist(vehicleId?: string) {
  const { get } = useAuthenticatedFetch();
  const [data, setData] = useState<PartnerChecklistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;

    let active = true;

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const response = await get<PartnerChecklistData>(
          `/api/partner-checklist?vehicleId=${vehicleId}`
        );

        if (!response.ok) {
          throw new Error(response.data?.error || 'Erro ao buscar checklist');
        }

        if (active) {
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      active = false;
    };
  }, [vehicleId, get]);

  return { data, loading, error };
}
```

---

### 1.3. Criar Componente Visualizador

**Arquivo**: `modules/vehicles/components/ChecklistViewer.tsx` (NOVO)

```typescript
'use client';

import React from 'react';
import { PartnerChecklistData } from '../hooks/usePartnerChecklist';
import { MechanicsChecklistView } from './MechanicsChecklistView';
import { AnomaliesChecklistView } from './AnomaliesChecklistView';
import styles from './ChecklistViewer.module.css';

interface ChecklistViewerProps {
  data: PartnerChecklistData;
  onClose: () => void;
}

export const ChecklistViewer: React.FC<ChecklistViewerProps> = ({ data, onClose }) => {
  // Traduzir tipo de parceiro para título
  const getTitle = () => {
    if (data.type === 'mechanics') return 'Checklist de Mecânica';
    
    const titles: Record<string, string> = {
      bodyshop: 'Checklist de Funilaria/Pintura',
      tire_shop: 'Checklist de Pneus',
      car_wash: 'Checklist de Lavagem',
      store: 'Checklist de Loja',
      yard_wholesale: 'Checklist de Pátio Atacado',
    };
    
    return titles[data.checklist.partner?.type] || 'Checklist do Parceiro';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{getTitle()}</h2>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.content}>
          {data.type === 'mechanics' ? (
            <MechanicsChecklistView data={data} />
          ) : (
            <AnomaliesChecklistView data={data} />
          )}
        </div>
      </div>
    </div>
  );
};
```

**Sub-componente Mecânica**: `MechanicsChecklistView.tsx`
```typescript
export const MechanicsChecklistView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <>
      {/* Header com parceiro, data, etc */}
      <div className="summary">...</div>

      {/* Itens agrupados por categoria */}
      {Object.entries(data.itemsByCategory).map(([category, items]) => (
        <div key={category} className="category-section">
          <h3>{category}</h3>
          {items.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-status">
                {item.item_status === 'ok' ? '✅ OK' : '❌ NOK'}
              </div>
              <p>{item.item_notes}</p>
              {item.evidences.map(ev => (
                <img key={ev.id} src={ev.media_url} alt={ev.description} />
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* Stats */}
      <div className="stats">
        <p>Total de itens verificados: {data.stats.totalItems}</p>
      </div>
    </>
  );
};
```

**Sub-componente Anomalias**: `AnomaliesChecklistView.tsx`
```typescript
export const AnomaliesChecklistView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <>
      {/* Header com parceiro */}
      <div className="summary">
        <p><strong>Parceiro:</strong> {data.checklist.partner?.name}</p>
        <p><strong>Categoria:</strong> {translatePartnerType(data.checklist.partner?.type)}</p>
      </div>

      {/* Lista de anomalias */}
      <div className="anomalies-list">
        {data.anomalies.map(anomaly => (
          <div key={anomaly.id} className="anomaly-card">
            <p className="description">{anomaly.description}</p>
            <span className="severity">{anomaly.severity}</span>
            <div className="photos-grid">
              {anomaly.photos.map((url, idx) => (
                <img key={idx} src={url} alt={`Foto ${idx + 1}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="stats">
        <p>Total de anomalias: {data.stats.totalAnomalies}</p>
      </div>
    </>
  );
};

// Helper para traduzir tipo de parceiro
function translatePartnerType(type: string): string {
  const translations: Record<string, string> = {
    mechanic: 'Mecânica',
    bodyshop: 'Funilaria/Pintura',
    tire_shop: 'Pneus',
    car_wash: 'Lavagem',
    store: 'Loja',
    yard_wholesale: 'Pátio Atacado',
  };
  return translations[type] || type;
}
```

---

### 1.4. CSS Unificado

**Arquivo**: `modules/vehicles/components/ChecklistViewer.module.css` (NOVO)

```css
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  max-height: 90vh;
  width: 90%;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.closeButton {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.closeButton:hover {
  color: #111827;
}

.content {
  padding: 24px;
}

/* Mecânica - Item Card */
.item-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.item-status {
  font-weight: 600;
  margin-bottom: 8px;
}

/* Funilaria - Anomaly Card */
.anomaly-card {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.photos-grid img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
}

.stats {
  background: #eff6ff;
  padding: 16px;
  border-radius: 8px;
  margin-top: 24px;
  text-align: center;
  font-weight: 600;
  color: #1e40af;
}
```

---

### 1.5. Modificar VehicleDetails

**Arquivo**: `modules/vehicles/components/VehicleDetails.tsx`

**Adicionar**:
```typescript
import { usePartnerChecklist } from '../hooks/usePartnerChecklist';
import { ChecklistViewer } from './ChecklistViewer';

// Dentro do componente
const [showChecklistModal, setShowChecklistModal] = useState(false);
const { data: checklistData, loading: checklistLoading } = usePartnerChecklist(vehicle.id);

// Na seção "Evidências do Parceiro", adicionar botão:
<div className="partner-evidences-section">
  <h3>Evidências do Parceiro</h3>
  
  {checklistData && (
    <button
      onClick={() => setShowChecklistModal(true)}
      className="view-checklist-btn"
    >
      📋 Ver Checklist Completo
    </button>
  )}
  
  {/* Código existente de evidências */}
</div>

{/* Modal */}
{showChecklistModal && checklistData && (
  <ChecklistViewer
    data={checklistData}
    onClose={() => setShowChecklistModal(false)}
  />
)}
```

---

### 📋 CHECKPOINT FASE 1

**Testes por Papel:**

#### Cliente:
- [ ] Loga e acessa detalhes do veículo
- [ ] Vê botão "Ver Checklist Completo"
- [ ] Clica e modal abre
- [ ] Se mecânica: vê itens ok/nok, observações, imagens
- [ ] Se funilaria: vê anomalias, descrições, fotos
- [ ] Modal fecha corretamente

#### Admin:
- [ ] Mesmos testes acima

#### Especialista:
- [ ] Mesmos testes acima

**Commit:**
```bash
git add .
git commit -m "feat: add partner checklist viewer for all roles

- API unificada detecta tipo de parceiro (mecânica vs funilaria)
- Hook reutilizável para todos os papéis
- Modal com visualizações específicas por tipo
- Funciona em dashboards de cliente, admin e especialista
"
```

---

## 🔧 FASE 2: CORREÇÃO DA ARQUITETURA (3-4h)

**Risco**: Médio (modifica estrutura de dados)

### 2.1. Criar Migration

**Usar comando**:
```bash
npx supabase migration new add_quote_id_to_checklist_tables
```

**Conteúdo da migration**:
```sql
-- Adicionar quote_id às tabelas de checklist
-- Tornar inspection_id opcional (NULL)

-- mechanics_checklist
ALTER TABLE mechanics_checklist
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE mechanics_checklist
  ALTER COLUMN inspection_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_quote_id 
  ON mechanics_checklist(quote_id);

-- mechanics_checklist_items
ALTER TABLE mechanics_checklist_items
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE mechanics_checklist_items
  ALTER COLUMN inspection_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_items_quote_id 
  ON mechanics_checklist_items(quote_id);

-- mechanics_checklist_evidences
ALTER TABLE mechanics_checklist_evidences
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE mechanics_checklist_evidences
  ALTER COLUMN inspection_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_evidences_quote_id 
  ON mechanics_checklist_evidences(quote_id);

-- vehicle_anomalies
ALTER TABLE vehicle_anomalies
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE vehicle_anomalies
  ALTER COLUMN inspection_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_anomalies_quote_id 
  ON vehicle_anomalies(quote_id);

-- Comentários
COMMENT ON COLUMN mechanics_checklist.quote_id IS 'Quote do parceiro que criou o checklist';
COMMENT ON COLUMN mechanics_checklist_items.quote_id IS 'Quote do parceiro';
COMMENT ON COLUMN mechanics_checklist_evidences.quote_id IS 'Quote do parceiro';
COMMENT ON COLUMN vehicle_anomalies.quote_id IS 'Quote do parceiro';
```

**Executar**:
```bash
npx supabase db push
```

---

### 2.2. Modificar APIs de Salvamento

**Arquivos a modificar:**
1. `app/api/partner/checklist/submit/route.ts`
2. `app/api/partner/checklist/save-anomalies/route.ts`

**Mudanças:**
- Receber `quoteId` do frontend
- Salvar com `quote_id` ao invés de depender apenas de `inspection_id`
- Manter `inspection_id` para compatibilidade com dados antigos

**Exemplo**:
```typescript
// Antes
const mapped = {
  vehicle_id: checklistData.vehicle_id,
  inspection_id: checklistData.inspection_id, // ❌ emprestado
  partner_id: partnerId,
  // ...
};

// Depois
const mapped = {
  vehicle_id: checklistData.vehicle_id,
  quote_id: checklistData.quoteId, // ✅ correto
  inspection_id: checklistData.inspection_id || null, // ✅ opcional
  partner_id: partnerId,
  // ...
};
```

---

### 2.3. Atualizar Queries de Leitura

**Arquivo modificado**: `app/api/partner-checklist/route.ts`

**Mudanças:**
```typescript
// Antes
.eq('inspection_id', inspectionId)

// Depois (suportar ambos)
.or(`quote_id.eq.${quoteId},inspection_id.eq.${inspectionId}`)
```

---

### 📋 CHECKPOINT FASE 2

**Testes de Regressão:**
- [ ] Parceiro salva checklist com `quote_id`
- [ ] Dados antigos (com `inspection_id`) ainda funcionam
- [ ] API de leitura retorna dados corretos
- [ ] Cliente/Admin/Especialista continuam vendo checklists
- [ ] Nenhum erro em produção

**Commit:**
```bash
git add .
git commit -m "refactor: use quote_id in partner checklists

- Add quote_id column to all checklist tables
- Make inspection_id optional (nullable)
- Update save APIs to use quote_id
- Maintain backward compatibility with inspection_id
- Update read queries to support both identifiers
"
```

---

## 🎯 RESUMO EXECUTIVO

| Fase | Tempo | Risco | Arquivos Novos | Arquivos Modificados |
|------|-------|-------|----------------|----------------------|
| **Fase 1** | 2-3h | Baixo | 7 | 1 |
| **Fase 2** | 3-4h | Médio | 1 migration | 3 |
| **Total** | 5-7h | Médio | 8 | 4 |

### Entregáveis Fase 1:
- ✅ API `/api/partner-checklist` (detecção automática de tipo)
- ✅ Hook `usePartnerChecklist`
- ✅ Componente `ChecklistViewer` + sub-componentes
  - `MechanicsChecklistView` (para categoria `mechanic`)
  - `AnomaliesChecklistView` (para categorias `bodyshop`, `tire_shop`, `car_wash`, `store`, `yard_wholesale`)
- ✅ Botão em `VehicleDetails`
- ✅ CSS completo
- ✅ Suporte para todas as 6 categorias de parceiros

### Entregáveis Fase 2:
- ✅ Migration idempotente (usando comando supabase)
- ✅ APIs atualizadas com `quote_id`
- ✅ Backward compatibility com `inspection_id`
- ✅ Testes de regressão

---

## 🚀 PRONTO PARA COMEÇAR?

Confirme para iniciar Fase 1! 🎉
