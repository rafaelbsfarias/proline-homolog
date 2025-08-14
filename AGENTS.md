# Repository Guidelines

## Princípios de Desenvolvimento

Este projeto adere aos seguintes princípios para garantir a qualidade, manutenibilidade e
escalabilidade do código:

- **DRY (Don't Repeat Yourself):** Evitar a duplicação de código, promovendo a reutilização e a
  centralização da lógica.
- **SOLID:** Seguir os cinco princípios do design orientado a objetos (Single Responsibility,
  Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) para criar sistemas
  mais compreensíveis, flexíveis e manuteníveis.
- **Object Calisthenics:** Aplicar um conjunto de nove regras simples para escrever código mais
  limpo, coeso e desacoplado, focando na simplicidade e na responsabilidade única dos objetos.
- **Arquitetura Modular:** Organizar o código em módulos independentes e coesos, facilitando a
  manutenção, escalabilidade e reusabilidade. Cada módulo deve ter responsabilidades bem definidas e
  interfaces claras.

- Esse é um projeto REACT/TS e deve seguir as melhores praticas para um desenvolvimento seguro

- Considerar sempre que o ambiente está em produção, debugs devem ser removidos logo após a
  resolução do problema

- Mantenha o código limpo, após uma correção de código verique duas vezes se não está deixando
  sujeira para trás

- o deploy e feito na vercel

## Project Structure & Module Organization

- `app/`: Next.js App Router pages, layouts, APIs, and feature routes.
- `modules/`: Domain modules (`admin/`, `client/`, `partner/`, `specialist/`, `common/`).
- `public/`: Static assets.
- `test/`: Unit test setup and suites; see `test/setup.ts`.
- `cypress/`: End‑to‑end tests (`e2e/`, `fixtures/`, `support/`).
- `scripts/`: Utilities (e.g., `find-empty-files.js`).
- `docs/`, `reports/`, `dist/`: Documentation, reports, and build artifacts.

## Build, Test, and Development Commands

- `npm run dev`: Start local dev server (Turbopack).
- `npm run build` / `npm start`: Production build and serve.
- `npm run test` / `test:run`: Vitest (watch/CI).
- `npm run test:coverage`: Vitest with coverage report.
- `npm run test:e2e` / `cypress`: Cypress E2E (headless/UI).
- `npm run lint[:check]` / `format[:check]`: ESLint and Prettier.
- `npm run qa` / `qa:full` / `validate`: Composite quality and CI-style validation.

## Coding Style & Naming Conventions

- TypeScript + React; prefer functional components. Aliases: `@`, `@/app`, `@/modules`, `@/utils`,
  `@/components`.
- Prettier: 2‑space indent, single quotes, 100‑char width.
- Components: `PascalCase.tsx`; utilities/constants: `camelCase.ts` / `SCREAMING_SNAKE_CASE`.
- Keep feature code within its module (e.g., `modules/specialist/...`). Follow ESLint rules in
  `eslint.config.*`.

## Testing Guidelines

- Unit: Vitest (+ Testing Library). Name tests `*.test.ts?(x)` or `*.spec.ts?(x)` near source or
  under `modules/**/__tests__`.
- Coverage thresholds: lines 80%, functions 80%, branches 70%, statements 80% (see
  `vitest.config.ts`).
- Setup: `test/setup.ts`; excludes `node_modules`, `.next`, `cypress`, `dist`, `public`.
- E2E: Cypress specs in `cypress/e2e/**`; base URL `http://localhost:3000`.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` (scope
  optional, e.g., `feat(auth): ...`).
- Pre-commit: Husky runs lint‑staged and blocks `TODO`/`FIXME` in staged code.
- PRs: clear description, linked issues, steps to test, screenshots for UI, and note env changes.
- Ensure local checks are green: `npm run qa` (or `npm run validate` for full pipeline) before
  requesting review.

## Security & Configuration

- Use `.env.local` (copy from `.env.example`); never commit secrets.
- Supabase keys are required for some tests; Cypress/Vitest use safe defaults in config for local
  runs.
