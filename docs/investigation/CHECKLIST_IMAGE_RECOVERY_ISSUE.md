# Investigação: Imagens do Checklist do Especialista Não Sendo Recuperadas

**Data:** 19/10/2025  
**Problema:** As imagens salvas no checklist do especialista não estão sendo recuperadas, impossibilitando a deleção antes da finalização do checklist. As imagens também não estão sendo recuperadas em detalhes do veículo.

---

## 📋 Resumo Executivo

### Problemas Identificados

1. ✅ **RLS Policies de Storage** - As políticas estão CORRETAS
2. ❌ **API de Recuperação** - Retorna `storage_path` mas frontend espera URLs assinadas
3. ❌ **Geração de URLs Assinadas** - Frontend tenta gerar, mas pode falhar silenciosamente
4. ⚠️ **Tratamento de Erros** - Erros são ignorados no bloco `catch`
5. ⚠️ **Estrutura de Dados** - Falta de validação se `mediaPaths` está correto

---

## 🔍 Análise Detalhada do Fluxo

### 1. **Upload de Imagens** ✅ FUNCIONANDO

**Localização:** `modules/specialist/checklist/useImageUploader.ts`

```typescript
const uploadFiles = async (userId: string, vehicleId: string): Promise<string[]> => {
  if (!files.length) return [];
  const uploaded: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = extFromFile(f);
    const path = `${vehicleId}/${userId}/${Date.now()}-${i}-${randomStr()}.${ext}`;
    const { error } = await supabase.storage.from('vehicle-media').upload(path, f, {
      upsert: false,
      cacheControl: '3600',
      contentType: f.type || undefined,
    });
    if (error) throw new Error(`Falha ao enviar imagem: ${error.message}`);
    uploaded.push(path);
  }
  return uploaded;
};
```

**Status:** ✅ Funciona corretamente
- Caminho: `{vehicleId}/{userId}/{timestamp}-{index}-{random}.{ext}`
- Storage: `vehicle-media` bucket
- Retorna array de paths

---

### 2. **Salvamento no Banco** ✅ FUNCIONANDO

**Localização:** `app/api/specialist/save-checklist/route.ts`

```typescript
// Insert media references, if any
const media = (body.mediaPaths || []).filter(Boolean).map(p => ({
  inspection_id: inspectionId,
  storage_path: p,
  uploaded_by: req.user.id,
}));
if (media.length) {
  const { error: mediaErr } = await supabase.from('inspection_media').insert(media);
  if (mediaErr) {
    logger.error('db_error_insert_media', { requestId, error: mediaErr.message });
    return NextResponse.json({ error: 'Erro ao registrar mídias' }, { status: 500 });
  }
}
```

**Tabela:** `inspection_media`
```sql
CREATE TABLE IF NOT EXISTS public.inspection_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Status:** ✅ Funciona corretamente
- Salva `storage_path` (ex: `{vehicleId}/{userId}/{filename}`)
- Referência CASCADE com `inspections`

---

### 3. **Recuperação da API** ⚠️ PROBLEMA PARCIAL

**Localização:** `app/api/specialist/get-checklist/route.ts`

```typescript
const { data: media } = await supabase
  .from('inspection_media')
  .select('storage_path')
  .eq('inspection_id', inspection.id);

const mediaPaths = media
  ? media.map((item: { storage_path: string }) => item.storage_path)
  : [];

const inspectionWithMedia = { ...inspection, mediaPaths };

