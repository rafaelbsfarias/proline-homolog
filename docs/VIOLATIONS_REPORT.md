# Relatório de Violações dos Princípios de Desenvolvimento

Este relatório detalha as principais violações dos princípios de desenvolvimento definidos em `docs/DEVELOPMENT_INSTRUCTIONS.md` encontradas nos diretórios `@app/**`, `@modules/**` e `@lib/**`.

## 1. Princípios de Desenvolvimento Avaliados

Os princípios de desenvolvimento do projeto são:

-   **DRY (Don't Repeat Yourself):** Evitar a duplicação de código.
-   **SOLID:**
    -   **Single Responsibility Principle (SRP):** Cada módulo/classe/função deve ter apenas uma razão para mudar.
    -   **Open/Closed Principle (OCP):** Entidades de software devem ser abertas para extensão, mas fechadas para modificação.
    -   **Liskov Substitution Principle (LSP):** Subtipos devem ser substituíveis por seus tipos base.
    -   **Interface Segregation Principle (ISP):** Clientes não devem ser forçados a depender de interfaces que não usam.
    -   **Dependency Inversion Principle (DIP):** Depender de abstrações, não de concretizações.
-   **Object Calisthenics:** Nove regras simples para código mais limpo, coeso e desacoplado.
-   **Arquitetura Modular:** Organizar o código em módulos independentes e coesos.
-   **REACT/TS best practices:** Seguir as melhores práticas para desenvolvimento seguro.
-   **Considerar ambiente de produção:** Debugs devem ser removidos.
-   **Manter código limpo:** Não deixar "sujeira" para trás.

## 2. Violações Principais Encontradas

### 2.1. Violações Gerais e Recorrentes

*   **Uso Excessivo de `any` (REACT/TS best practices):** Há muitas instâncias de `any` sendo usadas, especialmente em rotas de API e alguns componentes. Isso compromete a segurança de tipos do TypeScript.
*   **`console.log` em Código de Produção (Considerar ambiente de produção / Código Limpo):** Muitos `console.log` e `console.error` ainda estão presentes em arquivos de API e componentes. Isso pode expor informações sensíveis e poluir logs em produção.
*   **Duplicação de Código (DRY):**
    *   Lógica de validação de CNPJ/CPF (`validateCNPJ`, `validateCPF`) é duplicada entre `modules/common/utils/inputSanitization.ts` e `modules/common/validators/signupValidators.ts`.
    *   Blocos `if (error instanceof XError)` são repetidos extensivamente em várias rotas de API.
*   **Inconsistência na Estratégia de Tratamento de Erros (DRY / SOLID - SRP):**
    *   Coexistência de `handleApiError` (em `lib/utils/apiErrorHandlers.ts`) e `handleError` (em `modules/common/services/ErrorHandlerService.ts`) com propósitos semelhantes, mas implementações e usos inconsistentes.
    *   A hierarquia de erros em `lib/utils/errors.ts` não estende a `AppError` base de `modules/common/errors.ts`, criando duas hierarquias de erro distintas e confusas. Isso viola o OCP e o ISP.
*   **Duplicação na Inicialização do Cliente Supabase (DRY / SOLID - DIP):** A chamada `createClient(...)` é repetida em várias rotas de API e em alguns componentes, em vez de usar uma instância centralizada via `SupabaseService`.
*   **Estilos Inline Excessivos (Object Calisthenics / Código Limpo):** Muitos componentes utilizam estilos inline diretamente no JSX, dificultando a manutenção, a reutilização e a consistência visual.

### 2.2. Violações por Diretório

#### `@app/**` (Rotas de API e Páginas)

*   **`app/api/**` (Rotas de API):**
    *   **DRY / Código Limpo:** Blocos `catch` repetitivos.
    *   **Considerar ambiente de produção:** Presença de `console.log`s.
    *   **REACT/TS best practices:** Uso frequente de `as any`.
    *   **DRY / SOLID - DIP:** Inicialização repetitiva do cliente Supabase.
*   **`app/auth/callback/page.tsx`, `app/page.tsx`:**
    *   **DRY / SOLID - DIP:** Chamadas diretas a `createClient` em vez de usar `SupabaseService`.
*   **`app/dashboard/page.tsx`:**
    *   **Código Limpo:** Funções `handleClearAuth` e `handleDebugAuth` definidas mas não utilizadas.
*   **`app/middleware.ts`:**
    *   **Código Limpo:** `console.error` direto.

#### `@modules/**` (Módulos de Domínio e Comuns)

*   **`modules/admin/application/CreateUserUseCase.ts`:**
    *   **Código Limpo:** "Sujeira" de refatorações anteriores (variáveis declaradas mas não utilizadas no fluxo final de email).
*   **`modules/admin/components/AddClientModal.tsx`, `AddPartnerModal.tsx`, `AddUserModal.tsx`:**
    *   **DRY / SRP:** Lógica de manipulação de formulário, validação e chamadas de API misturadas com a renderização. Poderia ser abstraída para hooks customizados.
*   **`modules/admin/components/CadastrosPendentesList.tsx`, `UserList.tsx`:**
    *   **Object Calisthenics / Código Limpo:** Uso excessivo de estilos inline.
*   **`modules/common/hooks/useAuthenticatedFetch.ts` e `useAuthenticatedFetchDebug.ts`:**
    *   **DRY:** Duplicação significativa de código. Deveriam ser unificados com controle de debug por flag.
*   **`modules/common/services/ResendEmailService.ts`:**
    *   **SOLID - OCP:** O método `sendWelcomeEmailWithTemporaryPassword` contém lógica condicional (`if (templateVariant === 'invite')`) para diferentes templates. Idealmente, deveria ser aberto para extensão (novos templates como novos métodos) mas fechado para modificação interna.
*   **`modules/common/services/SupabaseService.ts`:**
    *   **Considerar ambiente de produção / Código Limpo:** Presença de `console.log`s para debug.
*   **`modules/common/utils/inputSanitization.ts` e `modules/common/validators/signupValidators.ts`:**
    *   **DRY:** Duplicação da lógica de validação de CNPJ/CPF.

#### `@lib/**` (Bibliotecas e Utilitários de Baixo Nível)

*   **`lib/utils/apiErrorHandlers.ts`:**
    *   **DRY / SRP:** Blocos `if (error instanceof XError)` repetitivos.
    *   **Inconsistência:** Ainda em uso em algumas rotas de API, enquanto outras migraram para `ErrorHandlerService`.
*   **`lib/utils/errors.ts`:**
    *   **SOLID - OCP / ISP:** As classes de erro (`AuthError`, `ForbiddenError`, etc.) não estendem a `AppError` base de `modules/common/errors.ts`. Isso cria uma hierarquia de erros inconsistente e dificulta o tratamento polimórfico.
*   **`lib/security/session.ts`, `lib/security/withAuth.ts`, `lib/security/withRoleAuth.ts`:**
    *   **Inconsistência:** Ainda utilizam `handleApiError` de `lib/utils/apiErrorHandlers.ts`, enquanto a aplicação está migrando para `ErrorHandlerService`.
    *   **Considerar ambiente de produção / Código Limpo:** `console.error` em `getAuthenticatedUser`.

## 3. Conclusão Geral

O projeto demonstra uma **intenção clara de seguir boas práticas** de desenvolvimento, com a presença de modularização, DI e testes. No entanto, a execução ainda apresenta **inconsistências significativas e violações recorrentes** dos princípios DRY, SOLID e de código limpo.

As principais áreas de atenção são:
1.  **Duplicação de Código:** Especialmente em validações, tratamento de erros e inicialização do Supabase.
2.  **Inconsistência na Arquitetura de Erros:** A existência de duas hierarquias de `AppError` e diferentes abordagens para `handleApiError` vs `handleError` é um ponto crítico.
3.  **Uso de `any` e `console.log`:** Indicam falta de rigor na tipagem e na preparação para produção.
4.  **Estilos Inline:** Prejudicam a manutenibilidade e a consistência visual.

Abordar essas violações de forma sistemática melhorará drasticamente a manutenibilidade, a escalabilidade e a qualidade geral do código.

---

**Gerado por Gemini CLI em 13 de agosto de 2025.**
