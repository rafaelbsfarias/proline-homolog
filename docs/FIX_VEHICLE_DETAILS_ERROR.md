# Fix: Erro ao Carregar Detalhes do Veículo

**Data**: 08/10/2025  
**Issue**: Console Error ao acessar página de detalhes do veículo

## Erro Original

```
[ERROR][client:useVehicleDetails] "Error fetching vehicle details:" 
Error: Erro ao carregar veículo
```

## Análise do Problema

### Possíveis Causas Identificadas

1. **Banco de dados resetado**: O comando `supabase db reset` foi executado, removendo todos os dados
2. **Veículo inexistente**: Tentativa de acessar um veículo que não existe mais no banco
3. **Erro na API de histórico**: A nova funcionalidade de buscar histórico pode estar causando falha
4. **Erro de autorização**: Problemas com RLS ou autenticação

### Investigação Realizada

#### Endpoints Verificados
- ✅ `/app/api/client/vehicles/[vehicleId]/route.ts` - Existe e está correto
- ✅ `/app/api/specialist/vehicles/[vehicleId]/route.ts` - Existe e está correto
- ✅ `/app/api/client/vehicle-history/route.ts` - Criado recentemente
- ✅ `/app/api/specialist/vehicle-history/route.ts` - Criado recentemente

#### Hook Verificado
- `/modules/vehicles/hooks/useVehicleDetails.ts` - Atualizado para buscar histórico

## Correções Aplicadas

### 1. Tratamento de Erro do Histórico

**Problema**: Se a busca do histórico falhasse, toda a requisição falhava.

**Solução**: Isolado o erro do histórico em try-catch separado:

```typescript
// Buscar histórico do veículo (não falhar se der erro)
try {
  const historyResp = await get<VehicleHistoryResponse>(
    `/api/${role}/vehicle-history?vehicleId=${vehicleId}`
  );

  if (historyResp.ok && historyResp.data?.success && historyResp.data.history) {
    setVehicleHistory(historyResp.data.history);
  }
} catch (historyError) {
  // Log mas não falhar a request principal
  logger.warn('Failed to fetch vehicle history:', historyError);
}
```

### 2. Melhoria nos Logs

**Adicionado**:
```typescript
logger.info('Vehicle response received', {
  ok: vehicleResp.ok,
  status: vehicleResp.status,
  success: vehicleResp.data?.success,
  hasVehicle: !!vehicleResp.data?.vehicle,
  error: vehicleResp.data?.error,
});
```

### 3. Mensagens de Erro Mais Descritivas

**Antes**:
```typescript
if (!vehicleResp.ok || !vehicleResp.data?.success) {
  throw new Error(vehicleResp.data?.error || 'Erro ao carregar veículo');
}
```

**Depois**:
```typescript
if (!vehicleResp.ok) {
  throw new Error(
    vehicleResp.error || 
    `Erro HTTP ${vehicleResp.status}: ${vehicleResp.data?.error || 'Erro desconhecido'}`
  );
}

if (!vehicleResp.data?.success) {
  throw new Error(vehicleResp.data?.error || 'Resposta inválida da API');
}
```

## Como Testar

### 1. Verificar Banco de Dados

Antes de testar a página, certifique-se de que existem dados:

```bash
# Verificar se existem veículos
supabase db inspect

# Ou populando dados de teste
npm run db:populate  # se este script existir
```

### 2. Criar Dados de Teste Manualmente

Se necessário, você pode criar dados via SQL:

```sql
-- Inserir cliente de teste
INSERT INTO profiles (id, role, full_name, email) 
VALUES (
  auth.uid(),
  'client',
  'Cliente Teste',
  'cliente@teste.com'
);

-- Inserir veículo de teste
INSERT INTO vehicles (
  client_id,
  plate,
  brand,
  model,
  year,
  color,
  status,
  created_at
) VALUES (
  auth.uid(),
  'ABC-1234',
  'Toyota',
  'Corolla',
  2020,
  'Prata',
  'Em Análise',
  NOW()
);
```

### 3. Testar a Página

1. Faça login como cliente
2. Acesse o dashboard
3. Clique em um veículo para ver os detalhes
4. Verifique os logs no console do navegador

**Logs esperados**:
```
[INFO][client:useVehicleDetails] Vehicle response received {
  ok: true,
  status: 200,
  success: true,
  hasVehicle: true,
  error: undefined
}
```

### 4. Testar com Veículo Inexistente

1. Tente acessar `/dashboard/vehicle/00000000-0000-0000-0000-000000000000`
2. Deve mostrar erro apropriado: "Veículo não encontrado ou acesso negado"

## Verificação de Funcionamento

### Checklist

- [ ] Página de detalhes do veículo carrega sem erros
- [ ] Timeline é exibida corretamente
- [ ] Timeline mostra histórico se disponível
- [ ] Erro de histórico não impede carregamento da página
- [ ] Mensagens de erro são descritivas
- [ ] Logs ajudam a debugar problemas

### Comandos Úteis

```bash
# Ver logs do Next.js
npm run dev

# Ver logs do Supabase
supabase db inspect

# Resetar banco e aplicar migrations
supabase db reset

# Ver tabelas e dados
supabase db inspect tables
```

## Possíveis Problemas Futuros

### 1. Políticas RLS

Se o erro persistir, verifique as políticas RLS da tabela `vehicles`:

```sql
-- Ver políticas da tabela vehicles
SELECT * FROM pg_policies WHERE tablename = 'vehicles';
```

### 2. Endpoint de Histórico

Se histórico não aparecer, verificar:
- Tabela `vehicle_history` existe
- Políticas RLS da tabela `vehicle_history`
- Logs da API: `/api/{role}/vehicle-history`

### 3. Dados Incompletos

Se alguns campos aparecem como `undefined`:
- Verificar mapeamento no endpoint da API
- Verificar tipo TypeScript vs estrutura do banco
- Verificar select query no service

## Arquivos Modificados

- `/modules/vehicles/hooks/useVehicleDetails.ts` - Melhor tratamento de erros e logs
- `/docs/FIX_VEHICLE_DETAILS_ERROR.md` - Esta documentação

## Próximos Passos

1. **Se erro persistir após popular dados**: Verificar logs da API no terminal do Next.js
2. **Se histórico não aparecer**: Verificar tabela `vehicle_history` e RLS
3. **Se erro de autorização**: Verificar token JWT e políticas RLS

## Notas Adicionais

- A funcionalidade de histórico foi adicionada recentemente
- O erro pode ter sido causado pela tentativa de buscar histórico em banco vazio
- O isolamento do erro de histórico garante que a página funcione mesmo sem histórico
