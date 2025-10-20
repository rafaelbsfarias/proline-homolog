# Fix: 404 ao Clicar em "Ver Detalhes Completos" (Admin)

## Data
19 de Outubro de 2025

## Problema
Quando o **administrador** acessa a página de visão geral do cliente (`/admin/clients/[id]/overview`), clica em "Detalhes" de um veículo e depois clica em "Ver Detalhes Completos" no modal, recebia erro **404**.

## Causa Raiz
O componente `ClientVehiclesCard` estava tentando navegar para uma rota inexistente:

```tsx
// ❌ ANTES - rota inexistente
onNavigateToDetails={id => router.push(`/dashboard/admin/vehicle/${id}`)}
```

A rota `/dashboard/admin/vehicle/[id]` **não existe** no projeto.

## Rota Correta
A rota unificada de detalhes do veículo é:
```
/dashboard/vehicle/[vehicleId]
```

Esta rota funciona para todos os papéis:
- ✅ Cliente
- ✅ Especialista  
- ✅ Admin
- ✅ Parceiro

## Solução Implementada

### Arquivo Modificado
**`/modules/admin/components/overview/ClientVehiclesCard.tsx`**

### Mudança Aplicada
```tsx
// ✅ DEPOIS - rota correta
onNavigateToDetails={id => router.push(`/dashboard/vehicle/${id}`)}
```

### Linha Modificada
**Linha 138**: Alterada a rota de navegação no prop `onNavigateToDetails` do `VehicleDetailsModal`

## Contexto do Fluxo

### Fluxo Admin → Detalhes do Veículo

1. **Admin** faz login
2. Acessa **Dashboard Admin**
3. Clica em um **Cliente** na lista
4. Navega para `/admin/clients/[id]/overview` ✅
5. Visualiza seção **"Veículos — {Nome do Cliente}"** (componente `ClientVehiclesCard`)
6. Clica no botão **"Detalhes"** de um veículo
7. Abre o **modal** `VehicleDetailsModal` ✅
8. Clica em **"Ver Detalhes Completos"**
9. ✅ **CORRIGIDO**: Navega para `/dashboard/vehicle/${vehicleId}` (antes: 404)

## Rotas Envolvidas

### Rota da Página Overview do Cliente (Admin)
```
/admin/clients/[id]/overview
```
- **Componente**: `Page` em `/app/admin/clients/[id]/overview/page.tsx`
- **Usa**: `ClientVehiclesCard`

### Rota de Destino (Detalhes do Veículo)
```
/dashboard/vehicle/[vehicleId]
```
- **Componente**: `UnifiedVehicleDetailsPage` em `/app/dashboard/vehicle/[vehicleId]/page.tsx`
- **Funciona para**: Todos os papéis (client, specialist, admin, partner)
- **Detecta papel**: Via `user.user_metadata.role`
- **Hook**: `useVehicleDetails(role, vehicleId)`

## Componentes Relacionados

### `ClientVehiclesCard.tsx` ✅ Corrigido
- **Localização**: `/modules/admin/components/overview/ClientVehiclesCard.tsx`
- **Uso**: Exibe lista de veículos do cliente na visão geral do admin
- **Modal usado**: `VehicleDetailsModal`
- **Navegação**: Agora usa rota correta `/dashboard/vehicle/${id}`

### `VehicleDetailsModal.tsx`
- **Localização**: `/modules/vehicles/components/VehicleDetailsModal.tsx`
- **Prop chave**: `onNavigateToDetails?: (vehicleId: string) => void`
- **Comportamento**: Executa a função passada quando clica em "Ver Detalhes Completos"

## Verificação da Correção

### Como Testar

1. **Login como Admin**:
   ```
   Email: admin@prolineauto.com.br
   ```

2. **Navegar para cliente**:
   - Dashboard Admin → Clientes
   - Clicar em qualquer cliente
   - URL: `/admin/clients/{clientId}/overview`

3. **Abrir modal de veículo**:
   - Rolar até seção "Veículos — {Nome Cliente}"
   - Clicar em **"Detalhes"** de qualquer veículo
   - Modal abre ✅

4. **Navegar para detalhes completos**:
   - Clicar em **"Ver Detalhes Completos"**
   - ✅ Deve navegar para `/dashboard/vehicle/{vehicleId}`
   - ❌ **ANTES**: 404 Not Found

### Resultado Esperado
- ✅ Página de detalhes do veículo carrega corretamente
- ✅ Mostra informações completas: dados, inspeção, evidências
- ✅ Header do admin continua visível
- ✅ Papel detectado corretamente como "admin"

## Impacto

### ✅ Resolvido
- Admin consegue visualizar detalhes completos do veículo
- Navegação fluida da visão geral → detalhes
- Experiência consistente entre papéis

### ✅ Não Afetado
- Outros papéis (cliente, especialista) já funcionavam
- Modal continua abrindo normalmente
- Filtros e paginação não afetados

## Arquivos do Fluxo

### Páginas
1. `/app/admin/clients/[id]/overview/page.tsx` - Overview do cliente (admin)
2. `/app/dashboard/vehicle/[vehicleId]/page.tsx` - Detalhes do veículo (unificado)

### Componentes
1. `/modules/admin/components/overview/ClientVehiclesCard.tsx` ✅ **CORRIGIDO**
2. `/modules/vehicles/components/VehicleDetailsModal.tsx` - Modal de detalhes
3. `/modules/vehicles/components/VehicleDetails.tsx` - Componente de detalhes

### Hooks
1. `/modules/admin/hooks/useAdminClientVehicles.ts` - Busca veículos do cliente
2. `/modules/vehicles/hooks/useVehicleDetails.ts` - Busca detalhes completos

## Notas Técnicas

### Por que não criar rota específica `/dashboard/admin/vehicle/[id]`?
- ✅ **Reutilização**: Rota unificada serve todos os papéis
- ✅ **Manutenção**: Menos código duplicado
- ✅ **Consistência**: Mesma página para todos
- ✅ **Detecção automática**: Hook detecta papel via `user.user_metadata.role`

### Diferença entre rotas antigas
```tsx
// ❌ Não existente
/dashboard/admin/vehicle/${id}

// ✅ Correta (unificada)
/dashboard/vehicle/${id}
```

### Padrão de parâmetro
- Nome do parâmetro: `vehicleId` (não `id`)
- Pasta da rota: `vehicle/[vehicleId]/page.tsx`
- Acesso no código: `params.vehicleId`

## Commit Message Sugerida
```
fix(admin): corrige navegação 404 ao clicar em Ver Detalhes Completos

- Altera rota de /dashboard/admin/vehicle/${id} para /dashboard/vehicle/${id}
- ClientVehiclesCard agora usa rota unificada de detalhes
- Corrige erro 404 ao admin visualizar detalhes completos do veículo
```

## Tags
`bug-fix` `admin` `vehicle-details` `404-error` `navigation`
