# 🚗 Projeto Vercel - Sistema de Gestão

## 📋 Visão Geral

Sistema completo de gestão com diferentes perfis de usuário (Admin, Cliente, Parceiro, Especialista)
construído com Next.js, TypeScript, Supabase e arquitetura modular.

## 🏗️ Arquitetura

- **Frontend**: Next.js 15 com TypeScript
- **Backend**: API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Testes E2E**: Cypress
- **Qualidade de Código**: ESLint + TypeScript strict mode

## 📁 Estrutura do Projeto

```
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   ├── components/        # Componentes compartilhados
│   └── services/          # Serviços de negócio
├── modules/               # Módulos por domínio
│   ├── admin/            # Funcionalidades de admin
│   ├── client/           # Funcionalidades de cliente
│   ├── partner/          # Funcionalidades de parceiro
│   └── common/           # Componentes e hooks compartilhados
├── cypress/              # Testes E2E
├── docs/                 # 📚 Documentação organizada (ver docs/README.md)
│   ├── setup/           # Guias de configuração
│   ├── architecture/    # Documentação de arquitetura
│   ├── features/        # Documentação de funcionalidades
│   └── troubleshooting/ # Guias de resolução de problemas
└── utils/                # Utilitários gerais
```

## 🚀 Comandos Principais

```bash
# Instalação
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Testes E2E
npm run cypress:open

# Qualidade de código
npm run lint
npm run lint:fix
npm run type-check
```

## 📚 Documentação

Para acessar toda a documentação do projeto, consulte **[docs/README.md](./docs/README.md)**.

### 🚀 Links Rápidos

- **[Quick Start](./docs/setup/QUICK_START.md)** - Começar rapidamente
- **[Setup Local Supabase](./docs/setup/SUPABASE_LOCAL_SETUP.md)** - Ambiente local completo
- **[Troubleshooting](./docs/troubleshooting/)** - Resolução de problemas
- **[Arquitetura](./docs/architecture/)** - Como o sistema funciona

### 📖 Por Categoria

| Categoria              | Descrição                   | Links                                |
| ---------------------- | --------------------------- | ------------------------------------ |
| **� Setup**            | Configuração e instalação   | [Ver todos](./docs/setup/)           |
| **🏗️ Architecture**    | Arquitetura e fluxos        | [Ver todos](./docs/architecture/)    |
| **⚡ Features**        | Funcionalidades específicas | [Ver todos](./docs/features/)        |
| **🔧 Troubleshooting** | Resolução de problemas      | [Ver todos](./docs/troubleshooting/) |

### Princípios de Desenvolvimento

Este projeto segue os seguintes princípios:

- **DRY (Don't Repeat Yourself)**: Evitar duplicação de código
- **SOLID**: Princípios de design orientado a objetos
- **Object Calisthenics**: Código limpo e coeso
- **Arquitetura Modular**: Organização clara e responsabilidades definidas

## ⚡ Quick Start para Desenvolvedores

### 1. Setup Inicial

```bash
git clone [repository-url]
cd temp-vercel
npm install
cp .env.example .env.local # Configure as variáveis de ambiente
npm run dev
```

### 2. Antes de Cada Commit

```bash
npm run lint        # Verificar regras de lint
npm run type-check  # Verificar tipos TypeScript
npm run build       # Testar compilação
```

### 3. Problemas Comuns

- **Hook useAuthService**: Use `const authService = useAuthService()` (não desestruture)
- **Auth Middleware**: Use `withAdminAuth`, não `withAuth`
- **Console.log**: Proteja com `process.env.NODE_ENV === 'development'`
- **Imports não utilizados**: Remova ou prefixe com `_`

## 🛠️ Configuração do Ambiente

### Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Banco de Dados

O projeto utiliza Supabase com as seguintes tabelas principais:

- `profiles`: Perfis de usuário
- `pending_registrations`: Cadastros pendentes de aprovação

## 📋 Checklist para Novos Desenvolvedores

- [ ] Ler [Guia de Lint](./docs/LINT_GUIDE.md)
- [ ] Configurar variáveis de ambiente
- [ ] Testar `npm run dev`
- [ ] Executar `npm run build` com sucesso
- [ ] Familiarizar-se com a estrutura modular
- [ ] Configurar IDE com plugins ESLint/TypeScript

## 🤝 Contribuição

1. Sempre rodar `npm run lint` antes de commits
2. Manter cobertura de tipos TypeScript em 100%
3. Seguir padrões de nomenclatura estabelecidos
4. Documentar componentes e hooks complexos
5. Adicionar testes para novas funcionalidades

## 📊 Qualidade de Código

- ✅ ESLint com regras rigorosas
- ✅ TypeScript em modo strict
- ✅ Pre-commit hooks automatizados
- ✅ Build sem warnings
- ✅ Testes E2E com Cypress

## 🔧 Troubleshooting

Para problemas comuns de desenvolvimento, consulte:

- [Guia de Lint](./docs/LINT_GUIDE.md#troubleshooting)
- [Quick Reference](./docs/QUICK_LINT_REFERENCE.md)

---

**Dica**: Mantenha sempre a [documentação de lint](./docs/LINT_GUIDE.md) como referência durante o
desenvolvimento. 🎯
