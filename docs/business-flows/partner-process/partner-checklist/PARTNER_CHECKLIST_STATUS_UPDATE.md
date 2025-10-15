# Partner Checklist Status Update Implementation

## Objetivo
Quando o parceiro salva o checklist de anomalias, o status do veículo deve ser atualizado automaticamente para **"Fase Orçamentaria"** e uma entrada deve ser criada no histórico do veículo (vehicle_history).

## Implementação

### 1. Migration: `20251009100135_partner_save_checklist_update_vehicle_status.sql`

Criada função RPC **`partner_save_checklist_update_vehicle_status`** que:

- **Parâmetros**: 
  - `p_partner_id` (uuid): ID do parceiro
  - `p_vehicle_id` (uuid): ID do veículo

- **Funcionalidades**:
  1. Verifica se o parceiro tem acesso ao veículo através de quotes pendentes
  2. Busca automaticamente o nome da categoria de serviço do quote
  3. Atualiza o status do veículo para `'Fase Orçamentaria'`
  4. Cria entrada no `vehicle_history` com status detalhado: `"Fase Orçamentária Iniciada - {Nome da Categoria}"`

- **Segurança**:
  - `SECURITY DEFINER`: Executa com privilégios elevados
  - Validação de acesso: Verifica se o parceiro tem quote pendente para o veículo
  - Falha se o parceiro não tiver permissão

- **Query Principal**:
```sql
SELECT sc.name INTO v_service_category_name
FROM quotes q
JOIN service_orders so ON q.service_order_id = so.id
JOIN inspection_services insp_svc ON so.inspection_service_id = insp_svc.id
JOIN service_categories sc ON insp_svc.service_category_id = sc.id
WHERE q.partner_id = p_partner_id
  AND so.vehicle_id = p_vehicle_id
  AND q.status = 'pending_partner'
LIMIT 1;
```

### 2. Modificação: `/app/api/partner/checklist/save-anomalies/route.ts`

Após salvar as anomalias com sucesso, o endpoint agora:

1. Chama a função RPC `partner_save_checklist_update_vehicle_status`
2. Passa o `partner_id` e `vehicle_id` como parâmetros
3. Registra logs detalhados do resultado
4. **Não falha a requisição** se a atualização de status falhar (anomalias já foram salvas)

**Código adicionado**:
```typescript
// Atualizar status do veículo para "Fase Orçamentaria"
const { data: statusUpdateData, error: statusUpdateError } = await supabase.rpc(
  'partner_save_checklist_update_vehicle_status',
  {
    p_partner_id: partnerId,
    p_vehicle_id: vehicle_id,
  }
);

if (statusUpdateError || !statusUpdateData?.ok) {
  logger.warn('vehicle_status_update_failed', {
    error: statusUpdateError?.message || statusUpdateData?.error,
    vehicle_id,
    partner_id: partnerId,
  });
  // Não falhar a requisição - anomalias já foram salvas
} else {
  logger.info('vehicle_status_updated', {
    vehicle_id,
    new_status: statusUpdateData.status,
    history_entry: statusUpdateData.history_entry,
  });
}
```

## Fluxo Completo

1. **Especialista finaliza checklist** → Cria quotes com status `pending_partner`
2. **Parceiro visualiza quote pendente** no dashboard
3. **Parceiro preenche e salva checklist de anomalias** → Chama `/api/partner/checklist/save-anomalies`
4. **API salva anomalias** no banco de dados
5. **API chama RPC** `partner_save_checklist_update_vehicle_status`
6. **RPC atualiza status** do veículo para `"Fase Orçamentaria"`
7. **RPC cria entrada** no `vehicle_history` com texto detalhado: `"Fase Orçamentária Iniciada - Funilaria/Pintura"` (exemplo)
8. **Timeline do cliente** agora mostra essa nova entrada

## Benefícios

- ✅ **Rastreabilidade**: Toda mudança de status é registrada no histórico
- ✅ **Automação**: Não requer intervenção manual
- ✅ **Segurança**: Validação de acesso antes de atualizar
- ✅ **Contexto**: Nome da categoria incluído no histórico
- ✅ **Resiliência**: Falhas na atualização de status não impedem o salvamento das anomalias

## Testes

Scripts de teste criados:
- `/scripts/check-pending-quotes.cjs`: Verifica quotes pending_partner
- `/scripts/test-partner-save-checklist.cjs`: Testa atualização de status completa

## Próximos Passos

1. Testar fluxo end-to-end com usuário parceiro real
2. Verificar se timeline do cliente exibe corretamente a nova entrada
3. Validar permissões RLS para acesso ao vehicle_history

## Observações

- A função busca automaticamente a categoria do serviço, não sendo necessário passar como parâmetro
- Apenas quotes com status `pending_partner` são considerados válidos para atualização
- O status do veículo é sempre `"Fase Orçamentaria"` (padronizado), mas o histórico contém o nome da categoria específica
