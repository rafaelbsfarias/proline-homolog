# Mapeamento de Arquivos para Criação de Novo Trigger na Timeline

Nota: O componente legado `TimelineSection.tsx` foi removido e substituído por `modules/vehicles/components/BudgetPhaseSection.tsx`, que consome a API unificada `/api/vehicle-timeline` via `useVehicleTimeline`.

## 📋 Visão Geral

Este documento mapeia **TODOS** os arquivos que precisariam ser modificados/criados para adicionar um novo evento à timeline do veículo (tabela `vehicle_history`).

---

## 🗄️ **1. BANCO DE DADOS (Supabase)**

### **1.1. Schema da Tabela** ✅ (Já Existe)

**Arquivo:** `/supabase/migrations/20250929120000_create_vehicle_history_table.sql`

**Estrutura:**
```sql
CREATE TABLE vehicle_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    status VARCHAR(255) NOT NULL,
    prevision_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,  -- Adicionado em 20251009102800
    partner_service VARCHAR(255)  -- Para identificar categoria de serviço
);
```

**Índices:**
- `idx_vehicle_history_vehicle_id` - Por veículo
- `idx_vehicle_history_status` - Por status

---

### **1.2. RLS Policies** ✅ (Já Existe)

**Arquivo:** `/supabase/migrations/20250929120000_create_vehicle_history_table.sql`

**Políticas Atuais:**
```sql
-- Service role tem acesso total
CREATE POLICY "Allow all access to service_role"
ON vehicle_history FOR ALL TO service_role USING (true);

-- Admin e Specialist podem ler tudo
-- Client pode ler apenas seus veículos
CREATE POLICY "Allow individual read access"
ON vehicle_history FOR SELECT
USING (
  (get_my_claim('role')::text = ANY (ARRAY['admin'::text,'specialist'::text])) 
  OR (
    get_my_claim('role')::text = 'client' 
    AND vehicle_id IN (SELECT id FROM vehicles WHERE client_id = auth.uid())
  )
);
```

**⚠️ ATENÇÃO:** Não há política de INSERT/UPDATE para roles específicas!
- Partners atualmente NÃO podem inserir diretamente via client
- Todas as inserções são feitas via service_role no backend

---

### **1.3. Trigger Automático** ⚠️ (Opcional - Atualmente Desabilitado)

**Arquivo:** `/supabase/migrations/20250929130000_create_vehicle_history_trigger.sql`

**Função:**
```sql
CREATE OR REPLACE FUNCTION public.log_vehicle_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserção automática no histórico quando status do veículo mudar
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.vehicle_history (vehicle_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_status_change_trigger
AFTER UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.log_vehicle_history();
```

**Status:** Este trigger cria entradas automáticas quando `vehicles.status` muda.

---

### **1.4. Migration para Adicionar Novo Status** 🆕

**Arquivo a Criar:** `/supabase/migrations/[TIMESTAMP]_add_new_status_to_vehicle_history.sql`

**Exemplo:**
```sql
-- Migration: Adicionar novo status para evidências de execução

-- 1. Adicionar novo enum ao tipo vehicle_status (se necessário)
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'evidencias_iniciadas';
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'evidencias_finalizadas';

-- 2. Comentários para documentação
COMMENT ON TYPE vehicle_status IS 'Status do veículo na timeline';

-- 3. Atualizar mapeamento de status (se houver tabela de referência)
-- INSERT INTO status_mappings (status_key, display_name, color) 
-- VALUES ('evidencias_iniciadas', 'Evidências Iniciadas', '#3498db');

-- 4. Exemplos de uso do novo status
-- Este status será inserido quando partner iniciar upload de evidências
```

---

## 🔌 **2. APIs BACKEND (Next.js API Routes)**

### **2.1. APIs que JÁ Inserem na Timeline** ✅

#### **A. Partner - Iniciar Checklist**
**Arquivo:** `/app/api/partner/checklist/init/route.ts`

**Linha 73-79:**
```typescript
const { error: historyError } = await supabase.from('vehicle_history').insert({
  vehicle_id: vehicleId,
  status: 'Fase Orçamentária Iniciada - Mecânica',
  partner_service: 'mecanica',
  notes: 'Parceiro iniciou análise do veículo',
});
```

---

#### **B. Partner - Submeter Checklist**
**Arquivo:** `/app/api/partner/checklist/submit/route.ts`

**Linha 92-98:**
```typescript
const { error: historyError } = await supabase.from('vehicle_history').insert({
  vehicle_id: vehicleId,
  status: 'orcamento_finalizado',
  partner_service: serviceCategory,
  notes: `Checklist finalizado - Categoria: ${serviceCategory}`,
});
```