return NextResponse.json({
  success: true,
  inspection: inspectionWithMedia,
  services: services || [],
});
```

**Retorno:**
```json
{
  "success": true,
  "inspection": {
    "id": "...",
    "inspection_date": "...",
    "mediaPaths": [
      "vehicleId/userId/timestamp-0-abc123.jpg",
      "vehicleId/userId/timestamp-1-def456.png"
    ]
  }
}
```

**Status:** ✅ Retorna os paths corretamente
**Observação:** Retorna apenas `storage_path`, não URLs assinadas

---

### 4. **Processamento no Frontend** ❌ PROBLEMA CRÍTICO

**Localização:** `modules/specialist/components/VehicleChecklistModal/VehicleChecklistModal.tsx`

```typescript
const media = data.inspection?.mediaPaths || [];
if (Array.isArray(media) && media.length > 0) {
  const signedUrlPromises = media.map((path: string) =>
    supabase.storage.from('vehicle-media').createSignedUrl(path, 60)
  );
  const signedUrlResults = await Promise.all(signedUrlPromises);

  const imageObjects = media
    .map((path: string, index: number) => {
      const { data, error } = signedUrlResults[index];
      if (error) {
        return null;  // ❌ PROBLEMA: Erro silencioso
      }
      return { path, url: data.signedUrl };
    })
    .filter(Boolean) as { path: string; url: string }[];

  setExistingImages(imageObjects);
} else {
  setExistingImages([]);
}
```

**Problemas Identificados:**

1. **Erro Silencioso:** Quando `createSignedUrl` falha, retorna `null` sem logging
2. **Sem Feedback Visual:** Usuário não sabe que houve erro
3. **Array Vazio:** Se todas as URLs falharem, `existingImages` fica vazio
4. **TTL Curto:** URLs expiram em 60 segundos

---

### 5. **RLS Policies do Storage** ✅ CORRETAS

**Localização:** `supabase/migrations/20250815120000_create_vehicle_media_bucket.sql`

#### Specialist READ Policy:
```sql
CREATE POLICY "vehicle_media_specialist_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND EXISTS (
    SELECT 1
    FROM public.vehicles v
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE v.id::text = split_part(name, '/', 1)
      AND cs.specialist_id = auth.uid()
  )
);
```

#### Specialist DELETE Policy:
```sql
CREATE POLICY "vehicle_media_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
);
```

**Status:** ✅ Políticas estão corretas
- Specialist pode READ imagens de veículos de clientes vinculados
- Specialist pode DELETE apenas suas próprias imagens (path contém `userId`)

---

## 🐛 Possíveis Causas do Problema

### Causa 1: Falha na Geração de URL Assinada
**Probabilidade:** 🔴 ALTA

**Razões:**
1. RLS policy pode estar bloqueando `createSignedUrl` internamente
2. Path pode estar incorreto (caso, barras extras, etc)
3. Bucket pode não estar acessível
4. Token de autenticação pode estar expirado

**Como Verificar:**
```javascript
// Adicionar logging antes do createSignedUrl
console.log('Tentando criar URL para:', path);
const result = await supabase.storage.from('vehicle-media').createSignedUrl(path, 60);
console.log('Resultado:', result);
if (result.error) {
  console.error('Erro ao criar URL:', result.error);
}
```

---

### Causa 2: Cliente Supabase Incorreto
**Probabilidade:** 🟡 MÉDIA

**Razão:**
O código usa `supabase` do `supabaseClient`, que pode estar usando credenciais do usuário autenticado. Se o token expirou ou não tem permissão, `createSignedUrl` falha.

**Verificação:**
```typescript
const {
  data: { session },
} = await supabase.auth.getSession();
console.log('Sessão atual:', session?.user?.id, session?.expires_at);
```

---

### Causa 3: Path Incorreto no Banco
**Probabilidade:** 🟢 BAIXA

**Razão:**
O upload funciona e salva o path. Improvável que o path esteja errado.

**Verificação:**
```sql
SELECT storage_path 
FROM inspection_media 
WHERE inspection_id = 'xxx';
```

---

### Causa 4: Bucket Privado Sem Política Pública
**Probabilidade:** 🟢 BAIXA

**Razão:**
Bucket é privado por design. URLs assinadas deveriam funcionar independentemente.

---

## 🔧 Soluções Propostas

### Solução 1: Adicionar Logging Detalhado (Diagnóstico)
**Prioridade:** 🔴 CRÍTICA

```typescript
const media = data.inspection?.mediaPaths || [];
console.log('📸 Media paths recebidos:', media);

if (Array.isArray(media) && media.length > 0) {
  console.log(`🔄 Gerando URLs assinadas para ${media.length} imagens...`);
  
  const signedUrlPromises = media.map((path: string) => {
    console.log('  Processando path:', path);
    return supabase.storage.from('vehicle-media').createSignedUrl(path, 3600); // 1 hora
  });
  
  const signedUrlResults = await Promise.all(signedUrlPromises);
  console.log('✅ Resultados:', signedUrlResults);

  const imageObjects = media
    .map((path: string, index: number) => {
      const { data, error } = signedUrlResults[index];
      if (error) {
        console.error(`❌ Erro ao gerar URL para ${path}:`, error);
        showToast('error', `Erro ao carregar imagem: ${error.message}`);
        return null;
      }
      console.log(`✅ URL gerada para ${path}:`, data.signedUrl);
      return { path, url: data.signedUrl };
    })
    .filter(Boolean) as { path: string; url: string }[];

  console.log(`📦 Imagens carregadas: ${imageObjects.length}/${media.length}`);
  setExistingImages(imageObjects);
}
```

---

### Solução 2: Aumentar TTL das URLs Assinadas
**Prioridade:** 🟡 MÉDIA

```typescript
// Mudar de 60 segundos para 3600 (1 hora)
const signedUrlPromises = media.map((path: string) =>
  supabase.storage.from('vehicle-media').createSignedUrl(path, 3600)
);
```

---

### Solução 3: Usar Admin Client na API
**Prioridade:** 🟢 BAIXA (Mais Complexo)

Em vez de retornar apenas `storage_path`, a API poderia retornar URLs assinadas:

```typescript
// app/api/specialist/get-checklist/route.ts
const { data: media } = await supabase
  .from('inspection_media')
  .select('storage_path')
  .eq('inspection_id', inspection.id);

