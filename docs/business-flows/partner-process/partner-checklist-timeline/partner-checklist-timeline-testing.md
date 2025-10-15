# Guia de Testes - Timeline de Fase Orçamentária

## 🧪 Como Testar a Funcionalidade

### Pré-requisitos
- Ambiente local rodando (`npm run dev`)
- Acesso ao Supabase (verificar migrations aplicadas)
- Usuário parceiro cadastrado com categoria definida
- Veículo em estado permitido para checklist

### Passo a Passo

#### 1. Verificar Categoria do Parceiro

```sql
-- Verificar se o parceiro tem categoria definida
SELECT 
  p.profile_id,
  p.company_name,
  sc.name as categoria
FROM partners p
LEFT JOIN partners_service_categories psc ON p.profile_id = psc.partner_id
LEFT JOIN service_categories sc ON psc.category_id = sc.id
WHERE p.profile_id = 'UUID_DO_PARCEIRO';

-- Se não tiver, adicionar categoria
INSERT INTO partners_service_categories (partner_id, category_id)
SELECT 
  'UUID_DO_PARCEIRO',
  id
FROM service_categories
WHERE key = 'mechanics'; -- ou 'body_paint', 'washing', 'tires'
```

#### 2. Preparar Veículo

```sql
-- Verificar estado do veículo
SELECT id, plate, status FROM vehicles WHERE id = 'UUID_DO_VEICULO';

-- Status permitidos para checklist:
-- - 'Aguardando Coleta'
-- - 'Aguardando Chegada'
-- - 'Chegada Confirmada'
-- - 'Em Análise'

-- Criar inspeção se não existir
INSERT INTO inspections (vehicle_id, inspection_date, odometer, fuel_level, finalized)
VALUES ('UUID_DO_VEICULO', CURRENT_DATE, 50000, 'half', false);
```

#### 3. Login como Parceiro

1. Acessar `/login`
2. Entrar com credenciais do parceiro
3. Verificar que o dashboard mostra veículos disponíveis

#### 4. Primeiro Salvamento

1. Acessar checklist do veículo
2. Preencher dados mínimos:
   - Data da inspeção
   - Quilometragem
   - Nível de combustível
   - Pelo menos um item do checklist
3. Clicar em "Salvar Checklist"
4. Aguardar mensagem de sucesso

**Logs Esperados:**
```
[api:partner:checklist:submit] submit_start
[api:partner:checklist:submit] mechanics_checklist_upsert_ok
[api:partner:checklist:submit] timeline_created {
  vehicle_id: "08b9e50e",
  status: "Fase Orçamentária Iniciada - Mecânica",
  partner_id: "7b497d89"
}
```

#### 5. Verificar Timeline no Banco

```sql
-- Verificar entrada criada
SELECT * FROM vehicle_history 
WHERE vehicle_id = 'UUID_DO_VEICULO'
ORDER BY created_at DESC;

-- Deve conter:
-- status: 'Fase Orçamentária Iniciada - Mecânica' (ou outra categoria)
-- created_at: timestamp do salvamento
```

#### 6. Visualizar na Interface

