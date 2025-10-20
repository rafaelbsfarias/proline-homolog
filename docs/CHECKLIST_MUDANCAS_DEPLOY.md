# Checklist de Mudanças - Troubleshooting Deploy Vercel

**Data:** 20 de Outubro de 2025  
**Último Deploy com Sucesso:** Commit `7d832bb`  
**Branch:** develop

---

## 📋 Histórico de Problemas e Soluções

### Problema 1: Supabase CLI causando falha no deployment
**Status:** ✅ RESOLVIDO

**Sintomas:**
- Build passava localmente
- Build passava na Vercel
- Deployment falha com erro genérico
- Logs mostravam: `WARN Failed to create bin at .../supabase/bin/supabase`

**Causa Raiz:**
- Pacote `supabase@2.39.2` (CLI) estava em `devDependencies`
- CLI tenta baixar binário executável durante instalação
- Vercel bloqueia scripts de instalação por segurança
- Instalação falha silenciosamente
- Deployment quebra ao tentar empacotar outputs

**Solução Aplicada:**
```bash
# Commit: 852be57
npm uninstall --save-dev supabase
```

**Arquivos Modificados:**
- `package.json` - Removido `supabase` de devDependencies
- Mantidos: `@supabase/supabase-js` e `@supabase/ssr` (SDKs necessários)

**Aprendizado:**
- Diferenciar CLI tools vs SDK libraries
- CLIs com binários não devem estar em dependencies de produção
- Vercel tem restrições de segurança em installation scripts

---

### Problema 2: Lockfile desatualizado (pnpm)
**Status:** ✅ RESOLVIDO

**Sintomas:**
```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"
specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies were removed: supabase@^2.39.2
```

**Causa Raiz:**
- Usamos `npm uninstall` num projeto que usa `pnpm`
- `npm` criou/atualizou `package-lock.json`
- `pnpm-lock.yaml` ficou desatualizado
- Vercel usa pnpm e detectou inconsistência

**Solução Aplicada:**
```bash
# Commit: 40c3d2f
npx pnpm install           # Atualiza pnpm-lock.yaml
rm package-lock.json       # Remove lockfile do npm
git add pnpm-lock.yaml
git rm package-lock.json
```

**Arquivos Modificados:**
- `pnpm-lock.yaml` - Atualizado (767 pacotes)
- `package-lock.json` - Removido

**Aprendizado:**
- Sempre usar o package manager do projeto (pnpm neste caso)
- Lockfiles devem estar sincronizados com package.json
- Vercel usa `--frozen-lockfile` em CI

---

### Problema 3: Webpack assíncrono com PurgeCSS
**Status:** ✅ RESOLVIDO

**Sintomas:**
```
[Error: Cannot find module for page: /api/admin/clients-with-collection-summary]
Build error occurred
```

**Causa Raiz:**
- `next.config.ts` tinha configuração complexa do PurgeCSS
- Plugin webpack assíncrono com `import()` dinâmico
- Pode causar problemas de timing no Next.js 15
- Incompatibilidade com fase de deployment da Vercel

**Configuração Problemática:**
```typescript
// ❌ ANTES - Problemático
webpack: (config, { isServer, dev }) => {
  if (!dev && !isServer) {
    // ... código complexo com import() dinâmico
    (async () => {
      const purgecss = (await import('@fullhuman/postcss-purgecss')).default;
      return purgecss({ /* config */ });
    })(),
  }
}
```

**Solução Aplicada:**
```typescript
// ✅ DEPOIS - Simplificado
// Commit: 3555cbc
webpack: (config) => {
  config.module.rules.push({
    test: /\.(ts|tsx|js|jsx)$/,
    include: [/temp-scripts/, /scripts\/temp/],
    use: 'ignore-loader',
  });
  return config;
}
```

**Arquivos Modificados:**
- `next.config.ts` - Simplificado de 89 linhas para 27 linhas

**Aprendizado:**
- Evitar configurações webpack assíncronas complexas
- Next.js 15 pode ter mudanças em como processa plugins
- Configurações mais simples = menos pontos de falha
- PurgeCSS pode ser configurado via `postcss.config.js` se necessário

---

### Problema 4: Google Fonts causando falha de build
**Status:** ⚠️ EM RESOLUÇÃO

**Sintomas:**
```
getaddrinfo ENOTFOUND fonts.googleapis.com
Retrying 1/3...
Retrying 2/3...
Retrying 3/3...
[Error: getaddrinfo ENOTFOUND fonts.googleapis.com]
```

**Causa Raiz:**
- `layout.tsx` importa `Inter` de `next/font/google`
- Durante build, Next.js tenta baixar fonte do Google Fonts
- Falha de rede/DNS impedindo acesso a `fonts.googleapis.com`
- Build local também afetado (não é problema apenas da Vercel)

**Código Problemático:**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

**Possíveis Soluções:**

