# Teste: Recuperação de Imagens do Checklist do Especialista

## Data: 19/10/2025
## Status: Solução A Implementada

---

## ✅ Mudanças Implementadas

### 1. Logging Detalhado no Console
- ✅ Log de paths recebidos da API
- ✅ Log de cada URL sendo gerada
- ✅ Log de sucessos e erros individuais
- ✅ Log de estatísticas finais

### 2. Feedback Visual com Toasts
- ✅ Warning quando uma imagem falha
- ✅ Error quando nenhuma imagem é carregada
- ✅ Warning com estatísticas quando parcialmente carregadas

### 3. Melhorias Técnicas
- ✅ TTL aumentado de 60s para 3600s (1 hora)
- ✅ Try-catch específico para URLs assinadas
- ✅ Contadores de sucesso/erro
- ✅ Mensagens de erro específicas

---

## 🧪 Como Testar

### Pré-requisitos
1. Banco de dados resetado com `npx supabase db reset`
2. Usuários criados (admin, cliente, especialista)
3. Cliente com veículo cadastrado
4. Especialista vinculado ao cliente

### Cenário 1: Checklist SEM Imagens (Baseline)

**Passos:**
1. Login como especialista
2. Abrir checklist de um veículo
3. Preencher dados SEM enviar imagens
4. Salvar checklist
5. Reabrir o checklist

**Resultado Esperado:**
```
Console:
📸 [Checklist] Media paths recebidos: []
ℹ️  [Checklist] Nenhuma imagem salva neste checklist

Interface:
- Sem preview de imagens
- Sem mensagens de erro
```

---

### Cenário 2: Checklist COM Imagens (Upload + Recuperação)

**Passos:**
1. Login como especialista
2. Abrir checklist de um veículo
3. Fazer upload de 2-3 imagens
4. Salvar checklist
5. Fechar modal
6. Reabrir o checklist

**Resultado Esperado (SUCESSO):**
```
Console:
📸 [Checklist] Media paths recebidos: [
  "vehicleId/specialistId/timestamp-0-xxx.jpg",
  "vehicleId/specialistId/timestamp-1-xxx.png"
]
🔄 [Checklist] Gerando URLs assinadas para 2 imagens...
  [Checklist] Processando path: vehicleId/specialistId/timestamp-0-xxx.jpg
  [Checklist] Processando path: vehicleId/specialistId/timestamp-1-xxx.png
✅ [Checklist] Resultados da geração de URLs: [
  { data: { signedUrl: "https://..." }, error: null },
  { data: { signedUrl: "https://..." }, error: null }
]
✅ [Checklist] URL gerada para vehicleId/specialistId/timestamp-0-xxx.jpg
✅ [Checklist] URL gerada para vehicleId/specialistId/timestamp-1-xxx.png
📦 [Checklist] Imagens carregadas: 2/2 (0 erros)

Interface:
- Previews das 2 imagens visíveis
- Botão X para remover cada imagem
- Sem mensagens de erro
```

**Resultado Esperado (ERRO PARCIAL):**
```
Console:
📸 [Checklist] Media paths recebidos: [...]
🔄 [Checklist] Gerando URLs assinadas para 3 imagens...
❌ [Checklist] Erro ao gerar URL para ...: { message: "..." }
✅ [Checklist] URL gerada para ...
✅ [Checklist] URL gerada para ...
📦 [Checklist] Imagens carregadas: 2/3 (1 erros)

Interface:
- Previews de 2 imagens visíveis
- Toast warning: "2 de 3 imagens foram carregadas com sucesso."
- Toast warning individual para a imagem que falhou
```

**Resultado Esperado (ERRO TOTAL):**
```
Console:
📸 [Checklist] Media paths recebidos: [...]
🔄 [Checklist] Gerando URLs assinadas para 2 imagens...
❌ [Checklist] Erro ao gerar URL para ...: { message: "..." }
❌ [Checklist] Erro ao gerar URL para ...: { message: "..." }
📦 [Checklist] Imagens carregadas: 0/2 (2 erros)

Interface:
- Sem previews
- Toast error: "Nenhuma imagem pôde ser carregada. Verifique as permissões."
- Toast warning individual para cada imagem
```

---

### Cenário 3: Remoção de Imagem Antes de Finalizar

**Passos:**
1. Abrir checklist com imagens salvas
2. Clicar no X de uma imagem existente
3. Verificar se a imagem foi removida da visualização
4. Salvar checklist novamente
5. Reabrir checklist

**Resultado Esperado:**
```
- Imagem removida desaparece da visualização
- Ao salvar, imagem não deve estar no array mediaPaths
- Ao reabrir, imagem removida não deve aparecer
```

---

### Cenário 4: Verificar Logs de Erro (Simulação)

Para forçar um erro e ver os logs:

