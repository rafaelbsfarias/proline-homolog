# Documentação do Middleware de Autenticação (`authMiddleware.ts`)

## Visão Geral

O arquivo `modules/common/utils/authMiddleware.ts` é responsável por proteger as rotas de API da aplicação. Ele utiliza uma abordagem de Higher-Order Function (HOF) para envolver os handlers das rotas, garantindo que apenas usuários autenticados e com a `role` (perfil) correta possam acessar determinados endpoints.

## Componentes Principais

### 1. `verifyTokenAndGetRole(request)`

Esta é a função central que faz o trabalho pesado. Ela é chamada por todos os wrappers de autenticação.

- **O que faz:**
  1.  Extrai o token `Bearer` do cabeçalho `Authorization` da requisição.
  2.  Valida o token usando `supabase.auth.getUser(token)`.
  3.  Se o token for válido, busca a `role` do usuário. A busca é feita em duas etapas para otimização:
      - **Primeiro:** Tenta obter a `role` do `user.user_metadata` (que está no JWT e é mais rápido).
      - **Fallback:** Se não encontrar nos metadados, consulta a tabela `profiles` no banco de dados.
- **Retorno:** Retorna um objeto `AuthResult` contendo `isAuthenticated`, `userId`, `role` e um `error` (se houver).

### 2. `createAuthWrapper(allowedRole, handler)`

Esta é uma função de fábrica (factory) genérica que cria os middlewares específicos.

- **O que faz:**
  1.  Recebe uma `allowedRole` (ex: 'admin', 'specialist') e o `handler` da rota.
  2.  Retorna uma nova função assíncrona que será o middleware.
  3.  Dentro do middleware, ela chama `verifyTokenAndGetRole`.
  4.  Verifica se o usuário está autenticado (`isAuthenticated`).
  5.  Verifica se a `role` do usuário é a mesma que a `allowedRole`.
  6.  Se tudo estiver correto, chama o `handler` original da rota, passando o `request` com os dados do usuário (`userId`, `userRole`).
  7.  Se a autenticação ou autorização falhar, retorna uma resposta `401 Unauthorized` ou `403 Forbidden` com uma mensagem de erro clara.

### 3. Funções Exportadas (`withAdminAuth`, `withSpecialistAuth`, etc.)

Estes são os wrappers que você deve usar para proteger suas rotas de API. Eles são simplesmente atalhos para o `createAuthWrapper`.

- `withAdminAuth(handler)`: Permite acesso apenas a usuários com a role 'admin'.
- `withSpecialistAuth(handler)`: Permite acesso apenas a usuários com a role 'specialist'.
- `withClientAuth(handler)`: Permite acesso apenas a usuários com a role 'client'.
- `withPartnerAuth(handler)`: Permite acesso apenas a usuários com a role 'partner'.

## Como Usar

Para proteger uma rota de API, importe o wrapper apropriado e envolva sua função de handler.

**Exemplo (`/api/specialist/my-clients/route.ts`):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSpecialistAuth, AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

// O tipo da requisição agora é AuthenticatedRequest para ter acesso a req.userId e req.userRole
export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  const specialistId = req.userId; // ID do especialista autenticado

  // ... sua lógica de API aqui ...

  return NextResponse.json({ message: `Dados para o especialista ${specialistId}` });
});
```