**Opção A: Configuração Experimental (TESTANDO)**
```typescript
// next.config.ts
experimental: {
  optimizePackageImports: ['next/font/google'],
}
```

**Opção B: Usar Fonte Local**
```typescript
// Baixar Inter.woff2 para /public/fonts
import localFont from 'next/font/local';
const inter = localFont({ src: '../public/fonts/Inter.woff2' });
```

**Opção C: Usar Fonte do Sistema**
```css
/* globals.css */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Arquivos Afetados:**
- `app/layout.tsx` - Import da fonte
- `next.config.ts` - Configuração experimental

**Status Atual:**
- Testando Opção A (configuração experimental)
- Se falhar, implementar Opção B (fonte local)

---

## 🔍 Análise Temporal das Mudanças

### Commit 7d832bb → Commit 756dde9
**Mudanças:** Correções solicitadas pelo cliente

**Arquivos Modificados:**
- `docs/respostas aos ajuste.md` - Documentação
- `modules/admin/components/overview/ClientVehiclesCard.tsx` - Componente

**Impacto:** ✅ Sem impacto no build/deploy

### Commit 756dde9 → Commit 6e84f19
**Mudanças:** Force redeploy

**Impacto:** ⚠️ Tentativa de forçar redeploy (não resolveu)

### Commit 6e84f19 → Commit 852be57
**Mudanças:** Remoção do Supabase CLI

**Impacto:** ✅ Resolveu problema de deployment

### Commit 852be57 → Commit 40c3d2f
**Mudanças:** Atualização do pnpm-lock.yaml

**Impacto:** ✅ Resolveu problema de lockfile

### Commit 40c3d2f → Commit 3555cbc
**Mudanças:** Simplificação do next.config.ts

**Impacto:** ✅ Build funcionou localmente (antes da issue de rede)

---

## 📊 Estado Atual do Projeto

### ✅ Funcionando
- Build local (quando rede permite download de fontes)
- Todas as rotas API compilam corretamente
- 119 páginas estáticas/dinâmicas geradas
- TypeScript sem erros
- ESLint apenas com warnings (não bloqueantes)

### ⚠️ Problemas Conhecidos
- Dependência de rede durante build (Google Fonts)
- Build falha sem conectividade com fonts.googleapis.com

### 🔧 Configuração Atual

**Package Manager:** pnpm v10.18.3  
**Next.js:** 15.5.4  
**React:** 19.1.0  
**Node.js:** 20.x  
**TypeScript:** 5.9.3

**Dependências Críticas:**
- `@supabase/supabase-js@2.58.0` ✅
- `@supabase/ssr@0.6.1` ✅
- ~~`supabase@2.39.2`~~ ❌ (removido)

---

## 🎯 Próximos Passos

### Prioridade Alta
1. [ ] Resolver problema de Google Fonts
   - Testar build com configuração experimental
   - Se falhar, implementar fonte local
   - Verificar build local passa
   - Commit e push

2. [ ] Validar deployment na Vercel
   - Aguardar novo deployment automático
   - Verificar logs de build
   - Confirmar deployment completa com sucesso

### Prioridade Média
3. [ ] Otimização de CSS (Futuro)
   - Avaliar necessidade real do PurgeCSS
   - Se necessário, implementar via postcss.config.js
   - Não usar configuração webpack assíncrona

4. [ ] Documentação
   - Atualizar README com troubleshooting
   - Documentar processo de deploy
   - Criar guia de desenvolvimento local

### Prioridade Baixa
5. [ ] Melhorias de Performance
   - Análise de bundle size
   - Lazy loading de componentes pesados
   - Otimização de imagens

---

## 📝 Lições Aprendidas

### Sobre Dependencies
1. **Separar CLI tools de SDKs**
   - CLIs devem ser instalados globalmente ou via npx
   - SDKs vão em dependencies/devDependencies

2. **Respeitar o package manager**
   - Se projeto usa pnpm, sempre usar pnpm
   - Lockfiles devem estar sincronizados

### Sobre Next.js/Vercel
3. **Configurações simples são melhores**
   - Evitar webpack configs complexas
   - Usar built-in features do Next.js quando possível
   - Async plugins podem causar race conditions

4. **Vercel tem restrições de segurança**
   - Installation scripts bloqueados
   - Frozen lockfile obrigatório
   - Timeout em builds muito longos

### Sobre Build Dependencies
5. **Dependências externas são pontos de falha**
   - Google Fonts requer conectividade
   - Considerar hospedar assets críticos localmente
   - Ter fallbacks para serviços externos

---

## 🔗 Referências

- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Vercel Build Configuration](https://vercel.com/docs/deployments/configure-a-build)
- [pnpm Frozen Lockfile](https://pnpm.io/cli/install#--frozen-lockfile)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/installing)

---

**Última Atualização:** 20/10/2025 - Problema 4 em investigação