**Opção A - Modificar RLS temporariamente:**
```sql
-- Desabilitar temporariamente a policy de leitura
DROP POLICY IF EXISTS "vehicle_media_specialist_read" ON storage.objects;
```

**Opção B - Corromper path no banco:**
```sql
UPDATE inspection_media 
SET storage_path = 'path/invalido/teste.jpg'
WHERE inspection_id = 'SEU_INSPECTION_ID';
```

**Resultado Esperado:**
```
Console:
❌ [Checklist] Erro ao gerar URL para path/invalido/teste.jpg: {
  message: "Object not found"
}

Interface:
- Toast warning com mensagem de erro
```

---

## 📊 Checklist de Validação

### Funcionalidades Básicas
- [ ] Upload de imagens funciona
- [ ] Salvar checklist com imagens funciona
- [ ] Reabrir checklist mostra imagens salvas
- [ ] Remover imagem existente funciona
- [ ] Finalizar checklist com imagens funciona

### Logging e Feedback
- [ ] Console mostra paths recebidos
- [ ] Console mostra cada URL sendo processada
- [ ] Console mostra erros individuais
- [ ] Console mostra estatísticas finais
- [ ] Toast aparece quando imagem falha
- [ ] Toast aparece quando todas imagens falham
- [ ] Toast aparece quando parcialmente carregadas

### Casos de Erro
- [ ] Erro de permissão é capturado e exibido
- [ ] Path inválido é tratado
- [ ] Bucket inacessível é tratado
- [ ] Sessão expirada é tratada

---

## 🔍 Análise de Logs

### Log Normal (Sucesso)
```
📸 [Checklist] Media paths recebidos: ["xxx/yyy/zzz.jpg"]
🔄 [Checklist] Gerando URLs assinadas para 1 imagens...
  [Checklist] Processando path: xxx/yyy/zzz.jpg
✅ [Checklist] Resultados da geração de URLs: [...]
✅ [Checklist] URL gerada para xxx/yyy/zzz.jpg
📦 [Checklist] Imagens carregadas: 1/1 (0 erros)
```

### Log com Erro (RLS)
```
📸 [Checklist] Media paths recebidos: ["xxx/yyy/zzz.jpg"]
🔄 [Checklist] Gerando URLs assinadas para 1 imagens...
  [Checklist] Processando path: xxx/yyy/zzz.jpg
✅ [Checklist] Resultados da geração de URLs: [...]
❌ [Checklist] Erro ao gerar URL para xxx/yyy/zzz.jpg: {
  name: "StorageApiError",
  message: "new row violates row-level security policy"
}
📦 [Checklist] Imagens carregadas: 0/1 (1 erros)
```

### Log com Erro (Path Inválido)
```
❌ [Checklist] Erro ao gerar URL para invalid/path.jpg: {
  name: "StorageApiError", 
  message: "Object not found"
}
```

---

## 🐛 Troubleshooting

### Problema: Nenhuma imagem aparece
**Verificar:**
1. Console do navegador - Qual erro específico?
2. Banco de dados - `SELECT * FROM inspection_media WHERE inspection_id = '...'`
3. Storage - Arquivo existe? `SELECT * FROM storage.objects WHERE name = '...'`
4. RLS - Especialista tem permissão? Testar query manualmente

### Problema: Erro "Object not found"
**Causa:** Arquivo não existe no storage
**Solução:** Verificar se upload completou, verificar path no DB

### Problema: Erro "row-level security policy"
**Causa:** RLS bloqueando acesso
**Solução:** Verificar vínculo cliente-especialista, verificar policies

### Problema: Erro "Session expired"
**Causa:** Token JWT expirado
**Solução:** Fazer logout/login, refresh da página

---

## 📝 Próximos Passos Após Teste

Se os testes revelarem:

### ✅ Tudo Funciona
- Remover alguns console.logs (manter só os críticos)
- Documentar solução
- Fechar issue

### ❌ Erro de RLS
- Ajustar policies do storage
- Verificar vínculos cliente-especialista
- Adicionar policy específica para createSignedUrl

### ❌ Path Incorreto
- Investigar saveToLocalStorage
- Verificar lógica de upload
- Corrigir geração de path

### ❌ Performance
- Implementar cache de URLs
- Gerar URLs no backend
- Otimizar queries

---

## 📚 Referências

- **Código Alterado:** `modules/specialist/components/VehicleChecklistModal/VehicleChecklistModal.tsx` (linhas 175-242)
- **Documentação:** `docs/investigation/CHECKLIST_IMAGE_RECOVERY_ISSUE.md`
- **Queries de Diagnóstico:** `docs/investigation/diagnostic_queries.sql`
- **Supabase Storage Docs:** https://supabase.com/docs/guides/storage
- **RLS Policies:** `supabase/migrations/20250815120000_create_vehicle_media_bucket.sql`
