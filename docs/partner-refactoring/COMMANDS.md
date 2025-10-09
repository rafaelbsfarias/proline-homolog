# 🛠️ Comandos Úteis - Refatoração do Parceiro

Comandos prontos para executar durante a refatoração.

---

## 🔍 Análise e Inspeção

### Buscar Padrões de Código

```bash
# Encontrar todos os usos de createApiClient
grep -r "createApiClient" app/api/partner --include="*.ts"

# Encontrar todos os usos de createClient direto
grep -r "createClient.*supabase" app/api/partner --include="*.ts"

# Encontrar autenticação manual
grep -r "getUser.*token" app/api/partner --include="*.ts"

# Encontrar endpoints sem withPartnerAuth
grep -r "export.*async.*function.*POST\|GET\|PUT\|DELETE" app/api/partner --include="*.ts" | grep -v "withPartnerAuth"

# Contar linhas por arquivo
find app/api/partner -name "*.ts" -exec wc -l {} \; | sort -rn | head -20
```

### Análise de Complexidade

```bash
# Encontrar funções longas (mais de 50 linhas)
# (requer ast-grep ou similar)
find app/api/partner -name "*.ts" -exec sh -c 'echo "=== $1 ===" && wc -l "$1"' _ {} \;

# Listar todos os endpoints
find app/api/partner -name "route.ts" -type f | sort

# Contar total de arquivos
find app/api/partner -name "*.ts" | wc -l
```

---

## 🔧 Refatoração Automatizada

### Substituir Imports

```bash
# Substituir createApiClient por SupabaseService (macOS)
find app/api/partner -name "*.ts" -exec sed -i '' \
  's/import { createApiClient } from.*$/import { SupabaseService } from "@\/modules\/common\/services\/SupabaseService";/g' {} \;

# Substituir createApiClient por SupabaseService (Linux)
find app/api/partner -name "*.ts" -exec sed -i \
  's/import { createApiClient } from.*$/import { SupabaseService } from "@\/modules\/common\/services\/SupabaseService";/g' {} \;

# Substituir const supabase = createApiClient()
find app/api/partner -name "*.ts" -exec sed -i '' \
  's/const supabase = createApiClient()/const supabase = SupabaseService.getInstance().getAdminClient()/g' {} \;
```

### Remover Imports Não Utilizados

```bash
# Executar ESLint com fix
npm run lint -- --fix app/api/partner

# Ou com eslint direto
npx eslint app/api/partner --fix
```

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm run test

# Apenas testes do parceiro
npm run test -- app/api/partner

# Com coverage
npm run test:coverage -- app/api/partner

# Watch mode
npm run test:watch -- app/api/partner

# Específico
npm run test -- app/api/partner/checklist/load/route.test.ts
```

### Criar Teste Template

```bash
# Criar arquivo de teste
cat > app/api/partner/checklist/load/route.test.ts << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/partner/checklist/load', () => {
  it('should return 401 without authentication', async () => {
    // TODO: Implementar teste
  });

  it('should load checklist successfully', async () => {
    // TODO: Implementar teste
  });
});
EOF
```

---

## 🚀 Git e Branches

### Criar Branch para Fase

```bash
# Fase 1: Segurança
git checkout aprovacao-orcamento-pelo-admin
git pull
git checkout -b refactor/partner-security-fixes

# Fase 2: Padronização
git checkout aprovacao-orcamento-pelo-admin
git pull
git checkout -b refactor/partner-standardization

# Fase 3: Arquitetura
git checkout aprovacao-orcamento-pelo-admin
git pull
git checkout -b refactor/partner-architecture

# Fase 4: Qualidade
git checkout aprovacao-orcamento-pelo-admin
git pull
git checkout -b refactor/partner-quality
```

### Commits Atômicos

```bash
# Exemplo de commits por mudança
git add app/api/partner/checklist/load/route.ts
git commit -m "fix(partner): adiciona autenticação em load endpoint"

git add app/api/partner/checklist/exists/route.ts
git commit -m "fix(partner): remove credenciais hardcoded em exists"

git add app/api/partner/checklist/lib/schemas.ts
git commit -m "feat(partner): adiciona validação Zod para checklist"
```

### Verificar Mudanças

```bash
# Ver arquivos modificados
git status

# Ver diff
git diff

# Ver diff de arquivo específico
git diff app/api/partner/checklist/load/route.ts

# Ver histórico
git log --oneline -10
```

---

## 📊 Métricas e Análise

### Contar Linhas de Código

```bash
# Total de linhas em app/api/partner
find app/api/partner -name "*.ts" | xargs wc -l | tail -1

# Por tipo de arquivo
echo "Routes:" && find app/api/partner -name "route.ts" | xargs wc -l | tail -1
echo "Tests:" && find app/api/partner -name "*.test.ts" | xargs wc -l | tail -1
echo "Schemas:" && find app/api/partner -name "schemas.ts" | xargs wc -l | tail -1
```

### Estatísticas de Mudanças

```bash
# Arquivos modificados na branch
git diff --stat aprovacao-orcamento-pelo-admin

# Linhas adicionadas/removidas
git diff --shortstat aprovacao-orcamento-pelo-admin

