# Documentação de Autenticação e Autorização

Este documento detalha o funcionamento do sistema de autenticação, autorização e gerenciamento de tokens no projeto, utilizando **Next.js** e **Supabase**.

## 1. Visão Geral

A arquitetura de segurança baseia-se no **Supabase Auth** para o gerenciamento de usuários e sessões, e em um sistema de **middleware personalizado** para a proteção de rotas de API.

- **Autenticação**: Processo de verificar a identidade de um usuário (login com email/senha).
- **Autorização**: Processo de verificar se um usuário autenticado tem permissão para acessar um recurso, baseado em `roles` (perfis).
- **Gerenciamento de Tokens**: A sessão é mantida por JSON Web Tokens (JWTs) gerenciados pelo Supabase. O sistema também usa tokens customizados para fluxos específicos (ex: confirmação de e-mail).

### Componentes Chave

| Componente                                             | Responsabilidade                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Supabase Auth**                                      | Provedor de autenticação, gerenciamento de usuários e emissão de JWTs.                                       |
| `modules/common/services/AuthService.ts`               | Camada de serviço que abstrai as chamadas diretas ao Supabase para login, logout, etc.                       |
| `modules/common/hooks/useAuthenticatedFetch.ts`        | Hook do React que anexa automaticamente o token de autenticação (`Bearer Token`) a todas as requisições de API. |
| `modules/common/utils/authMiddleware.ts`               | Middleware de backend que protege as rotas de API, validando o token e a `role` do usuário.                  |
| `modules/common/utils/emailConfirmationTokens.ts`      | Utilitário para gerar e validar tokens customizados para fluxos de confirmação de e-mail.                    |

---

## 2. Autenticação

### a. Fluxo de Login

1.  **Interface (UI)**: O usuário insere suas credenciais na página de login (`/app/login/page.tsx`).
2.  **Lógica de Frontend**: O hook `modules/common/hooks/useAuthentication.ts` orquestra a chamada de login.
3.  **Serviço de Autenticação**: A lógica é delegada ao `modules/common/services/AuthService.ts`, que chama o método `signInWithPassword` do Supabase.
4.  **Sessão**: Em caso de sucesso, o Supabase retorna uma sessão contendo um `access_token` (JWT) e um `refresh_token`. O cliente Supabase (`supabase-js`) armazena essa sessão de forma segura no `localStorage` do navegador.

### b. Gerenciamento de Sessão no Cliente

-   O `AuthProvider` em `modules/common/services/AuthProvider.tsx` e o cliente Supabase em `modules/common/services/supabaseClient.ts` gerenciam o estado da sessão no frontend.
-   O hook `useAuthenticatedFetch` obtém o `access_token` da sessão ativa e o injeta no cabeçalho `Authorization` de cada requisição para as APIs protegidas.

---

## 3. Autorização (Proteção de Endpoints)

### a. Middleware de Autorização

-   **Arquivo Principal**: `modules/common/utils/authMiddleware.ts`
-   **Função Central**: `verifyAdminAuth(request)` valida o token JWT e verifica a `role` do usuário. Ela extrai o token `Bearer` do cabeçalho, valida-o com o Supabase e, em seguida, verifica se o usuário tem a `role` de `admin`.
-   **Wrappers de Rota**: A HOF (Higher-Order Function) `withAdminAuth` (e suas variantes como `withSpecialistAuth`) envolve a lógica da rota. Antes de executar o código da rota, ela chama `verifyAdminAuth`. Se a autorização falhar, retorna uma resposta `401 Unauthorized` ou `403 Forbidden`.

### b. Fluxo de Acesso a uma Rota Protegida (Exemplo Admin)

Este é o passo a passo de como um administrador logado acessa dados de uma API protegida, como `/api/admin/cadastros-pendentes`:

1.  **Ação no Frontend**: Um componente React (ex: `PendingRegistrationsList.tsx`) precisa buscar os dados. Ele chama uma função do seu hook associado (`useCadastrosPendentes.ts`).
2.  **Hook `useAuthenticatedFetch`**: A função do hook utiliza o `useAuthenticatedFetch` para fazer a requisição.
3.  **Obtenção do Token**: O `useAuthenticatedFetch` chama `supabase.auth.getSession()` para obter a sessão atual e extrai o `access_token`.
4.  **Requisição HTTP**: O hook monta e envia uma requisição `GET` para `/api/admin/cadastros-pendentes`, incluindo o cabeçalho: `Authorization: Bearer <access_token>`.
5.  **Interceptação pelo Middleware**: A requisição chega ao backend Next.js. O wrapper `withAdminAuth` que protege a rota é ativado.
6.  **Validação do Token**: O middleware chama `verifyAdminAuth`, que:
    a. Extrai o token do cabeçalho.
    b. Chama `supabase.auth.getUser(token)`. O Supabase valida a assinatura e o tempo de expiração do JWT.
    c. Se o token for válido, a função verifica se a `role` do usuário (presente no `user_metadata` do token ou na tabela `profiles`) é `admin`.
7.  **Execução do Handler**: Se o token e a role são válidos, o código original da rota em `/app/api/admin/cadastros-pendentes/route.ts` é executado, ele busca os dados no banco e os retorna.
8.  **Resposta**: O frontend recebe os dados e atualiza a UI. Se a validação em qualquer etapa falhar, o frontend receberá um erro 401 ou 403.

Este mesmo fluxo se aplica a qualquer outra rota protegida, como `/api/admin/clients-with-vehicle-count`.

---

## 4. Gerenciamento e Renovação de Tokens

### a. Tokens de Sessão (JWT) e Renovação Automática