---

#### **C. Admin - Revisar Quote (Reprovar)**
**Arquivo:** `/app/api/admin/quotes/[quoteId]/review/route.ts`

**Linha 174-179:**
```typescript
await supabase.from('vehicle_history').insert({
  vehicle_id: quoteData.service_orders.vehicle_id,
  status: 'orcamento_reprovado',
  notes: adminFeedback || 'Orçamento reprovado pelo administrador',
});
```

---

#### **D. Admin - Aprovar Quote**
**Arquivo:** `/app/api/admin/quotes/[quoteId]/approve/route.ts`

**Linha 84-88:**
```typescript
await admin.from('vehicle_history').insert({
  vehicle_id: quoteData.service_orders.vehicle_id,
  status: 'orcamento_aprovado',
  notes: 'Orçamento aprovado pelo administrador',
});
```

---

### **2.2. Nova API para Novo Trigger** 🆕

**Arquivo a Criar:** `/app/api/[role]/[feature]/route.ts`

**Template Genérico:**
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { vehicleId, additionalData } = await req.json();
    
    // 1. Validar dados
    if (!vehicleId) {
      return NextResponse.json(
        { error: 'vehicleId é obrigatório' },
        { status: 400 }
      );
    }
    
    // 2. Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 3. Realizar ação principal (ex: salvar evidências)
    const { data, error } = await supabase
      .from('execution_evidences')
      .insert({
        vehicle_id: vehicleId,
        // ... outros campos
      });
    
    if (error) throw error;
    
    // 4. 🎯 INSERIR NA TIMELINE
    const { error: historyError } = await supabase
      .from('vehicle_history')
      .insert({
        vehicle_id: vehicleId,
        status: 'evidencias_iniciadas', // 🆕 Novo status
        partner_service: 'execucao',
        notes: 'Partner iniciou upload de evidências de execução',
      });
    
    if (historyError) {
      console.error('Erro ao registrar na timeline:', historyError);
      // ⚠️ Não falhar a request principal
    }
    
    // 5. Retornar sucesso
    return NextResponse.json({
      success: true,
      data,
    });
    
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

---

### **2.3. APIs de Leitura** ✅ (Já Existem)

#### **A. API Genérica para Buscar Histórico**
**Arquivo:** `/app/api/[role]/vehicle-history/route.ts`

**Exemplos Existentes:**
- `/app/api/admin/vehicle-history/route.ts`
- `/app/api/client/vehicle-history/route.ts`
- `/app/api/partner/vehicle-history/route.ts`
- `/app/api/specialist/vehicle-history/route.ts`

