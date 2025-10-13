# Listagem de Serviços do Parceiro - Admin Overview

## 📍 Localização
**Página:** `/dashboard/admin/partner-overview`  
**Query Param:** `?partnerId={uuid}`

## ✅ Funcionalidades Implementadas

### 1. Listagem de Serviços
A página exibe todos os serviços cadastrados pelo parceiro em uma tabela completa.

**Componente:** `ServicesTable`  
**Localização:** `modules/admin/partner-overview/components/ServicesTable.tsx`

### 2. Colunas da Tabela
| Coluna | Descrição | Formato |
|--------|-----------|---------|
| **Nome** | Nome do serviço | Texto em negrito |
| **Descrição** | Descrição detalhada | Truncado com ellipsis (max 300px) |
| **Preço** | Valor do serviço | R$ X.XXX,XX (formato pt-BR) |
| **Status** | Ativo/Inativo | Badge verde/vermelho |
| **Cadastrado em** | Data de criação | dd/mm/aaaa |
| **Ações** | Botão ativar/desativar | Botão verde/vermelho |

### 3. Filtros Disponíveis

#### Busca por Nome
- Input de texto
- Busca em tempo real
- Placeholder: "Buscar por nome..."

#### Filtro de Status
- Select dropdown
- Opções:
  - **Todos** - Exibe todos os serviços
  - **Ativos** - Apenas serviços com `is_active = true`
  - **Inativos** - Apenas serviços com `is_active = false`

### 4. Ações do Admin

#### Ativar/Desativar Serviço
- **Endpoint:** `PATCH /api/admin/partners/[partnerId]/services/[serviceId]`
- **Body:** `{ "is_active": boolean }`
- **Feedback:** Reload automático após sucesso
- **Visual:**
  - Serviço ativo → Botão vermelho "Desativar"
  - Serviço inativo → Botão verde "Ativar"

## 🔄 Fluxo de Dados

```
usePartnerData Hook
    ↓
GET /api/admin/partners/[partnerId]/services
    ↓
partner_services table
    ↓
SELECT id, name, description, price, is_active, created_at
WHERE partner_id = [partnerId]
ORDER BY created_at DESC
    ↓
useServiceFilters Hook (client-side filtering)
    ↓
ServicesTable Component (renderização)
```

## 🎨 Estilos

**Módulo CSS:** `ServicesTable.module.css`

**Características:**
- Design consistente com o resto do dashboard
- Tabela responsiva com scroll horizontal
- Hover effect nas linhas
- Status badges coloridos
- Botões com transições suaves

## 📊 Estrutura de Dados

### Service Type
```typescript
interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active: boolean;
  created_at: string;
}
```

### API Response
```typescript
{
  services: Service[]
}
```

## 🔒 Segurança

- ✅ Requer autenticação de admin (`withAdminAuth` middleware)
- ✅ Token JWT via Authorization header
- ✅ Validação de `partnerId` no backend
- ✅ RLS policies aplicadas no Supabase

## 🧪 Casos de Uso

### Caso 1: Admin visualiza serviços de um parceiro
1. Navega para `/dashboard/admin/partner-overview?partnerId={uuid}`
2. Vê seção "Serviços" com tabela completa
3. Pode filtrar por nome ou status
4. Vê quantidade de serviços no total

### Caso 2: Admin desativa serviço temporariamente
1. Identifica serviço na tabela
2. Clica em "Desativar" (botão vermelho)
3. Sistema chama API PATCH
4. Status muda para "Inativo" (badge vermelho)
5. Botão muda para "Ativar" (verde)

### Caso 3: Parceiro não tem serviços cadastrados
1. API retorna array vazio
2. Tabela exibe: "Nenhum serviço encontrado."
3. Filtros permanecem disponíveis

### Caso 4: Busca por nome
1. Admin digita "Limpeza"
2. Tabela filtra em tempo real
3. Mostra apenas serviços com "Limpeza" no nome
4. Mantém filtro de status aplicado

## 📝 Estado Atual

**Status:** ✅ **IMPLEMENTADO E FUNCIONAL**

**Última Verificação:** 13/10/2025

**Componentes:**
- ✅ ServicesTable.tsx
- ✅ usePartnerData.ts
- ✅ useServiceFilters.ts
- ✅ ServicesTable.module.css
- ✅ /api/admin/partners/[partnerId]/services/route.ts
- ✅ /api/admin/partners/[partnerId]/services/[serviceId]/route.ts

**Testes Sugeridos:**
- [ ] Verificar listagem com múltiplos serviços
- [ ] Testar filtro de busca por nome
- [ ] Testar filtro de status (ativos/inativos/todos)
- [ ] Testar toggle de ativação/desativação
- [ ] Verificar formatação de preços
- [ ] Testar caso sem serviços cadastrados
- [ ] Verificar responsividade da tabela
- [ ] Testar feedback de loading

## 🚀 Melhorias Futuras (Opcional)

1. **Paginação** - Para parceiros com muitos serviços
2. **Edição inline** - Editar preço/descrição direto na tabela
3. **Exclusão de serviço** - Soft delete com confirmação
4. **Ordenação** - Clicar em colunas para ordenar
5. **Exportação** - Baixar lista em CSV/PDF
6. **Histórico de preços** - Rastrear mudanças de valores
7. **Bulk actions** - Ativar/desativar múltiplos serviços

## 🔗 Referências

**Arquivos Relacionados:**
- `app/dashboard/admin/partner-overview/page.tsx` (linha 263)
- `modules/admin/partner-overview/components/ServicesTable.tsx`
- `modules/admin/partner-overview/hooks/usePartnerData.ts`
- `modules/admin/partner-overview/hooks/useServiceFilters.ts`
- `modules/admin/partner-overview/types.ts`
- `app/api/admin/partners/[partnerId]/services/route.ts`

**Documentação Relacionada:**
- `docs/admin-client-dashboard.md`
- `docs/partner-services-architecture.md`