-   **Geração**: A geração dos tokens de sessão (`access_token` e `refresh_token`) é feita exclusivamente pelo Supabase Auth no momento do login.
-   **Renovação (Admin e outros usuários)**: O processo de renovação é idêntico para todos os usuários, incluindo administradores, e é **totalmente gerenciado pelo cliente Supabase (`supabase-js`)**.
    -   O `access_token` tem uma vida útil curta (ex: 1 hora).
    -   Quando o `useAuthenticatedFetch` tenta obter a sessão para uma nova chamada de API, a biblioteca do Supabase verifica se o `access_token` está expirado.
    -   Se estiver expirado, a biblioteca usa o `refresh_token` (que tem vida útil longa) para solicitar um novo par de `access_token` e `refresh_token` ao servidor do Supabase.
    -   Este processo é **automático e transparente** para a aplicação, garantindo que o administrador permaneça logado sem interrupções enquanto estiver ativo.

### b. Geração Centralizada de Tokens Customizados

-   **Arquivo Centralizador**: `modules/common/utils/emailConfirmationTokens.ts`
-   **Propósito**: Para fluxos que ocorrem fora de uma sessão de usuário, como a confirmação de e-mail via link, o sistema utiliza tokens próprios.
-   **Funcionamento**:
    1.  A função `generateEmailConfirmationToken` cria um token seguro e com prazo de validade, contendo o `userId` e um `timestamp`, assinado com um segredo.
    2.  Este token é enviado por e-mail ao usuário.
    3.  A API de confirmação (`/api/confirm-email`) usa a função `validateEmailConfirmationToken` para verificar a validade e a assinatura do token.
-   **Conclusão**: Este arquivo é a fonte centralizada para a geração e validação de tokens customizados na aplicação.

---

## 5. Diagnóstico de Problemas e Não Conformidades

Apesar da arquitetura descrita acima estar correta na teoria, a análise do código revela pontos críticos que causam os problemas de acesso e renovação de token em ambientes de produção (Vercel), além de violar as diretrizes de desenvolvimento do projeto.

### a. Causa Raiz: Inconsistência na Criação do Cliente Supabase (Violação do DRY)

O problema fundamental é que as rotas de API em `app/api/admin/**` **não utilizam de forma consistente o serviço centralizado `SupabaseService`**. Muitas rotas criam suas próprias instâncias do cliente Supabase, violando o princípio **DRY (Don't Repeat Yourself)**.

**Implementação Incorreta (encontrada em múltiplos arquivos):**
```typescript
// Exemplo em app/api/admin/clientes/route.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY! // <-- Ponto de falha
);
```

**Impacto:**
1.  **Falha em Produção:** Ambientes como a Vercel exigem que as variáveis de ambiente do servidor (como a `SERVICE_ROLE_KEY`) sejam configuradas em seu painel. Se o nome da variável na Vercel for `SUPABASE_SERVICE_ROLE_KEY` e o código espera `NEXT_SUPABASE_SERVICE_ROLE_KEY`, a inicialização do cliente falhará, resultando em erros 401/403 que não acontecem localmente.
2.  **Manutenção Difícil:** Qualquer alteração nas chaves de API ou na configuração do Supabase precisa ser feita em dezenas de arquivos, em vez de um único local.

### b. Causa Raiz: Falha na Renovação de Token (Sintoma)

O problema percebido como "falha na renovação de token" é um **sintoma** do problema descrito acima.

1.  O frontend (via `supabase-js`) **renova o token de acesso com sucesso**.
2.  Envia uma requisição para uma API do backend com o novo token, que é perfeitamente válido.
3.  A API no backend, ao receber a requisição, tenta criar sua **própria instância** do cliente Supabase para validar o token.
4.  A criação do cliente no backend **falha** devido à configuração incorreta das variáveis de ambiente (Causa Raiz nº 1).
5.  Como o backend não consegue validar o token, ele retorna um erro 401/403.

Do ponto de vista do frontend, parece que o token recém-renovado é inválido, mas o erro real está na incapacidade do backend de se configurar corretamente para validar o token.

### c. Não Conformidades com as Diretrizes

-   **DRY (Don't Repeat Yourself):** Violado massivamente pela repetição de `createClient()` em múltiplas rotas de API.
-   **Arquitetura Modular / SOLID:** Violado pois as rotas de API estão criando suas próprias dependências de infraestrutura (`createClient`) em vez de recebê-las de um serviço centralizado, quebrando o princípio da Inversão de Dependência.
-   **Código Limpo e Sem Debugs:** A presença de `console.log` e `console.error` em arquivos de serviço (`SupabaseService.ts`) e em várias rotas de API viola a diretriz de manter o código de produção limpo.
-   **Duplicação de Código:** A existência de rotas como `add-client-secure.ts` é uma duplicação de `add-client.ts`, adicionando complexidade desnecessária.

### d. Plano de Correção Recomendado

1.  **Centralizar a Criação do Cliente Supabase:** Refatorar **todas** as rotas em `app/api/admin/**` para obter a instância do cliente Supabase exclusivamente através do serviço `SupabaseService.getInstance().getAdminClient()`.
2.  **Padronizar Variáveis de Ambiente:** Definir um nome único e padrão para a `SERVICE_ROLE_KEY` (ex: `SUPABASE_SERVICE_ROLE_KEY`), usá-lo no `SupabaseService` e configurá-lo de forma idêntica no ambiente local (`.env.local`) e na Vercel.
3.  **Remover Código Duplicado e de Debug:** Unificar rotas duplicadas e remover todas as chamadas de `console.log` e `console.error` do código de produção.
