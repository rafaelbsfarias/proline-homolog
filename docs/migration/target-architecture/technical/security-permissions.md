# Segurança e Permissões — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

Este documento define os papéis, permissões e mecanismos de segurança para suportar o fluxo completo:
criação/edição/submissão de checklists por parceiro com isolamento, anexos de evidências,
solicitações de peças por item, e visualização somente leitura para administradores/clientes/especialistas.

## Papéis (Roles)

- `partner`: colaboradores de parceiros; atuam somente nos seus dados.
- `admin`: equipe interna com acesso total (leitura/escrita, inclusive reabrir checklist).
- `customer`: cliente final, leitura somente.
- `specialist`: analista/consultor, leitura somente.

## Matriz de Acesso

| Recurso | Partner | Admin | Customer | Specialist |
|---------|---------|-------|----------|------------|
| Criar/editar/submeter checklist próprio | ✅ Permitido | ✅ Permitido (com auditoria) | ❌ Negado | ❌ Negado |
| Ver checklists de outros parceiros | ❌ Negado | ✅ Permitido | ✅ Permitido (somente leitura) | ✅ Permitido (somente leitura) |
| Ver própria visualização de leitura | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| Reabrir checklist submetido | ❌ Negado | ✅ Permitido (com auditoria) | ❌ Negado | ❌ Negado |
| Editar checklist de outros parceiros | ❌ Negado | ✅ Permitido (com auditoria) | ❌ Negado | ❌ Negado |

## Isolamento por Escopo

- Toda consulta/gravação em endpoints de parceiro aplica filtro por:
  `(partner_id, vehicle_id, context_type, context_id, category)`.
- `partner_id` deve ser obtido do token; se enviado no payload, deve ser ignorado/substituído pelo
  do token.

## Autorização e Validações

- Verificar se o parceiro tem vínculo com o `vehicle_id` e com o `context` antes de criar/carregar.
- Em submissão, verificar propriedade do checklist.
- Em visualização pública, validar que o `partner_id` consultado existe para os parâmetros.

## Auditoria

- Registrar `created_by/updated_by`, `submitted_by`, timestamps e IP/agent.
- Logar eventos-chave (save, submit, reopen) em trilhas de auditoria.

## Proteção de Mídia

- Upload via URLs assinadas com tempo limitado; armazenar apenas `media_url` público/assinado.
- Opcional: varredura antivírus/heurística em backend/bucket.
- Controle de tamanho e tipos permitidos.

## Rate Limiting e Anti-abuso

- Limitar `/save` por checklist e IP (ex.: 30 req/min).
- Limitar `/upload` por usuário (ex.: 60 req/min) e tamanho por arquivo.

## Erros e Mensagens

- Evitar detalhamento excessivo em mensagens de erro de autorização.
- Retornar `403` sem indicar existência do recurso quando o acesso é negado.

## Considerações de Multi-tenancy

- Se houver multi-organização, incluir `org_id` no filtro e token.
- Segregar buckets de mídia por organização/parceiro quando apropriado.

## Implementação Técnica

### Middlewares de Autenticação/Autorização

```typescript
// Middleware para validar autenticação e papel
const authMiddleware = (requiredRole: string) => {
  return async (req: NextRequest) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED_ERROR', message: 'Token de autenticação obrigatório' } },
        { status: 401 }
      );
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.headers.set('user', JSON.stringify(decoded));
      
      if (requiredRole && decoded.role !== requiredRole) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN_ERROR', message: 'Acesso negado' } },
          { status: 403 }
        );
      }
      
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED_ERROR', message: 'Token inválido' } },
        { status: 401 }
      );
    }
  };
};
```

### RLS Policies (Row Level Security)

```sql
-- Política para partner_checklists
CREATE POLICY "Partners can view their own checklists" ON partner_checklists
FOR SELECT TO authenticated
USING (
  auth.uid() = partner_id
);

CREATE POLICY "Partners can insert their own checklists" ON partner_checklists
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = partner_id
);

CREATE POLICY "Partners can update their own checklists" ON partner_checklists
FOR UPDATE TO authenticated
USING (
  auth.uid() = partner_id
)
WITH CHECK (
  auth.uid() = partner_id AND status != 'submitted'
);

-- Política para visualização pública (admin/customer/specialist)
CREATE POLICY "Public view of partner checklists" ON partner_checklists
FOR SELECT TO authenticated
USING (
  status = 'submitted' AND 
  (auth.jwt()->>'role' IN ('admin', 'customer', 'specialist'))
);
```

### Validação de Propriedade

```typescript
// Função para validar propriedade do checklist
const validateChecklistOwnership = async (supabase: SupabaseClient, checklistId: string, partnerId: string) => {
  const { data, error } = await supabase
    .from('partner_checklists')
    .select('id')
    .eq('id', checklistId)
    .eq('partner_id', partnerId)
    .single();
    
  if (error || !data) {
    throw new Error('Checklist não encontrado ou acesso negado');
  }
  
  return true;
};
```

### Auditoria de Ações

```typescript
// Função para registrar ações de auditoria
const logAuditEvent = async (
  supabase: SupabaseClient,
  action: string,
  entityId: string,
  entityType: string,
  userId: string,
  metadata?: Record<string, any>
) => {
  await supabase.from('audit_log').insert({
    action,
    entity_id: entityId,
    entity_type: entityType,
    user_id: userId,
    ip_address: metadata?.ip || 'unknown',
    user_agent: metadata?.userAgent || 'unknown',
    metadata
  });
};
```

## Boas Práticas de Segurança

### 1. Validação de Entrada
- Usar Zod schemas para validar todos os payloads de entrada
- Sanitizar dados de entrada para prevenir XSS
- Validar tipos de mídia permitidos nos uploads

### 2. Gerenciamento de Sessão
- Tokens JWT com tempo de expiração adequado
- Renovação automática de tokens quando necessário
- Invalidação de sessões em logout

### 3. Criptografia
- Dados sensíveis criptografados em repouso
- Comunicação HTTPS obrigatória
- Chaves de criptografia gerenciadas de forma segura

### 4. Monitoramento
- Logs estruturados de todas as operações
- Alertas para atividades suspeitas
- Métricas de segurança em dashboards

### 5. Testes de Segurança
- Testes de penetração regulares
- Análise de vulnerabilidades automatizada
- Revisão de código focada em segurança