1. Acessar `/dashboard/vehicle/[vehicleId]` (como client, admin ou specialist)
2. Verificar seção "Timeline do Veículo"
3. Confirmar entrada com:
   - ✅ Ícone laranja (#f39c12)
   - ✅ Texto "Fase Orçamentária Iniciada - Mecânica"
   - ✅ Data do salvamento

#### 7. Segundo Salvamento (Teste de Duplicata)

1. Voltar ao checklist
2. Fazer alterações nos dados
3. Salvar novamente
4. Verificar logs

**Logs Esperados:**
```
[api:partner:checklist:submit] submit_start
[api:partner:checklist:submit] mechanics_checklist_upsert_ok
[api:partner:checklist:submit] timeline_already_exists {
  vehicle_id: "08b9e50e"
}
```

**Verificação no Banco:**
```sql
-- Deve retornar apenas 1 entrada
SELECT COUNT(*) FROM vehicle_history 
WHERE vehicle_id = 'UUID_DO_VEICULO'
AND status LIKE 'Fase Orçamentária Iniciada%';
-- Expected: 1
```

### 🎯 Checklist de Validação

- [ ] Primeira salvamento cria entrada na timeline
- [ ] Entrada mostra categoria correta do parceiro
- [ ] Segundo salvamento NÃO cria duplicata
- [ ] Timeline aparece na página de detalhes do veículo
- [ ] Cor laranja (#f39c12) é aplicada
- [ ] Data está correta (formato brasileiro)
- [ ] Ordem cronológica está correta
- [ ] Cliente pode ver a timeline (RLS funcionando)
- [ ] Múltiplos parceiros criam entradas distintas
- [ ] Erro na timeline não bloqueia salvamento do checklist

### 🐛 Troubleshooting

#### Entrada não aparece na timeline

**Possíveis causas:**
1. Parceiro não tem categoria definida
   - Solução: Adicionar via `partners_service_categories`
2. Não foi o primeiro salvamento
   - Verificar: `created_at !== updated_at` em `mechanics_checklist`
3. Já existe entrada duplicada
   - Verificar: Query por status exato na `vehicle_history`

#### Categoria aparece como "Parceiro"

**Causa:** `get_partner_categories` retorna array vazio

**Solução:**
```sql
-- Adicionar categoria ao parceiro
INSERT INTO partners_service_categories (partner_id, category_id)
SELECT 
  'UUID_PARCEIRO',
  id
FROM service_categories
WHERE key = 'mechanics'; -- categoria desejada
```

#### Erro RLS ao inserir na timeline

**Causa:** Backend deve usar `service_role` para escrever

**Verificação:**
```typescript
// No código deve estar usando:
const supabase = SupabaseService.getInstance().getAdminClient();
// NÃO usar: supabase = createClient() (client-side)
```

#### Timeline não aparece para cliente

**Causa:** RLS policy não permite acesso

**Verificação:**
```sql
-- Verificar se política existe
SELECT * FROM pg_policies 
WHERE tablename = 'vehicle_history';

-- Verificar se veículo pertence ao cliente
SELECT client_id FROM vehicles WHERE id = 'UUID_VEICULO';
```

### 📊 Queries Úteis

#### Ver todas as timelines de um veículo
```sql
SELECT 
  vh.status,
  vh.created_at,
  TO_CHAR(vh.created_at, 'DD/MM/YYYY HH24:MI') as data_formatada,
  v.plate
FROM vehicle_history vh
JOIN vehicles v ON vh.vehicle_id = v.id
WHERE v.id = 'UUID_VEICULO'
ORDER BY vh.created_at ASC;
```

#### Ver parceiros que já iniciaram orçamentação
```sql
SELECT 
  vh.vehicle_id,
  v.plate,
  vh.status,
  vh.created_at,
  p.company_name
FROM vehicle_history vh
JOIN vehicles v ON vh.vehicle_id = v.id
JOIN mechanics_checklist mc ON mc.vehicle_id = vh.vehicle_id
JOIN partners p ON p.profile_id = mc.partner_id
WHERE vh.status LIKE 'Fase Orçamentária Iniciada%'
ORDER BY vh.created_at DESC;
```

#### Limpar timeline de teste
```sql
-- CUIDADO: Apenas em ambiente de desenvolvimento!
DELETE FROM vehicle_history 
WHERE vehicle_id = 'UUID_VEICULO'
AND status LIKE 'Fase Orçamentária Iniciada%';
```

### 🔄 Reset de Estado para Novo Teste

```sql
-- 1. Remover entrada da timeline
DELETE FROM vehicle_history 
WHERE vehicle_id = 'UUID_VEICULO'
AND status LIKE 'Fase Orçamentária Iniciada%';

-- 2. Remover checklist (para simular primeira vez)
DELETE FROM mechanics_checklist_items 
WHERE vehicle_id = 'UUID_VEICULO';

DELETE FROM mechanics_checklist_evidences 
WHERE vehicle_id = 'UUID_VEICULO';

DELETE FROM mechanics_checklist 
WHERE vehicle_id = 'UUID_VEICULO';

-- 3. Agora pode testar primeiro salvamento novamente
```

### 📝 Cenários de Teste Completos

#### Cenário A: Fluxo Normal
```
1. Parceiro (Mecânica) faz login
2. Acessa veículo ABC-1234
3. Preenche checklist
4. Salva (primeira vez)
5. ✓ Timeline mostra: "Fase Orçamentária Iniciada - Mecânica"
6. Cliente visualiza timeline no dashboard
7. ✓ Entrada aparece corretamente
```

#### Cenário B: Múltiplos Parceiros
```
1. Parceiro A (Mecânica) salva checklist
2. ✓ Timeline: "Fase Orçamentária Iniciada - Mecânica"
3. Parceiro B (Funilaria) salva checklist
4. ✓ Timeline: "Fase Orçamentária Iniciada - Funilaria/Pintura"
5. Resultado: 2 entradas distintas na timeline
```

#### Cenário C: Salvamentos Sucessivos
```
1. Parceiro salva checklist (primeira vez)
2. ✓ Timeline criada
3. Parceiro edita e salva novamente
4. ✓ Timeline NÃO duplica
5. Parceiro salva 5 vezes mais
6. ✓ Apenas 1 entrada permanece
```

#### Cenário D: Erro Não-Bloqueante
```
1. Simular erro na inserção da timeline
   - Remover permissão temporariamente
2. Parceiro salva checklist
3. ✓ Checklist é salvo com sucesso
4. ✗ Timeline não é criada (log de erro)
5. ✓ Usuário recebe "success: true"
```

### 🎬 Demo em Vídeo

Para gravar demo:
1. Abrir DevTools > Network
2. Filtrar por "submit"
3. Fazer primeiro salvamento
4. Mostrar response: `{ success: true }`
5. Ir para Detalhes do Veículo
6. Scrollar até Timeline
7. Mostrar entrada com data/hora
8. Voltar ao checklist
9. Fazer segundo salvamento
10. Recarregar Detalhes do Veículo
11. Mostrar que timeline NÃO duplicou

---

**Última atualização:** 2025-10-09  
**Versão:** 1.0.0
