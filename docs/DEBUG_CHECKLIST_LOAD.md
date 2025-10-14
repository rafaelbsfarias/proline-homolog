# Debug: Checklist não carrega dados ao atualizar página

## 🎯 Problema
Ao atualizar a página `/dashboard/partner/checklist?quoteId=...`, os dados não estão sendo recuperados:
- Estado do formulário (status dos itens, observações)
- Solicitações de compra (part_requests)

## 🔍 Diagnóstico

### 1. Abra o Console do Navegador
1. Acesse: `http://localhost:3000/dashboard/partner/checklist?quoteId=c03deec9-1043-4d90-8308-0e4b1c83f92e`
2. Pressione `F12` para abrir DevTools
3. Vá para a aba **Console**
4. Atualize a página (`F5`)

### 2. Verifique os Logs

Você deve ver logs como:

```
[partner:checklist] checklist_data_loaded {
  has_form: true/false,
  form_keys: X,
  evidences_count: X,
  items_count: X,
  items_with_part_requests: X
}
```

#### Cenário A: `has_form: false` e `items_count: 0`
**Problema:** Dados não estão no banco
**Solução:** Preencha e salve o checklist primeiro

#### Cenário B: `has_form: true` mas `items_count: 0`
**Problema:** Checklist existe mas items não foram salvos
**Solução:** Verifique endpoint `/api/partner/checklist/submit`

#### Cenário C: `items_count: X` mas `items_with_part_requests: 0`
**Problema:** Items existem mas sem part_requests
**Solução:** Verifique se part_requests foram salvos corretamente

#### Cenário D: `items_with_part_requests: X` (maior que 0)
**Problema:** Dados estão carregando mas não aparecem na UI
**Solução:** Verificar restauração do estado na página

### 3. Verifique a Rede (Network Tab)

1. Vá para aba **Network**
2. Atualize a página
3. Procure por requisição: `POST /api/partner/checklist/load`
4. Clique na requisição
5. Vá para **Response**

Verifique a resposta:

```json
{
  "ok": true,
  "data": {
    "form": {
      "clutch": "ok",
      "clutchNotes": "...",
      ...
    },
    "evidences": {
      "clutch": { "url": "https://..." }
    },
    "items": [
      {
        "item_key": "clutch",
        "item_status": "ok",
        "item_notes": "...",
        "part_request": { ... } // <-- DEVE ESTAR AQUI
      }
    ]
  }
}
```

### 4. Verifique o SessionStorage

No Console, execute:

```javascript
sessionStorage.getItem('loaded_part_requests')
```

Deve retornar:
```json
"{\"clutch\":{\"partName\":\"...\",\"quantity\":1,...}}"
```

Se retornar `null`, os part_requests não estão sendo salvos no sessionStorage.

### 5. Verifique o Estado do React

No Console, execute:

```javascript
// Isso vai mostrar o estado atual do componente
document.querySelector('[data-testid="checklist-form"]')
```

## 🛠️ Soluções por Cenário

### Solução 1: Dados não estão no banco
1. Preencha o checklist completamente
2. Adicione solicitações de compra nos items
3. Salve o checklist
4. Atualize a página

### Solução 2: API não retorna `items`
Verifique se `ChecklistService.loadChecklistWithDetails()` retorna `items`:

```typescript
// modules/partner/services/checklist/ChecklistService.ts
return {
  success: true,
  data: {
    form: formPartial,
    evidences,
    items, // <-- DEVE ESTAR AQUI
  },
};
```

### Solução 3: Items não têm `part_request`
Verifique se `ChecklistItemService.loadItems()` seleciona `part_request`:

```typescript
// modules/partner/services/checklist/items/ChecklistItemService.ts
.select('item_key, item_status, item_notes, part_request')
```

### Solução 4: SessionStorage não funciona
Problema pode ser:
- SSR (Server-Side Rendering) tentando acessar sessionStorage
- Navegador bloqueando cookies/storage

**Solução alternativa:** Retornar part_requests diretamente no hook

## 📊 Checklist de Verificação

- [ ] Console mostra logs `checklist_data_loaded`
- [ ] API `/api/partner/checklist/load` retorna dados
- [ ] Response tem propriedade `items`
- [ ] Items têm `part_request` preenchido
- [ ] SessionStorage tem `loaded_part_requests`
- [ ] useEffect na página recupera os dados
- [ ] Estado `itemPartRequests` é atualizado

## 🔄 Testes

### Teste 1: Criar novo checklist
```bash
# 1. Limpar dados existentes (opcional)
# No Supabase Studio: DELETE FROM mechanics_checklist_items WHERE quote_id = '...';

# 2. Preencher checklist
# - Acesse a página
# - Preencha alguns campos
# - Adicione solicitação de compra em um item
# - Salve

# 3. Atualizar página
# - Pressione F5
# - Verificar se dados foram restaurados
```

### Teste 2: Verificar banco de dados
```sql
-- Ver checklist items com part_requests
SELECT 
  item_key,
  item_status,
  item_notes,
  part_request,
  quote_id
FROM mechanics_checklist_items
WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e';
```

## 📝 Próximos Passos

1. **Execute os testes acima** e anote os resultados
2. **Compartilhe os logs** do console
3. **Compartilhe a resposta** da API `/api/partner/checklist/load`
4. Com essas informações, posso identificar exatamente onde está o problema

## 🆘 Informações Necessárias para Debug

Por favor, me envie:

1. **Logs do Console** (print ou copiar texto)
2. **Response da API** `POST /api/partner/checklist/load`
3. **Resultado de** `sessionStorage.getItem('loaded_part_requests')`
4. **Query SQL** mostrando dados no banco

Com essas 4 informações, posso identificar o problema exato! 🎯
