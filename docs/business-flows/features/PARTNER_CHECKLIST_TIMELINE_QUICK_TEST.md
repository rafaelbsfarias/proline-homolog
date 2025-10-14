# ✅ TIMELINE DE FASE ORÇAMENTÁRIA - TESTE RÁPIDO

## 🎯 O que testar

1. **Primeira salvamento** → Cria entrada na timeline
2. **Salvamentos subsequentes** → NÃO duplica entrada
3. **Múltiplos parceiros** → Cada um cria sua entrada
4. **Visualização** → Timeline aparece na página de detalhes

---

## 🧪 Teste Rápido (5 minutos)

### 1️⃣ Preparar Parceiro

```sql
-- Verificar categoria do parceiro (ou adicionar se não tiver)
SELECT p.profile_id, p.company_name, sc.name as categoria
FROM partners p
LEFT JOIN partners_service_categories psc ON p.profile_id = psc.partner_id
LEFT JOIN service_categories sc ON psc.category_id = sc.id
WHERE p.email = 'email@do-parceiro.com';

-- Se não tiver categoria, adicionar:
INSERT INTO partners_service_categories (partner_id, category_id)
SELECT '{UUID_PARCEIRO}', id FROM service_categories WHERE key = 'mechanics';
```

### 2️⃣ Login e Salvamento

1. Login como parceiro
2. Acessar dashboard
3. Abrir checklist de um veículo
4. Preencher dados básicos e salvar

**Logs esperados:**
```
✅ [api:partner:checklist:submit] timeline_created
   vehicle_id: "08b9e50e"
   status: "Fase Orçamentária Iniciada - Mecânica"
```

### 3️⃣ Verificar Timeline

```sql
-- Ver timeline criada
SELECT * FROM vehicle_history 
WHERE vehicle_id = '{UUID_VEICULO}'
AND status LIKE 'Fase Orçamentária%'
ORDER BY created_at DESC;
```

### 4️⃣ Acessar Página de Detalhes

URL: `/dashboard/vehicle/{vehicleId}`

**Deve aparecer:**
- 🟠 Ícone laranja
- Texto: "Fase Orçamentária Iniciada - Mecânica"
- Data/hora do salvamento

### 5️⃣ Testar Duplicata

1. Voltar ao checklist
2. Salvar novamente
3. Verificar logs:

```
✅ [api:partner:checklist:submit] timeline_already_exists
```

4. Recarregar página de detalhes
5. Confirmar: **APENAS 1 entrada** (sem duplicata)

---

## ✅ Checklist de Validação

- [ ] Build passa: `npm run build`
- [ ] Primeira salvamento cria entrada na timeline
- [ ] Logs mostram `timeline_created`
- [ ] Timeline aparece na página de detalhes do veículo
- [ ] Cor laranja aplicada corretamente
- [ ] Data formatada em português (DD/MM/YYYY)
- [ ] Segundo salvamento NÃO duplica
- [ ] Logs mostram `timeline_already_exists`
- [ ] Query retorna apenas 1 entrada
- [ ] Cliente pode ver timeline (RLS funcionando)

---

## 🐛 Troubleshooting Rápido

### Timeline não aparece
```sql
-- 1. Verificar se foi inserido
SELECT COUNT(*) FROM vehicle_history 
WHERE vehicle_id = '{UUID}' 
AND status LIKE 'Fase Orçamentária%';
-- Deve retornar 1 ou mais

-- 2. Verificar categoria do parceiro
SELECT get_partner_categories('{UUID_PARCEIRO}');
-- Deve retornar: ["Mecânica"] ou similar
```

### Erro de acesso (403)
```bash
# Verificar se partner tem acesso ao veículo
SELECT * FROM partner_clients pc
JOIN vehicles v ON v.client_id = pc.client_id
WHERE pc.partner_id = '{UUID_PARCEIRO}'
AND v.id = '{UUID_VEICULO}';
```

### Realtime não funciona
```javascript
// Abrir console do browser na página de detalhes
// Deve ver: realtime_sub_status { channel: 'vehicle_history', status: 'SUBSCRIBED' }
```

---

## 🎬 Demo Completa (Opcional)

1. Abrir 2 abas do browser
2. **Aba 1:** Página de detalhes do veículo (como client/admin)
3. **Aba 2:** Checklist do parceiro
4. Na aba 2, salvar checklist
5. **Aba 1 atualiza automaticamente** (realtime) 🎉

---

## 📊 Queries Úteis

```sql
-- Ver todas as timelines de orçamentação
SELECT 
  v.plate,
  vh.status,
  vh.created_at,
  p.company_name
FROM vehicle_history vh
JOIN vehicles v ON vh.vehicle_id = v.id
LEFT JOIN mechanics_checklist mc ON mc.vehicle_id = vh.vehicle_id
LEFT JOIN partners p ON p.profile_id = mc.partner_id
WHERE vh.status LIKE 'Fase Orçamentária%'
ORDER BY vh.created_at DESC
LIMIT 10;

-- Verificar duplicatas (não deveria ter)
SELECT vehicle_id, status, COUNT(*) as count
FROM vehicle_history
WHERE status LIKE 'Fase Orçamentária%'
GROUP BY vehicle_id, status
HAVING COUNT(*) > 1;
```

---

**Status das correções:**
- ✅ Código duplicado removido
- ✅ Endpoint `/api/partner/vehicle-history` criado
- ✅ Type system corrigido
- ✅ Build passando
- ✅ RLS validado

**Pronto para produção!** 🚀