**Estrutura:**
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');
  
  const { data: history, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });
  
  return NextResponse.json({ success: true, history });
}
```

**⚠️ Não precisa modificar** para adicionar novo trigger!

---

## ⚛️ **3. FRONTEND (React/Next.js)**

### **3.1. Hook de Dados** ✅ (Já Existe)

**Arquivo:** `/modules/vehicles/hooks/useVehicleHistory.ts`

**Funcionalidade:**
```typescript
export function useVehicleHistory(
  role: 'client' | 'specialist' | 'admin' | 'partner',
  vehicleId?: string
) {
  const [history, setHistory] = useState<VehicleHistoryEntry[]>([]);
  
  useEffect(() => {
    // 1. Buscar histórico inicial
    const resp = await get(`/api/${role}/vehicle-history?vehicleId=${vehicleId}`);
    setHistory(resp.data.history || []);
  }, [vehicleId]);
  
  useEffect(() => {
    // 2. 🔥 REALTIME: Escutar novos eventos
    const channel = supabase
      .channel(`vehicle_history:${vehicleId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vehicle_history',
        filter: `vehicle_id=eq.${vehicleId}`,
      }, payload => {
        const newEntry = payload.new as VehicleHistoryEntry;
        setHistory(prev => [...prev, newEntry].sort(...));
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [vehicleId]);
  
  return { history, loading, error };
}
```

**⚠️ Não precisa modificar** para adicionar novo trigger!
- O realtime já escuta **TODOS** os INSERTS automaticamente

---

### **3.2. Componente de Exibição** ✅ (Já Existe)

**Arquivo:** `/modules/vehicles/components/TimelineSection.tsx`

**Funcionalidade:**
```typescript
const TimelineSection: React.FC<TimelineProps> = ({
  createdAt,
  vehicleHistory = [],
}) => {
  // 1. Ordenar eventos
  const sortedHistory = useMemo(() => {
    return [...vehicleHistory].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [vehicleHistory]);
  
  // 2. Mapear status para labels
  const getEventTitle = (historyEntry: VehicleHistoryEntry): string => {
    const { status, partner_service } = historyEntry;
    let baseTitle = statusDisplayMap[status] || formatStatus(status);
    
    if (partner_service) {
      return `${baseTitle} - ${partner_service}`;
    }
    
    return baseTitle;
  };
  
  return (
    <div>
      {/* Eventos fixos */}
      <Event dotColor="#3498db" title="Veículo Cadastrado" date={...} />
      
      {/* Eventos dinâmicos do histórico */}
      {sortedHistory.map(h => (
        <Event
          key={h.id}
          dotColor={getStatusColor(h.status)}
          title={getEventTitle(h)}
          date={formatDate(h.created_at)}
        />
      ))}
    </div>
  );
};
```

**⚠️ Modificação Necessária:** Apenas adicionar mapeamento de status!

---

### **3.3. Constantes de Mapeamento** 🔧 (Precisa Atualizar)

**Arquivo:** `/modules/vehicles/components/TimelineSection.tsx` (linha 30-40)

**Atualização Necessária:**
```typescript
const statusDisplayMap: Record<string, string> = {
  orcamento_iniciado: 'Orçamento Iniciado',
  orcamento_finalizado: 'Orçamento Finalizado',
  orcamento_aprovado: 'Orçamento Aprovado',
  orcamento_reprovado: 'Orçamento Reprovado',
  servico_iniciado: 'Serviço Iniciado',
  servico_finalizado: 'Serviço Finalizado',
  
  // 🆕 ADICIONAR NOVOS STATUS AQUI
  evidencias_iniciadas: 'Evidências Iniciadas',
  evidencias_finalizadas: 'Evidências Finalizadas',
  // ... outros novos status
};
```

---

### **3.4. Constantes de Cores** 🔧 (Precisa Atualizar)

**Arquivo:** `/modules/vehicles/constants/timelineColors.ts`

**Atualização Necessária:**
```typescript
export const STATUS_COLOR_MAP: Record<string, string> = {
  // ... status existentes
  
  // 🆕 ADICIONAR CORES PARA NOVOS STATUS
  evidencias_iniciadas: TIMELINE_COLORS.BLUE,
  evidencias_finalizadas: TIMELINE_COLORS.GREEN,
};

// Ou adicionar nova palavra-chave na função getStatusColor:
export function getStatusColor(statusLabel: string): string {
  const normalized = statusLabel.toLowerCase();
  
  // 🆕 ADICIONAR NOVA CONDIÇÃO
  if (normalized.includes('evidência')) return TIMELINE_COLORS.BLUE;
  
  // ... outras condições
}
```

---

### **3.5. Páginas que Usam a Timeline** ✅ (Não Precisa Modificar)

**Arquivos:**
1. `/app/dashboard/admin/vehicle/[vehicleId]/page.tsx`
2. `/app/dashboard/client/vehicle/[vehicleId]/page.tsx`
3. `/app/dashboard/specialist/vehicle/[vehicleId]/page.tsx`
4. `/modules/vehicles/components/VehicleDetails.tsx`

**Estrutura:**
```tsx
const VehicleDetailsPage = () => {
  const { vehicle, inspection, mediaUrls, loading } = useVehicleDetails(vehicleId);
  const { history } = useVehicleHistory('admin', vehicleId);
  
  return (
    <>
      <VehicleInfoCard vehicle={vehicle} />
      
      {/* Timeline atualiza automaticamente */}
      <TimelineSection
        createdAt={vehicle.created_at}
        vehicleHistory={history}  // 🔥 Recebe array atualizado em tempo real
      />
    </>
  );
};
```

**⚠️ Não precisa modificar** - já está preparado para novos eventos!

---

## 🎨 **4. TIPOS TYPESCRIPT**

### **4.1. Interface de VehicleHistoryEntry** ✅ (Já Existe)

**Arquivo:** `/modules/vehicles/components/TimelineSection.tsx` (linha 14-22)

**Estrutura Atual:**
```typescript
export interface VehicleHistoryEntry {
  id: string;
  vehicle_id: string;
  status: string;
  partner_service?: string;  // Opcional - categoria de serviço
  prevision_date: string | null;
  end_date: string | null;
  created_at: string;
  notes?: string;  // Opcional - contexto adicional
}
```

**⚠️ Não precisa modificar** - campos são flexíveis!

---

### **4.2. Enum de Status** 🔧 (Opcional - Para Type Safety)

**Arquivo a Criar:** `/modules/vehicles/types/vehicleStatus.ts`

**Exemplo:**
```typescript
export enum VehicleHistoryStatus {
  // Cadastro
  VEICULO_CADASTRADO = 'veiculo_cadastrado',
  
  // Orçamentação
  FASE_ORCAMENTARIA_INICIADA = 'FASE ORÇAMENTÁRIA',
  ORCAMENTO_INICIADO = 'orcamento_iniciado',
  ORCAMENTO_FINALIZADO = 'orcamento_finalizado',
  ORCAMENTO_APROVADO = 'orcamento_aprovado',
  ORCAMENTO_REPROVADO = 'orcamento_reprovado',
  
  // Execução
  SERVICO_INICIADO = 'servico_iniciado',
  SERVICO_FINALIZADO = 'servico_finalizado',
  
  // 🆕 Evidências
  EVIDENCIAS_INICIADAS = 'evidencias_iniciadas',
  EVIDENCIAS_FINALIZADAS = 'evidencias_finalizadas',
}

export type VehicleHistoryStatusType = `${VehicleHistoryStatus}`;
```

---

## 📝 **5. CHECKLIST COMPLETO**

### **Para Adicionar um Novo Evento à Timeline:**

#### **1. Backend (Obrigatório)**
- [ ] Criar/Modificar API route que dispara o evento
- [ ] Adicionar INSERT na tabela `vehicle_history`
- [ ] Definir `status` (ex: 'evidencias_iniciadas')
- [ ] Definir `partner_service` (opcional)
- [ ] Definir `notes` (opcional - contexto)
- [ ] Testar com Postman/Insomnia

#### **2. Database (Se Novo Status)**
- [ ] Criar migration para adicionar ao enum `vehicle_status`
- [ ] Aplicar migration: `npx supabase migration up`
- [ ] Verificar RLS policies (se necessário adicionar nova)

#### **3. Frontend (Obrigatório)**
- [ ] Adicionar mapeamento em `statusDisplayMap`
- [ ] Adicionar cor em `STATUS_COLOR_MAP` ou `getStatusColor()`
- [ ] Testar visualização na timeline
- [ ] Verificar realtime funcionando

#### **4. Tipos (Opcional mas Recomendado)**
- [ ] Adicionar ao enum `VehicleHistoryStatus`
- [ ] Atualizar tipos se novos campos forem adicionados

#### **5. Testes**
- [ ] Testar inserção via API
- [ ] Verificar aparição na timeline
- [ ] Verificar realtime (abrir em 2 abas)
- [ ] Testar ordenação cronológica
- [ ] Testar cores e labels

---

## 📊 **6. FLUXO COMPLETO (Exemplo: Evidências de Execução)**

### **Cenário:** Partner finaliza upload de evidências

```
1. USER ACTION (Frontend)
   └─> Partner clica em "Finalizar Execução"
   
2. API REQUEST
   └─> POST /api/partner/execution-evidences/finalize
       Body: { quoteId: '123', vehicleId: 'abc' }
   
3. API HANDLER (Backend)
   ├─> Valida dados
   ├─> Atualiza execution_checklists (status: completed)
   ├─> 🎯 INSERT em vehicle_history:
   │   {
   │     vehicle_id: 'abc',
   │     status: 'evidencias_finalizadas',
   │     partner_service: 'mecanica',
   │     notes: 'Partner finalizou upload de evidências'
   │   }
   └─> Retorna sucesso
   
4. SUPABASE REALTIME
   └─> Detecta INSERT em vehicle_history
   └─> Envia via WebSocket para clientes conectados
   
5. FRONTEND (useVehicleHistory Hook)
   └─> Recebe notificação via WebSocket
   └─> Atualiza state: setHistory([...prev, newEntry])
   
6. REACT RE-RENDER
   └─> TimelineSection recebe novo array
   └─> Renderiza novo evento com:
       - Título: "Evidências Finalizadas - Mecânica"
       - Cor: Verde (#27ae60)
       - Data: "10/10/2025 14:30"
```

---

## 🗂️ **7. RESUMO DE ARQUIVOS**

### **Arquivos Existentes (Não Modificar)**
✅ `/supabase/migrations/20250929120000_create_vehicle_history_table.sql`
✅ `/modules/vehicles/hooks/useVehicleHistory.ts`
✅ `/modules/vehicles/hooks/useVehicleDetails.ts`
✅ `/app/dashboard/*/vehicle/[vehicleId]/page.tsx` (4 páginas)

### **Arquivos Existentes (Modificar)**
🔧 `/modules/vehicles/components/TimelineSection.tsx` - Adicionar mapeamento
🔧 `/modules/vehicles/constants/timelineColors.ts` - Adicionar cor

### **Arquivos a Criar**
🆕 `/app/api/[role]/[feature]/route.ts` - Nova API
🆕 `/supabase/migrations/[TIMESTAMP]_add_new_status.sql` - Se novo enum
🆕 `/modules/vehicles/types/vehicleStatus.ts` - Enum de status (opcional)

### **Total de Modificações Mínimas**
- **0 arquivos** de hook/realtime (já funcionam)
- **1 arquivo** de componente (adicionar mapeamento)
- **1 arquivo** de constantes (adicionar cor)
- **1 arquivo** de API (criar novo endpoint)
- **1 arquivo** de migration (se novo enum)

**Total: 2-4 arquivos modificados/criados!**

---

## ⚡ **8. PADRÃO DE NOMENCLATURA**

### **Status Recomendados:**
```typescript
// Formato: acao_fase
'orcamento_iniciado'
'orcamento_finalizado'
'orcamento_aprovado'
'orcamento_reprovado'

'servico_iniciado'
'servico_em_andamento'
'servico_finalizado'

'evidencias_iniciadas'
'evidencias_em_progresso'
'evidencias_finalizadas'

'inspecao_iniciada'
'inspecao_finalizada'
```

### **Labels para Display:**
```typescript
'Orçamento Iniciado'
'Orçamento Finalizado'
'Orçamento Aprovado pelo Admin'
'Serviço em Andamento - Mecânica'
'Evidências Finalizadas - Funilaria'
```

---

## 🎯 **9. EXEMPLO REAL**

### **Novo Trigger: "Cliente Aprovou Orçamento"**

#### **1. API (Criar)**
```typescript
// /app/api/client/quotes/[quoteId]/approve/route.ts
export async function POST(req: Request, { params }: { params: { quoteId: string } }) {
  const { quoteId } = params;
  
  // 1. Aprovar quote
  await supabase.from('quotes').update({ 
    status: 'approved_by_client' 
  }).eq('id', quoteId);
  
  // 2. Buscar vehicle_id
  const { data: quote } = await supabase
    .from('quotes')
    .select('service_orders(vehicle_id)')
    .eq('id', quoteId)
    .single();
  
  // 3. 🎯 Registrar na timeline
  await supabase.from('vehicle_history').insert({
    vehicle_id: quote.service_orders.vehicle_id,
    status: 'orcamento_aprovado_cliente',
    notes: 'Cliente aprovou o orçamento',
  });
  
  return NextResponse.json({ success: true });
}
```

#### **2. Mapeamento (Modificar)**
```typescript
// /modules/vehicles/components/TimelineSection.tsx
const statusDisplayMap: Record<string, string> = {
  // ... outros
  orcamento_aprovado_cliente: 'Orçamento Aprovado pelo Cliente', // 🆕
};
```

#### **3. Cor (Modificar)**
```typescript
// /modules/vehicles/constants/timelineColors.ts
export const STATUS_COLOR_MAP: Record<string, string> = {
  // ... outros
  orcamento_aprovado_cliente: TIMELINE_COLORS.GREEN, // 🆕
};
```

**PRONTO!** Evento aparecerá automaticamente na timeline. 🎉

---

## 📌 **10. NOTAS IMPORTANTES**

### **Realtime já está configurado!**
- ✅ Hook escuta INSERT em `vehicle_history`
- ✅ Filtra por `vehicle_id`
- ✅ Atualiza state automaticamente
- ✅ Timeline re-renderiza com novo evento

### **Não precisa modificar:**
- ❌ Estrutura da tabela (flexível)
- ❌ RLS policies (service_role insere)
- ❌ Hook de dados (genérico)
- ❌ Páginas que usam timeline (props genéricas)

### **Sempre faça:**
- ✅ INSERT no backend (service_role)
- ✅ Incluir `vehicle_id` + `status` (obrigatórios)
- ✅ Adicionar mapeamento de label
- ✅ Adicionar cor correspondente
- ✅ Testar em ambiente local primeiro

---

## 🚀 **Conclusão**

Para adicionar um novo evento à timeline do veículo, você precisa:

1. **Backend:** Inserir registro em `vehicle_history` na API apropriada
2. **Frontend:** Adicionar mapeamento de status e cor
3. **Pronto!** O realtime cuida do resto

**Arquivos a tocar:** 2-4 no máximo
**Complexidade:** Baixa
**Tempo estimado:** 15-30 minutos

O sistema está bem arquitetado para extensibilidade! 🎉
