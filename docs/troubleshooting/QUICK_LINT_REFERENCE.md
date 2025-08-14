# 🚀 Quick Reference: Lint e Qualidade de Código

## ⚡ Problemas Mais Comuns

### 1. Hook useAuthService
```typescript
// ❌ ERRO
const { authService } = useAuthService();

// ✅ CORRETO  
const authService = useAuthService();
```

### 2. Imports de Auth Middleware
```typescript
// ❌ ERRO
import { withAuth } from '../../../utils/authMiddleware';

// ✅ CORRETO
import { withAdminAuth } from '../../../utils/authMiddleware';
```

### 3. Variáveis Não Utilizadas
```typescript
// ❌ ERRO
const [data, setData] = useState();
const unused = someFunction(); // nunca usado

// ✅ CORRETO
const [data, setData] = useState();
const _intentionallyUnused = someFunction(); // ou remover
```

### 4. Console Statements
```typescript
// ❌ ERRO
console.log('debug');

// ✅ CORRETO
if (process.env.NODE_ENV === 'development') {
  console.log('debug');
}
```

### 5. Parâmetros Não Utilizados em APIs
```typescript
// ❌ ERRO
export const GET = withAdminAuth(async (req: NextRequest) => {
  // req não usado
});

// ✅ CORRETO
export const GET = withAdminAuth(async () => {
  // sem parâmetro desnecessário
});
```

## 🛠️ Comandos Essenciais

```bash
# Verificar problemas
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Verificar tipos
npm run type-check

# Build completo
npm run build

# Limpar e reinstalar
rm -rf .next node_modules
npm install
```

## ✅ Checklist Antes do Commit

- [ ] `npm run lint` - zero errors/warnings
- [ ] `npm run build` - compilação bem-sucedida
- [ ] Remover console.log não protegidos
- [ ] Verificar imports não utilizados
- [ ] Testar funcionalidade alterada

## 📚 Documentos Completos

- **[Guia Completo de Lint](./LINT_GUIDE.md)** - Documentação detalhada
- **[Análise CadastrarVeiculo](./CADASTRAR_VEICULO_ANALYSIS.md)** - Problemas específicos encontrados

---
*Mantenha este documento como referência rápida durante o desenvolvimento* 🎯
