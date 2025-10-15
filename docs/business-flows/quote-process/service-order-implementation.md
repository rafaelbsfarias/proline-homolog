# Implementação: Ordem de Serviço (OS) para Parceiros

## Data: 09/10/2025
## Objetivo: Gerar ordem de serviço em PDF a partir de orçamentos aprovados

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. **API Endpoint: GET `/api/partner/service-order/[quoteId]`**

**Arquivo**: `app/api/partner/service-order/[quoteId]/route.ts`

**Funcionalidade**:
- Busca dados completos do orçamento aprovado
- Requer autenticação como parceiro
- Valida que o quote pertence ao parceiro
- Valida que o quote está com status `approved`

**Estrutura de Busca**:
1. Busca `quotes` (id, status, partner_id, service_order_id)
2. Busca `service_orders` (vehicle_id, client_id)
3. Busca `vehicles` (dados completos do veículo)
4. Busca `services` (estimated_days)
5. Busca `quote_items` (descrição e quantidade, SEM preços)
6. Busca `partners` + `profiles` (nome da empresa e responsável)
7. Busca `auth.users` (telefone e email do parceiro e cliente)
8. Busca `profiles` (nome completo do cliente)

**Dados Retornados**:
```typescript
{
  ok: true,
  serviceOrder: {
    id: string;
    created_at: string;
    estimated_days: number; // Da tabela 'services'
    status: string;
    vehicle: {
      plate, brand, model, year, color, odometer
    };
    partner: {
      company_name,    // De 'partners'
      contact_name,    // De 'profiles'
      phone            // De 'auth.users'
    };
    client: {
      name,    // De 'profiles'
      phone,   // De 'auth.users'
      email    // De 'auth.users'
    };
    items: Array<{
      id, description, quantity  // SEM unit_price, total_price
    }>;
  }
}
```

**Nota Importante**: 
- Os itens do orçamento **NÃO incluem preços** (unit_price, total_price)
- `estimated_days` vem da tabela `services`, não de `quotes`
- Telefone e email vêm de `auth.users`, não de `profiles`

---

### 2. **Página de Visualização/Impressão: `/dashboard/partner/service-order`**

**Arquivo**: `app/dashboard/partner/service-order/page.tsx`

**Características**:
- ✅ Layout profissional para impressão
- ✅ Responsivo e otimizado para PDF
- ✅ Botão "Imprimir / Baixar PDF" (usa window.print)
- ✅ Esconde botões de ação na impressão (classe `.no-print`)
- ✅ Formatação de cores preservada no PDF
- ✅ Informações organizadas em seções

**Seções do Documento**:

1. **Cabeçalho**:
   - Título: "ORDEM DE SERVIÇO"
   - Número da OS (primeiros 8 caracteres do ID)
   - Data de emissão

2. **Prestador de Serviço** (2 colunas):
   - Empresa
   - Responsável
   - Telefone

3. **Cliente** (2 colunas):
   - Nome
   - Telefone
   - E-mail

4. **Dados do Veículo** (destaque com fundo cinza):
   - Placa, Marca, Modelo
   - Ano, Cor, Quilometragem

5. **Serviços a Serem Realizados** (tabela):
   - Item (numeração)
   - Descrição do Serviço
   - Quantidade
   - **SEM PREÇOS** ✅

6. **Prazo de Conclusão** (destaque amarelo):
   - Dias úteis estimados em formato grande

7. **Assinaturas**:
   - Responsável pelo Serviço
   - Cliente / Autorização

8. **Rodapé**:
   - Data/hora de emissão
   - Texto legal

**CSS para Impressão**:
```css
@media print {
  @page {
    margin: 1cm;
  }
  .no-print {
    display: none !important;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

---

### 3. **Componente DataTable Atualizado**

**Arquivo**: `modules/common/components/shared/DataTable.tsx`

**Mudanças**:
- ✅ Adicionada prop `onDownloadOS?: (item: T) => void`
- ✅ Adicionado botão verde com ícone de download
- ✅ Botão aparece apenas quando `onDownloadOS` é fornecido

**Botão de Download**:
```tsx
<button
  onClick={() => onDownloadOS(row)}
  style={{
    padding: '4px 8px',
    background: '#16a34a', // Verde
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }}
  title="Baixar Ordem de Serviço"
>
  <FaDownload size={14} />
