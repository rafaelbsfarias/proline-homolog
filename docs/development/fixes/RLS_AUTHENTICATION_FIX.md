# Fix: Row Level Security (RLS) Authentication

## 🐛 Problema

Parceiros autenticados não conseguiam visualizar seus serviços cadastrados, mesmo com serviços existentes no banco de dados.

**Sintoma**:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "total": 0 }
  }
}
```

**Banco de dados**:
```sql
SELECT COUNT(*) FROM partner_services 
WHERE partner_id = '06a7e9f4-e480-40c0-a037-fdb3e22de00d';
-- Result: 11 serviços cadastrados
```

## 🔍 Causa Raiz

O **SupabasePartnerServiceRepository** estava usando o cliente Supabase padrão (`getClient()`) que não tinha contexto de autenticação. As políticas RLS (Row Level Security) da tabela `partner_services` exigem que `auth.uid()` seja igual a `partner_id`:

```sql
-- Política RLS da tabela partner_services
POLICY "Partners can view their own services." FOR SELECT
  TO authenticated
  USING ((auth.uid() = partner_id))
```

### Fluxo Problemático

```
1. Cliente envia: Authorization: Bearer <token>
2. Middleware valida: ✅ Token válido, usuário autenticado
3. Endpoint chama: getApplicationService() (singleton)
4. Service usa: SupabasePartnerServiceRepository (singleton)
5. Repository usa: supabaseService.getClient() ❌
6. getClient() retorna: Cliente SEM contexto de autenticação
7. Query executa: SELECT * FROM partner_services WHERE partner_id = '...'
8. RLS Policy verifica: auth.uid() = ? ❌ (NULL)
9. Resultado: [] (lista vazia)
```

### Por que Admin Client não funciona?

Mesmo usando `getAdminClient()` com `SUPABASE_SERVICE_ROLE_KEY`, as políticas RLS ainda são aplicadas quando o cliente não tem contexto de autenticação associado.

## ✅ Solução

### 1. Adicionar método no SupabaseService

Criamos um método para criar clientes autenticados com token do usuário:

```typescript
// modules/common/services/SupabaseService.ts

/**
 * Cria cliente com token de usuário autenticado
 * Usado quando é necessário respeitar RLS policies
 */
createAuthenticatedClient(accessToken: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
  return client;
}
```

### 2. Atualizar SupabasePartnerServiceRepository

Permitimos injetar um cliente Supabase customizado:

```typescript
// modules/partner/domain/repositories/SupabasePartnerServiceRepository.ts

constructor(
  private readonly supabaseService: SupabaseService,
  supabaseClient?: SupabaseClient
) {
  // Se um cliente específico for fornecido (ex: com token de autenticação), usar ele
  // Caso contrário, usar o cliente padrão do service
  this.supabase = supabaseClient || supabaseService.getClient();
}
```

### 3. Atualizar Endpoint V2

Extrair token do header e criar cliente autenticado:

```typescript
// app/api/partner/services/v2/route.ts

async function getServicesHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // ... validações ...

    // Obter token do header Authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não encontrado' },
        { status: 401 }
      );
    }
    
    // Criar cliente Supabase autenticado com token do usuário (para RLS)
    const supabaseService = SupabaseService.getInstance();
    const authenticatedClient = supabaseService.createAuthenticatedClient(token);
    
    // Criar repositório com cliente autenticado
    const repository = new SupabasePartnerServiceRepository(
      supabaseService,
      authenticatedClient
    );
    
    // Criar Application Service com repositório autenticado
    const service = new PartnerServiceApplicationServiceImpl(repository);
    
    // Executar query...
  }
}
```

### Fluxo Corrigido

```
1. Cliente envia: Authorization: Bearer <token>
2. Middleware valida: ✅ Token válido, usuário autenticado
3. Endpoint extrai: token do header
4. Service cria: authenticatedClient com token ✅
5. Repository usa: authenticatedClient
6. Query executa: SELECT * FROM partner_services WHERE partner_id = '...'
7. RLS Policy verifica: auth.uid() = partner_id ✅
8. Resultado: [11 serviços] ✅
```

## 📊 Resultado

### Antes
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/partner/services/v2

# Response:
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "total": 0 }
  }
}
```