# Detalhes por arquivo
git diff --numstat aprovacao-orcamento-pelo-admin
```

---

## 🔒 Segurança

### Verificar Endpoints sem Autenticação

```bash
# Script para encontrar endpoints desprotegidos
cat > check-auth.sh << 'EOF'
#!/bin/bash
echo "Verificando endpoints sem withPartnerAuth..."
for file in $(find app/api/partner -name "route.ts"); do
  if ! grep -q "withPartnerAuth" "$file"; then
    echo "⚠️  $file"
  fi
done
EOF

chmod +x check-auth.sh
./check-auth.sh
```

### Verificar Credenciais Hardcoded

```bash
# Buscar padrões suspeitos
grep -r "process.env" app/api/partner --include="*.ts" | grep -i "supabase"
grep -r "createClient(" app/api/partner --include="*.ts"
```

---

## 🧹 Limpeza

### Remover Arquivos Não Utilizados

```bash
# Encontrar imports não utilizados
npx ts-prune app/api/partner

# Remover comentários de código antigo
# (manual, mas pode usar regex)
```

### Formatar Código

```bash
# Prettier em todos os arquivos do parceiro
npx prettier --write "app/api/partner/**/*.{ts,tsx}"

# ESLint fix
npx eslint app/api/partner --fix
```

---

## 📦 Build e Deploy

### Build Local

```bash
# Build completo
npm run build

# Verificar erros de tipo
npx tsc --noEmit

# Build com watch
npm run dev
```

### Verificar Antes de Merge

```bash
# Checklist pré-merge
npm run lint
npm run test
npm run build
git diff --check  # Verifica conflitos
```

---

## 🔄 Rollback e Recuperação

### Desfazer Mudanças

```bash
# Descartar mudanças não commitadas
git checkout -- app/api/partner/checklist/load/route.ts

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer último commit (descarta mudanças)
git reset --hard HEAD~1

# Voltar para commit específico
git reset --hard <commit-hash>
```

### Stash para Salvar Trabalho

```bash
# Salvar mudanças temporariamente
git stash save "WIP: refatorando checklist"

# Ver stashes
git stash list

# Aplicar stash
git stash apply stash@{0}

# Aplicar e remover stash
git stash pop
```

---

## 🎯 Scripts Úteis de Desenvolvimento

### Criar Script de Migração

```bash
# Script para migrar todos os endpoints de uma vez
cat > migrate-endpoints.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Migrando endpoints do parceiro..."

# 1. Substituir imports
echo "📝 Atualizando imports..."
find app/api/partner -name "*.ts" -exec sed -i '' \
  's/createApiClient/SupabaseService.getInstance().getAdminClient/g' {} \;

# 2. Executar testes
echo "🧪 Executando testes..."
npm run test -- app/api/partner

# 3. Verificar build
echo "📦 Verificando build..."
npm run build

echo "✅ Migração completa!"
EOF

chmod +x migrate-endpoints.sh
```

### Verificar Qualidade

```bash
# Script completo de verificação
cat > check-quality.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 Verificando qualidade do código..."

# Lint
echo "📝 Executando ESLint..."
npm run lint -- app/api/partner

# Testes
echo "🧪 Executando testes..."
npm run test -- app/api/partner

# Coverage
echo "📊 Verificando coverage..."
npm run test:coverage -- app/api/partner

# Build
echo "📦 Verificando build..."
npm run build

echo "✅ Todas as verificações passaram!"
EOF

chmod +x check-quality.sh
./check-quality.sh
```

---

## 📚 Documentação

### Gerar Documentação de API

```bash
# Se estiver usando TypeDoc
npx typedoc app/api/partner

# Ou gerar manualmente
cat > generate-api-docs.sh << 'EOF'
#!/bin/bash
echo "# API Partner Documentation" > API.md
echo "" >> API.md
find app/api/partner -name "route.ts" | while read file; do
  echo "## $file" >> API.md
  echo "\`\`\`typescript" >> API.md
  head -20 "$file" >> API.md
  echo "\`\`\`" >> API.md
  echo "" >> API.md
done
EOF
```

---

## 🎨 Templates Úteis

### Criar Novo Endpoint com Template

```bash
# Template de endpoint seguro
cat > templates/secure-endpoint.ts << 'EOF'
import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { z } from 'zod';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:new-endpoint');

// Schema de validação
const RequestSchema = z.object({
  // TODO: Adicionar campos
});

// Handler
async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    
    // Validação
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    const partnerId = req.user.id;
    
    // Lógica de negócio
    const supabase = SupabaseService.getInstance().getAdminClient();
    // TODO: Implementar
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('error', { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}

export const POST = withPartnerAuth(handler);
EOF
```

---

## 🚦 CI/CD

### Executar Pipeline Local

```bash
# Simular pipeline de CI
cat > ci-check.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Executando pipeline de CI local..."

echo "1️⃣ Lint..."
npm run lint

echo "2️⃣ Type Check..."
npx tsc --noEmit

echo "3️⃣ Tests..."
npm run test

echo "4️⃣ Build..."
npm run build

echo "✅ Pipeline completa com sucesso!"
EOF

chmod +x ci-check.sh
./ci-check.sh
```

---

## 📖 Referências Rápidas

### Comandos Git Essenciais
```bash
git status              # Ver status
git diff                # Ver mudanças
git add .               # Adicionar tudo
git commit -m "msg"     # Commit
git push                # Push
git pull                # Pull
```

### Comandos npm Essenciais
```bash
npm run dev             # Desenvolvimento
npm run build           # Build
npm run test            # Testes
npm run lint            # Lint
```

---

**Última Atualização:** 2025-10-09  
**Versão:** 1.0
