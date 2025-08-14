# 🔧 Guia de Lint e Boas Práticas de Código

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Configuração do ESLint](#configuração-do-eslint)
- [Problemas Comuns e Soluções](#problemas-comuns-e-soluções)
- [Análise: Problemas no CadastrarVeiculoModal](#análise-problemas-no-cadastrarveiculo)
- [Boas Práticas](#boas-práticas)
- [Scripts e Automação](#scripts-e-automação)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este projeto utiliza uma configuração rigorosa de ESLint para garantir qualidade, consistência e manutenibilidade do código. O objetivo é prevenir bugs, melhorar a legibilidade e facilitar a colaboração entre desenvolvedores.

### Princípios do Projeto
- **DRY (Don't Repeat Yourself)**: Evitar duplicação de código
- **SOLID**: Princípios de design orientado a objetos
- **Object Calisthenics**: Código limpo e coeso
- **Arquitetura Modular**: Organização clara e responsabilidades definidas

---

## ⚙️ Configuração do ESLint

### Arquivos de Configuração
- **`eslint.config.cjs`**: Configuração principal (Node.js/CommonJS)
- **`eslint.config.js`**: Configuração alternativa (ES Modules)

### Plugins Utilizados
```javascript
{
  '@typescript-eslint': TypeScript específico,
  'react': Regras para React,
  'react-hooks': Hooks do React,
  'jsx-a11y': Acessibilidade,
  'import': Organização de imports,
  'unused-imports': Detecção de imports não utilizados,
  'sonarjs': Qualidade de código,
  'security': Segurança
}
```

---

## 🚨 Problemas Comuns e Soluções

### 1. **Variáveis Não Utilizadas**
```typescript
// ❌ PROBLEMA
const [user, setUser] = useState();
const data = fetchData(); // 'data' nunca usado

// ✅ SOLUÇÃO
const [user, setUser] = useState();
const _unusedData = fetchData(); // Prefixo _ indica intencional
// OU remover completamente se não for necessário
```

**Regra**: `@typescript-eslint/no-unused-vars: 'error'`

### 2. **Console Statements**
```typescript
// ❌ PROBLEMA
console.log('Debug info');
console.error('Error occurred');

// ✅ SOLUÇÃO
// Em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}

// Para logs estruturados
import { ErrorHandlerService } from '../services/ErrorHandlerService';
const errorHandler = ErrorHandlerService.getInstance();
errorHandler.logError(error);
```

**Regra**: `no-console: 'warn'`

### 3. **Tipo `any` Explícito**
```typescript
// ❌ PROBLEMA
const handleData = (data: any) => {
  return data.someProperty;
};

// ✅ SOLUÇÃO
interface DataType {
  someProperty: string;
  // outros campos...
}

const handleData = (data: DataType) => {
  return data.someProperty;
};

// OU para casos complexos
const handleData = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as DataType).someProperty;
  }
};
```

**Regra**: `@typescript-eslint/no-explicit-any: 'warn'`

### 4. **Imports Não Utilizados**
```typescript
// ❌ PROBLEMA
import React, { useState, useEffect, useCallback } from 'react';
import { someUtility } from '../utils';

// Só usa useState

// ✅ SOLUÇÃO
import React, { useState } from 'react';
// Remove imports não utilizados
```

**Regra**: `unused-imports/no-unused-imports: 'error'`

### 5. **Parâmetros de Função Não Utilizados**
```typescript
// ❌ PROBLEMA
export const GET = withAdminAuth(async (req: NextRequest) => {
  // 'req' não é usado
  return NextResponse.json({ success: true });
});

// ✅ SOLUÇÃO
export const GET = withAdminAuth(async () => {
  return NextResponse.json({ success: true });
});

// OU se o parâmetro pode ser usado no futuro
export const GET = withAdminAuth(async (_req: NextRequest) => {
  return NextResponse.json({ success: true });
});
```

---

## 🔍 Análise: Problemas no CadastrarVeiculoModal

### Problemas Identificados

#### 1. **Hook `useAuthService` Mal Utilizado**
```typescript
// ❌ PROBLEMA ORIGINAL
const { authService } = useAuthService();

// ❌ PROBLEMA: useAuthService retorna o serviço diretamente
// A desestruturação estava tentando extrair 'authService' de um objeto
// que não possui essa propriedade

// ✅ CORREÇÃO APLICADA
const authService = useAuthService();
```

**Explicação**: O hook `useAuthService()` retorna diretamente uma instância do `AuthService`, não um objeto com propriedades. A tentativa de desestruturação causava erro de TypeScript.

#### 2. **Imports Desnecessários** (Potencial)
```typescript
// Verificar se todos os imports estão sendo utilizados
import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
```

#### 3. **Tratamento de Estados de Loading**
```typescript
// Padrão recomendado para estados de loading
const [loading, setLoading] = useState(false);
const [loadingClients, setLoadingClients] = useState(true);

// Certificar-se de que todos os estados são utilizados
// e têm tratamento adequado na UI
```

### Correções Implementadas

1. **Correção do Hook**: `const authService = useAuthService();`
2. **Verificação de Tipos**: Garantiu compatibilidade com interface do `AuthService`
3. **Compilação Limpa**: Removeu erros de TypeScript

---

## ✅ Boas Práticas

### 1. **Nomenclatura Consistente**
```typescript
// ✅ Interfaces
interface UserProfile {
  id: string;
  email: string;
}

// ✅ Hooks customizados
const useUserData = () => { ... };

// ✅ Componentes
const UserDashboard: React.FC = () => { ... };

// ✅ Tipos de eventos
type UserActionType = 'CREATE' | 'UPDATE' | 'DELETE';
```

### 2. **Gerenciamento de Estado**
```typescript
// ✅ Estados iniciais claros
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// ✅ Padrão para operações assíncronas
const fetchUsers = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await userService.getUsers();
    setUsers(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erro desconhecido');
  } finally {
    setLoading(false);
  }
};
```

### 3. **Tratamento de Erros**
```typescript
// ✅ Usar ErrorHandlerService para logs estruturados
import { ErrorHandlerService, ErrorType } from '../services/ErrorHandlerService';

const errorHandler = ErrorHandlerService.getInstance();

try {
  // operação
} catch (error) {
  errorHandler.handleError(error as Error, ErrorType.NETWORK, {
    showToUser: true,
    context: { action: 'fetchUsers' }
  });
}
```

### 4. **Imports Organizados**
```typescript
// ✅ Ordem recomendada
// 1. React e bibliotecas externas
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Componentes internos
import Modal from '../../../app/components/Modal';
import FormInput from '../../../app/components/FormInput';

// 3. Hooks e serviços
import { useAuthService } from '../../../app/services/AuthService';
import { useToast } from '../../../app/components/ToastProvider';

// 4. Tipos e interfaces
import type { UserProfile } from '../types/User';

// 5. Estilos
import styles from './Component.module.css';
```

---

## 🤖 Scripts e Automação

### Comandos Disponíveis

```bash
# Verificar lint
npm run lint

# Corrigir problemas automáticos
npm run lint:fix

# Verificar tipos TypeScript
npm run type-check

# Build completo (inclui verificações)
npm run build

# Pré-commit hooks (automático)
# - Verifica lint
# - Verifica tipos
# - Executa testes
```

### Configuração do Husky (Pre-commit)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Lint verificação
npm run lint

# Type checking
npm run type-check

# Testes unitários
npm run test
```

---

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. **Erro: "Module not found"**
```bash
# Verificar se dependências estão instaladas
npm install

# Limpar cache
npm run clean
rm -rf .next node_modules package-lock.json
npm install
```

#### 2. **Erro: "Parsing error"**
```bash
# Verificar versões do ESLint e TypeScript
npm list eslint @typescript-eslint/parser

# Atualizar se necessário
npm update eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

#### 3. **Conflitos de Configuração**
- Verificar se existe `.eslintrc.*` conflitando com `eslint.config.*`
- Remover configurações duplicadas

#### 4. **Performance do ESLint**
```bash
# Para projetos grandes, usar cache
npm run lint -- --cache

# Verificar arquivos específicos
npm run lint -- src/specific-file.ts
```

### Debugging ESLint

```bash
# Verbose output
npm run lint -- --debug

# Ver quais regras estão sendo aplicadas
npm run lint -- --print-config src/file.ts

# Verificar se arquivo está sendo ignorado
npm run lint -- --debug src/file.ts
```

---

## 📊 Métricas de Qualidade

### Indicadores de Código Limpo
- ✅ Zero warnings/errors no ESLint
- ✅ 100% cobertura de tipos TypeScript  
- ✅ Zero `console.log` em produção
- ✅ Zero variáveis não utilizadas
- ✅ Imports organizados e necessários

### Ferramentas de Monitoramento
- **ESLint**: Qualidade de código
- **TypeScript**: Segurança de tipos
- **Husky**: Verificações automáticas
- **SonarJS**: Complexidade e bugs

---

## 🎯 Resumo para Novos Desenvolvedores

### Checklist Antes de Commit
1. ✅ `npm run lint` - sem errors/warnings
2. ✅ `npm run type-check` - tipos corretos
3. ✅ `npm run build` - compilação bem-sucedida
4. ✅ Revisar mudanças no diff
5. ✅ Testar funcionalidade alterada

### Regras de Ouro
1. **Sempre tipar adequadamente** - evitar `any`
2. **Remover código não utilizado** - imports, variáveis, funções
3. **Usar ErrorHandlerService** - para logs estruturados
4. **Seguir padrões do projeto** - nomenclatura, estrutura
5. **Testar antes de commitar** - verificar compilação

### Recursos Úteis
- **Configuração ESLint**: `eslint.config.cjs`
- **Documentação TypeScript**: `tsconfig.json`
- **Hooks de commit**: `.husky/pre-commit`
- **Scripts NPM**: `package.json`

---

**Lembre-se**: O ESLint está configurado para ajudar, não atrapalhar. Cada regra tem um propósito específico para melhorar a qualidade do código e prevenir bugs. 🚀