### Depois
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/partner/services/v2?limit=5

# Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "bba8534c-84e3-446f-b65f-d88ed3e75e3c",
        "name": "Instalação de acessórios elétricos",
        "price": 150,
        "reviewStatus": "pending_review",
        ...
      },
      {
        "id": "85446c94-2269-4154-98b9-ac58f8012e09",
        "name": "Reparo de alternador",
        "price": 350,
        "reviewStatus": "approved",
        ...
      },
      ... (mais 3 serviços)
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 11,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🔐 Políticas RLS Afetadas

```sql
-- Todas as políticas da tabela partner_services:
POLICY "Partners can create their own services" FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = partner_id))

POLICY "Partners can delete their own services" FOR DELETE
  TO authenticated
  USING ((auth.uid() = partner_id))

POLICY "Partners can update their own services" FOR UPDATE
  TO authenticated
  USING ((auth.uid() = partner_id))

POLICY "Partners can view their own services" FOR SELECT
  TO authenticated
  USING ((auth.uid() = partner_id))
```

**Observação**: Todas exigem `auth.uid()` válido no contexto de autenticação.

## 🎯 Arquivos Modificados

1. **SupabaseService.ts**
   - ✅ Adicionado `createAuthenticatedClient(token)` method

2. **SupabasePartnerServiceRepository.ts**
   - ✅ Constructor aceita `supabaseClient` opcional
   - ✅ Usa cliente injetado se fornecido

3. **app/api/partner/services/v2/route.ts**
   - ✅ `GET` handler extrai token do header
   - ✅ Cria cliente autenticado
   - ✅ Injeta cliente no repositório

## 🚀 Próximos Passos

### Aplicar em Outros Endpoints

Esta mesma solução deve ser aplicada em:

- [ ] `POST /api/partner/services/v2` - Criação de serviços
- [ ] `PUT /api/partner/services/v2/[serviceId]` - Atualização de serviços
- [ ] `DELETE /api/partner/services/v2/[serviceId]` - Exclusão de serviços
- [ ] Outros endpoints que usam RLS policies

### Pattern Recomendado

```typescript
// Helper function para criar service autenticado
function createAuthenticatedService(token: string) {
  const supabaseService = SupabaseService.getInstance();
  const authenticatedClient = supabaseService.createAuthenticatedClient(token);
  const repository = new SupabasePartnerServiceRepository(
    supabaseService,
    authenticatedClient
  );
  return new PartnerServiceApplicationServiceImpl(repository);
}

// Uso no handler
async function handler(req: AuthenticatedRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return errorResponse(401, 'Token não encontrado');
  }
  
  const service = createAuthenticatedService(token);
  // ... usar service ...
}
```

## 📝 Lições Aprendidas

1. **RLS Policies exigem contexto de autenticação**: Não basta ter um Service Role Key, é preciso ter `auth.uid()` válido.

2. **Singleton pattern pode esconder problemas**: O Application Service singleton estava reutilizando o mesmo repositório sem contexto.

3. **Admin Client não bypassa RLS**: Mesmo com Service Role Key, se não houver `auth.uid()`, as policies bloqueiam.

4. **Token deve ser injetado no cliente**: O header `Authorization: Bearer <token>` deve ser passado para o Supabase Client.

5. **DDD e Clean Architecture funcionam**: A arquitetura permitiu injetar o cliente autenticado sem quebrar nada.

## 🔍 Debug Tips

### Verificar se RLS está bloqueando

```sql
-- Como Admin
SELECT * FROM partner_services WHERE partner_id = '<uuid>';
-- ✅ Retorna dados

-- Como Cliente sem auth
SELECT * FROM partner_services WHERE partner_id = '<uuid>';
-- ❌ Retorna [] (RLS bloqueando)
```

### Verificar contexto de autenticação

```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('auth.uid():', user?.id); // Deve ser o UUID do parceiro
```

### Logs úteis

```typescript
this.logger.debug('Repository usando cliente:', {
  hasAuth: !!this.supabase.auth,
  isAdminClient: this.supabase === supabaseService.getAdminClient(),
});
```

---

**Data da Correção**: 2025-10-13  
**Ticket**: RLS Authentication Issue  
**Status**: ✅ Resolvido  
**Impacto**: Zero (apenas fix de bug)