</button>
```

---

### 4. **Dashboard do Parceiro Atualizado**

**Arquivo**: `app/dashboard/PartnerDashboard.tsx`

**Mudanças**:
1. Adicionada função `handleDownloadServiceOrder`:
```typescript
const handleDownloadServiceOrder = (service: InProgressServiceDisplay) => {
  router.push(`/dashboard/partner/service-order?quoteId=${service.id}`);
};
```

2. Tabela "Orçamentos Aprovados" agora tem ações:
```typescript
<DataTable<InProgressServiceDisplay>
  title="Orçamentos Aprovados - Aguardando Execução"
  data={inProgressServices.map(...)}
  columns={inProgressServicesColumns}
  emptyMessage="Nenhum orçamento aprovado aguardando execução."
  showActions={true}  // ← Mudado de false para true
  onDownloadOS={handleDownloadServiceOrder}  // ← Nova prop
/>
```

---

## 🔄 FLUXO COMPLETO

```
1. Parceiro visualiza dashboard
   ↓
2. Seção "Orçamentos Aprovados - Aguardando Execução"
   ↓
3. Para cada orçamento aprovado:
   - Botão verde com ícone de download aparece
   ↓
4. Parceiro clica no botão de download
   ↓
5. Navega para: /dashboard/partner/service-order?quoteId=xxx
   ↓
6. API busca dados do orçamento (sem preços)
   ↓
7. Página exibe documento formatado da OS
   ↓
8. Parceiro clica em "Imprimir / Baixar PDF"
   ↓
9. Dialog de impressão do navegador abre
   ↓
10. Opções:
    - Imprimir → Envia para impressora
    - Salvar como PDF → Gera arquivo PDF local
```

---

## 🎨 VISUAL DA ORDEM DE SERVIÇO

### Desktop/Tela:
- Fundo cinza claro (#f5f5f5)
- Documento branco centralizado (max-width: 900px)
- Botões de ação visíveis no topo
- Sombra suave no documento

### Impressão/PDF:
- Fundo branco
- Margem de 1cm
- Botões escondidos
- Cores preservadas
- Formatação profissional

### Destaques Visuais:
- **Azul (#3498db)**: Títulos e bordas principais
- **Cinza (#ecf0f1)**: Fundo da seção de veículo
- **Amarelo (#fff3cd)**: Destaque do prazo de conclusão
- **Verde (#16a34a)**: Botão de download
- **Preto (#2c3e50, #34495e)**: Textos e cabeçalhos de tabela

---

## 📋 DADOS INCLUÍDOS NA OS

### ✅ Informações Presentes:
- Número da OS
- Data de emissão
- Dados do parceiro (empresa, responsável, telefone)
- Dados do cliente (nome, telefone, e-mail)
- Dados do veículo (placa, marca, modelo, ano, cor, km)
- Lista de serviços (descrição + quantidade)
- Prazo estimado em dias úteis
- Espaço para assinaturas

### ❌ Informações Omitidas (conforme solicitado):
- Preços unitários
- Preços totais
- Valor total do orçamento
- Custos de peças/materiais

---

## 🔒 SEGURANÇA

### Validações Implementadas:
1. ✅ Autenticação obrigatória (withPartnerAuth)
2. ✅ Validação de propriedade (partner_id = req.user.id)
3. ✅ Validação de status (only 'approved')
4. ✅ RLS do Supabase ativo
5. ✅ Logs de auditoria

### Proteções:
- Parceiro só pode acessar suas próprias OS
- Quotes devem estar aprovados
- Dados sensíveis (preços) não aparecem na OS

---

## 🖨️ COMO GERAR PDF

### Opção 1 - Chrome/Edge:
1. Clicar em "Imprimir / Baixar PDF"
2. No dialog de impressão: "Destino" → "Salvar como PDF"
3. Ajustar margens se necessário
4. Clicar em "Salvar"

### Opção 2 - Firefox:
1. Clicar em "Imprimir / Baixar PDF"
2. Selecionar "Microsoft Print to PDF" ou "Salvar como PDF"
3. Salvar arquivo

### Opção 3 - Safari:
1. Clicar em "Imprimir / Baixar PDF"
2. Menu "PDF" → "Salvar como PDF"
3. Escolher local e salvar

---

## 📝 EXEMPLO DE USO

```typescript
// No dashboard do parceiro:
const services = [
  {
    id: 'abc-123',
    vehicle_info: 'Volkswagen Golf (2020)',
    client_name: 'João Silva',
    service_description: 'Manutenção Completa',
    total_value: 'R$ 1.500,00',
    approved_at: '01/10/2025'
  }
];