const mediaPaths: { path: string; url: string }[] = [];
if (media && media.length > 0) {
  for (const item of media) {
    const { data: urlData, error } = await supabase.storage
      .from('vehicle-media')
      .createSignedUrl(item.storage_path, 3600);
    
    if (!error && urlData) {
      mediaPaths.push({
        path: item.storage_path,
        url: urlData.signedUrl
      });
    }
  }
}

const inspectionWithMedia = { 
  ...inspection, 
  mediaObjects: mediaPaths // Mudar estrutura
};
```

---

### Solução 4: Fallback para URL Pública (NÃO RECOMENDADO)
**Prioridade:** 🔴 NÃO FAZER

Tornar o bucket público compromete a segurança.

---

## 📊 Diagnóstico Recomendado

### Passo 1: Verificar se Paths Estão Sendo Salvos
```sql
-- Executar no banco
SELECT 
  im.id,
  im.storage_path,
  im.uploaded_by,
  i.vehicle_id,
  v.plate
FROM inspection_media im
JOIN inspections i ON i.id = im.inspection_id
JOIN vehicles v ON v.id = i.vehicle_id
ORDER BY im.created_at DESC
LIMIT 10;
```

**Resultado Esperado:** Paths no formato `{vehicleId}/{userId}/{filename}`

---

### Passo 2: Testar createSignedUrl Manualmente
```typescript
// No console do navegador (após login como especialista)
const { data, error } = await supabase.storage
  .from('vehicle-media')
  .createSignedUrl('COLE_UM_PATH_AQUI', 3600);

console.log('Data:', data);
console.log('Error:', error);
```

**Resultado Esperado:**
```json
{
  "data": {
    "signedUrl": "https://xxx.supabase.co/storage/v1/object/sign/..."
  },
  "error": null
}
```

---

### Passo 3: Verificar Sessão do Usuário
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('User:', session?.user);
console.log('Role:', session?.user?.app_metadata?.role);
console.log('Expires:', new Date(session?.expires_at! * 1000));
```

---

### Passo 4: Verificar RLS com Query Direta
```sql
-- Como especialista autenticado
SELECT * FROM storage.objects 
WHERE bucket_id = 'vehicle-media' 
AND name ILIKE '%VEHICLE_ID%'
LIMIT 5;
```

**Se retornar vazio:** RLS está bloqueando  
**Se retornar dados:** RLS está OK

---

## 🎯 Próximos Passos

### Fase 1: Diagnóstico (SEM MODIFICAR CÓDIGO)
1. ✅ Executar queries SQL para verificar dados
2. ✅ Testar `createSignedUrl` no console do navegador
3. ✅ Verificar logs do Supabase Storage
4. ✅ Confirmar permissões RLS

### Fase 2: Implementação (SE NECESSÁRIO)
1. Adicionar logging detalhado no frontend
2. Aumentar TTL das URLs assinadas
3. Adicionar feedback visual de erro
4. (Opcional) Mover geração de URLs para API

---

## 📝 Conclusão Preliminar

O fluxo de upload e salvamento está **funcionando corretamente**. O problema está na **recuperação e geração de URLs assinadas no frontend**.

**Hipótese Principal:** 
`createSignedUrl` está falhando silenciosamente devido a:
- RLS policy bloqueando acesso
- Path incorreto
- Sessão expirada
- Bucket não acessível

**Recomendação:**
Executar diagnóstico completo (Fase 1) antes de modificar código.

---

## 🔗 Referências

- **Upload:** `modules/specialist/checklist/useImageUploader.ts`
- **Save API:** `app/api/specialist/save-checklist/route.ts`
- **Get API:** `app/api/specialist/get-checklist/route.ts`
- **Frontend:** `modules/specialist/components/VehicleChecklistModal/VehicleChecklistModal.tsx`
- **RLS:** `supabase/migrations/20250815120000_create_vehicle_media_bucket.sql`
- **Schema:** `supabase/migrations/20250816111000_create_inspections.sql`
