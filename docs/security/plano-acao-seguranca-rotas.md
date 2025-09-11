# Plano de Ação para Segurança de Rotas

## Visão Geral

Este plano de ação tem como objetivo garantir que todas as rotas do sistema sejam adequadamente protegidas, permitindo acesso irrestrito apenas às 3 rotas públicas especificadas:
1. `/login`
2. `/recuperar-senha`
3. `/cadastro`

Todas as outras rotas devem redirecionar usuários não autenticados para a página de login.

## Análise da Implementação Atual

### Middleware Atual
O middleware atual (`app/middleware.ts`) possui as seguintes limitações:
- Protege apenas rotas que começam com `/dashboard` e `/admin`
- Permite acesso público apenas a `/login` e `/cadastro`
- Não protege outras rotas importantes como `/meu-perfil`, `/test`, etc.
- Não inclui `/recuperar-senha` como rota pública

### Rotas Identificadas
Conforme o relatório completo de rotas:
- **Rotas Públicas Necessárias**: `/login`, `/recuperar-senha`, `/cadastro`
- **Rotas a Proteger**: Todas as demais rotas incluindo:
  - Rotas de interface (UI): `/meu-perfil`, `/dashboard/*`, `/admin/*`, etc.
  - Rotas da API: `/api/*`
  - Rotas de teste: `/test`, `/test-cadastro`
  - Rotas especiais: `/confirm-email`

## Plano de Implementação

### Etapa 1: Atualização do Middleware

1. **Modificar `app/middleware.ts`**:
   ```javascript
   import { createServerClient, type CookieOptions } from '@supabase/ssr';
   import { NextResponse, type NextRequest } from 'next/server';

   export async function middleware(request: NextRequest) {
     const response = NextResponse.next();

     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return request.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
           },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value, options }) => {
               response.cookies.set({ name, value, ...(options as CookieOptions) });
             });
           },
         },
       }
     );

     try {
       const {
         data: { user },
       } = await supabase.auth.getUser();

       // Definir explicitamente as rotas públicas
       const publicRoutes = ['/login', '/recuperar-senha', '/cadastro'];
       const isPublicRoute = publicRoutes.some(route => 
         request.nextUrl.pathname === route || 
         request.nextUrl.pathname.startsWith(`${route}/`)
       );

       // Proteger todas as rotas exceto as públicas
       if (!user && !isPublicRoute) {
         // Redirecionar para login se não estiver autenticado e tentar acessar rota protegida
         return NextResponse.redirect(new URL('/login', request.url));
       }

       // Redirecionar usuários autenticados das páginas de autenticação para o dashboard
       if (user && isPublicRoute && request.nextUrl.pathname !== '/recuperar-senha') {
         return NextResponse.redirect(new URL('/dashboard', request.url));
       }
     } catch (error) {
       // Em caso de erro, redirecionar para login
       return NextResponse.redirect(new URL('/login', request.url));
     }

     return response;
   }

   export const config = {
     matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
   };
   ```

### Etapa 2: Verificação de Rotas Específicas

1. **Verificar `/confirm-email`**:
   - Esta rota é usada para confirmação de email via link
   - Pode precisar de tratamento especial ou ser adicionada às rotas públicas temporariamente

2. **Verificar rotas de API**:
   - As rotas `/api/*` devem ser protegidas no lado do servidor
   - Cada endpoint da API deve verificar a autenticação internamente

3. **Verificar rotas de teste**:
   - As rotas `/test` e `/test-cadastro` devem ser protegidas em produção
   - Considerar removê-las ou protegê-las adequadamente

### Etapa 3: Atualização de Exclusões no Middleware

1. **Atualizar a configuração do matcher**:
   - Remover exclusões específicas como `api/test-` que podem estar permitindo acesso não autorizado
   - Manter apenas as exclusões necessárias para arquivos estáticos

### Etapa 4: Testes e Validação

1. **Testar acesso a rotas públicas**:
   - Verificar que `/login`, `/recuperar-senha`, `/cadastro` são acessíveis sem autenticação

2. **Testar acesso a rotas protegidas sem autenticação**:
   - Verificar que todas as outras rotas redirecionam para `/login`

3. **Testar acesso a rotas protegidas com autenticação**:
   - Verificar que usuários autenticados podem acessar todas as rotas protegidas

4. **Testar redirecionamento de usuários autenticados**:
   - Verificar que usuários autenticados são redirecionados do `/login` para `/dashboard`

## Cronograma de Implementação

### Fase 1: Desenvolvimento (1 dia)
- Implementar nova lógica de middleware
- Atualizar configuração de exclusões
- Revisar todas as rotas identificadas

### Fase 2: Testes (1 dia)
- Testar todas as combinações de acesso (autenticado/não autenticado)
- Verificar funcionamento das rotas públicas
- Validar redirecionamentos

### Fase 3: Revisão de Segurança (0.5 dia)
- Revisar implementação com foco em segurança
- Verificar possíveis bypasses
- Confirmar proteção de todas as rotas identificadas

## Considerações de Segurança Adicionais

1. **Proteção de Rotas da API**:
   - Cada endpoint da API deve verificar a autenticação independentemente
   - O middleware protege o acesso às páginas, mas os endpoints da API precisam de validação própria

2. **Tratamento de Erros**:
   - Qualquer erro no processo de verificação de autenticação deve resultar em redirecionamento para login
   - Evitar vazamento de informações em mensagens de erro

3. **Exclusões Necessárias**:
   - Manter exclusões apenas para recursos estáticos do Next.js
   - Evitar exclusões que possam permitir acesso não autorizado

4. **Verificação em Ambientes Diferentes**:
   - Testar a implementação tanto em desenvolvimento quanto em produção
   - Verificar comportamento com diferentes tipos de URLs

## Critérios de Aceitação

1. Apenas as 3 rotas especificadas (`/login`, `/recuperar-senha`, `/cadastro`) devem ser acessíveis sem autenticação
2. Todas as demais rotas devem redirecionar usuários não autenticados para `/login`
3. Usuários autenticados não devem conseguir acessar as páginas de autenticação (exceto `/recuperar-senha`)
4. Todos os testes de segurança devem passar
5. Não deve haver regressões em funcionalidades existentes

## Responsável e Aprovação

- **Responsável pela Implementação**: [Nome do desenvolvedor]
- **Revisor de Segurança**: [Nome do revisor]
- **Data de Implementação Prevista**: [Data]
- **Aprovação**: [Assinatura/Confirmação]