// Ao clicar no botão verde de download:
handleDownloadServiceOrder(service);
// → Navega para: /dashboard/partner/service-order?quoteId=abc-123
// → API retorna dados sem preços
// → Exibe documento formatado
// → Parceiro pode imprimir ou salvar como PDF
```

---

## 🐛 PROBLEMAS ENCONTRADOS E CORRIGIDOS

### Problema 1: Coluna `estimated_days` não existe em `quotes`
**Erro**: `column quotes.estimated_days does not exist`

**Causa**: A coluna `estimated_days` foi removida de `partner_services` e não existe em `quotes`. Ela está apenas na tabela `services`.

**Solução**: 
- Buscar `estimated_days` da tabela `services` com relacionamento por `quote_id`
- Usar `.maybeSingle()` pois pode não existir registro
- Defaultar para `0` se não houver dados

### Problema 2: Coluna `phone` não existe em `profiles`
**Erro**: `column profiles.phone does not exist`

**Causa**: O campo `phone` não existe na tabela `profiles` nem em `clients`. Ele está apenas em `auth.users`.

**Solução**:
- Buscar telefone de `auth.users` usando `supabase.auth.admin.getUserById()`
- Buscar email também de `auth.users`
- Validar se o telefone não está vazio (`""`)
- Usar `'N/A'` como fallback

### Problema 3: Query complexa com JOINs falhando
**Causa**: Query original tentava fazer múltiplos `!inner()` joins aninhados, o que não funciona bem com as foreign keys.

**Solução**:
- Separar em múltiplas queries simples
- Buscar cada entidade individualmente
- Montar o objeto de resposta no código
- Melhor performance e mais fácil de debugar

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar API endpoint GET /api/partner/service-order/[quoteId]
- [x] Validar autenticação e propriedade
- [x] Buscar dados completos (veículo, cliente, parceiro, itens)
- [x] Excluir preços dos itens
- [x] **CORRIGIDO**: Buscar estimated_days da tabela `services`
- [x] **CORRIGIDO**: Buscar telefone/email de `auth.users`
- [x] **CORRIGIDO**: Simplificar queries (evitar JOINs complexos)
- [x] Criar página de visualização da OS
- [x] Implementar layout profissional
- [x] Adicionar CSS para impressão
- [x] Esconder botões na impressão (.no-print)
- [x] Preservar cores no PDF
- [x] Adicionar botão de download no DataTable
- [x] Integrar com PartnerDashboard
- [x] Testar fluxo completo
- [x] **API TESTADA E FUNCIONANDO** ✅

---

## 🚀 PRÓXIMOS PASSOS (Opcional)

### Melhorias Futuras:
1. **Logo da empresa**: Adicionar logo do parceiro no cabeçalho
2. **Código de barras/QR**: Adicionar QR code com link para rastreamento
3. **Assinatura digital**: Integrar com assinatura eletrônica
4. **Templates customizáveis**: Permitir parceiros personalizarem layout
5. **Histórico de OS**: Salvar versões geradas no banco
6. **E-mail automático**: Enviar OS por e-mail ao cliente
7. **Exportação direta**: Gerar PDF server-side (ex: Puppeteer, jsPDF)

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

1. ✅ `app/api/partner/service-order/[quoteId]/route.ts` (NOVO)
2. ✅ `app/dashboard/partner/service-order/page.tsx` (NOVO)
3. ✅ `modules/common/components/shared/DataTable.tsx` (MODIFICADO)
4. ✅ `app/dashboard/PartnerDashboard.tsx` (MODIFICADO)
5. ✅ `docs/SERVICE_ORDER_IMPLEMENTATION.md` (ESTE ARQUIVO)

---

## 🎯 CONCLUSÃO

**Implementação completa e funcional** de geração de Ordem de Serviço para parceiros:

- ✅ Documento profissional e bem formatado
- ✅ Sem preços (conforme solicitado)
- ✅ Prazo de conclusão em destaque
- ✅ Fácil de imprimir ou salvar como PDF
- ✅ Seguro e validado
- ✅ Integrado ao dashboard do parceiro

**A funcionalidade está pronta para uso em produção!** 🚀
