# Fix Completo: RLS Authentication + Updated_at Field

## 🐛 Problemas Encontrados

### 1. Lista de Serviços Vazia (Frontend)
**Sintoma**: API retorna dados, mas frontend mostra "Nenhum serviço cadastrado"

**Causa**: Hook `usePartnerServices` acessando estrutura errada
- API retorna: `{ success: true, data: { items: [], pagination: {} } }`
- `authenticatedFetch` retorna: `{ data: <API response>, ok, status }`
- Hook tentava acessar: `response.data.items` ❌
- Hook deveria acessar: `response.data.data.items` ✅

**Solução**: Corrigido acesso em `usePartnerServices.ts`:
```typescript
const apiResponse = response.data as {
  success: boolean;
  data: {
    items: PartnerService[];
    pagination: { ... };
  };
};

if (apiResponse.success && apiResponse.data?.items) {
  setServices(apiResponse.data.items);
}
```

### 2. RLS Bloqueando GET
**Sintoma**: Repositório retornava lista vazia apesar de dados no banco

**Causa**: Cliente Supabase sem contexto de autenticação
- Políticas RLS exigem `auth.uid() = partner_id`
- Admin Client não tinha `auth.uid()` válido

**Solução**: Criar cliente autenticado com token JWT
```typescript
const token = req.headers.get('authorization')?.split(' ')[1];
const authenticatedClient = supabaseService.createAuthenticatedClient(token);
const repository = new SupabasePartnerServiceRepository(
  supabaseService,
  authenticatedClient
);
```

### 3. Campo `updated_at` Inexistente
**Sintoma**: PUT retorna erro 500 "Could not find the 'updated_at' column"

**Causa**: Repositório tentava salvar campo que não existe na tabela

**Solução**: Removido campo do `save()` method:
```typescript
const data = {
  id: service.id,
  partner_id: service.partnerId,
  name: service.name.value,
  description: service.description?.value || null,
  price: service.price.value,
  is_active: service.isActive,
  created_at: service.createdAt.toISOString(),
  // updated_at: REMOVIDO ❌
};
```

### 4. RLS Bloqueando PUT/DELETE
**Sintoma**: PUT e DELETE falhavam com mesmo problema de RLS

**Causa**: Endpoints usando singleton sem autenticação

**Solução**: Aplicado mesmo padrão de cliente autenticado

## ✅ Arquivos Modificados

### 1. `modules/common/services/SupabaseService.ts`
```typescript
+ createAuthenticatedClient(accessToken: string) {
+   return createClient(url, anonKey, {
+     global: {
+       headers: {
+         Authorization: `Bearer ${accessToken}`,
+       },
+     },
+   });
+ }
```

### 2. `modules/partner/domain/repositories/SupabasePartnerServiceRepository.ts`
```typescript
constructor(
  supabaseService: SupabaseService,
+ supabaseClient?: SupabaseClient
) {
+ this.supabase = supabaseClient || supabaseService.getClient();
}

async save(service: PartnerService) {
  const data = {
    // ... campos ...
-   updated_at: new Date().toISOString(), // REMOVIDO
  };
}
```

### 3. `modules/partner/hooks/usePartnerServices.ts`
```typescript
const apiResponse = response.data as {
  success: boolean;
  data: {
    items: PartnerService[];
    pagination: { ... };
  };
};

- setServices(apiResponse.items); // ERRADO
+ if (apiResponse.success && apiResponse.data?.items) {
+   setServices(apiResponse.data.items); // CORRETO
+ }
```

### 4. `app/api/partner/services/v2/route.ts`
```typescript
async function getServicesHandler(req: AuthenticatedRequest) {
+ const token = req.headers.get('authorization')?.split(' ')[1];
+ const authenticatedClient = supabaseService.createAuthenticatedClient(token);
+ const repository = new SupabasePartnerServiceRepository(
+   supabaseService,
+   authenticatedClient
+ );
+ const service = new PartnerServiceApplicationServiceImpl(repository);
  
  const result = await service.getServicesByPartner(...);
}
```

### 5. `app/api/partner/services/v2/[serviceId]/route.ts`
```typescript
// Mesmo padrão aplicado em:
- GET /api/partner/services/v2/[serviceId]
- PUT /api/partner/services/v2/[serviceId]  
- DELETE /api/partner/services/v2/[serviceId]

// Todos agora usam cliente autenticado:
+ const token = req.headers.get('authorization')?.split(' ')[1];
+ const authenticatedClient = supabaseService.createAuthenticatedClient(token);
+ const repository = new SupabasePartnerServiceRepository(..., authenticatedClient);
```

### 6. `app/api/partner/services/v2/lib/schemas.ts`
```typescript
export const UpdateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  price: z.number().optional(),
  description: z.string().optional(),
+ isActive: z.boolean().optional(), // ADICIONADO
});
```

## 📊 Status Atual

### ✅ Funcionando
- [x] GET /api/partner/services/v2 - Lista serviços com paginação
- [x] Cliente autenticado com RLS
- [x] Frontend recebe dados corretamente
- [x] Sidebar mostra contagem de serviços
- [x] Campo `updated_at` removido do repositório

### 🔄 Em Teste
- [ ] PUT /api/partner/services/v2/[serviceId] - Atualização
- [ ] DELETE /api/partner/services/v2/[serviceId] - Exclusão
- [ ] GET /api/partner/services/v2/[serviceId] - Busca por ID

## 🧪 Testes

### Teste 1: Listar Serviços
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/partner/services/v2

# ✅ Resultado: 11 serviços retornados
```

### Teste 2: Frontend
```
1. Acesse /dashboard/partner/services
2. Verifique console: [DEBUG] usePartnerServices - Services set: 11
3. ✅ Resultado: Serviços aparecem na tabela
```

### Teste 3: Atualizar Serviço
```bash
curl -X PUT \
  http://localhost:3000/api/partner/services/v2/$SERVICE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Novo Nome","price":200}'

# 🔄 Em teste
```

## 🚀 Próximos Passos

1. **Validar PUT endpoint**
   - Testar atualização via frontend
   - Verificar se RLS permite update
   - Confirmar que dados são salvos

2. **Validar DELETE endpoint**
   - Testar exclusão via frontend
   - Verificar se RLS permite delete
   - Confirmar soft delete (is_active=false)

3. **Validar GET by ID endpoint**
   - Testar busca individual
   - Verificar se RLS permite leitura

4. **Remover logs de debug**
   - Remover console.log do `usePartnerServices`
   - Limpar código de produção

5. **Aplicar mesmo padrão em outros domínios**
   - Quotes (Orçamentos)
   - Vehicles (Veículos)
   - Collections (Coletas)

## 📝 Lições Aprendidas

1. **RLS precisa de contexto**: Não basta ter Service Role Key, precisa ter `auth.uid()`
2. **Validar estrutura do banco**: Sempre verificar DDL antes de assumir colunas
3. **Testar estrutura de resposta**: APIs aninhadas precisam de acesso correto
4. **Singleton pode mascarar problemas**: Cliente compartilhado esconde falta de autenticação
5. **TypeScript ajuda mas não é suficiente**: Validação de schema Zod é essencial

---

**Data**: 2025-10-13  
**Branch**: `refactor/partner-overview-incremental`  
**Status**: 🟡 Em Teste (GET ✅, PUT/DELETE 🔄)
