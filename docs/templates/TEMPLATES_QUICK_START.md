# 🚀 Sistema de Templates Dinâmicos - Guia Rápido

## 📍 O que é?

Sistema que permite criar checklists personalizados por categoria de parceiro sem alterar código. Administradores podem adicionar/remover itens diretamente no banco de dados.

## ✨ Características

- ✅ **6 categorias suportadas:** Mecânica, Funilaria/Pintura, Lavagem, Pneus, Loja, Pátio Atacado
- ✅ **97 itens** distribuídos em **26 seções**
- ✅ **Versionamento preparado** (aguardando admin UI)
- ✅ **Renderização dinâmica** baseada em templates
- ✅ **Isolamento por categoria** - cada parceiro vê apenas seus itens

## 🎯 Como Usar

### Para Parceiros

1. Acesse o dashboard como parceiro
2. Clique em um veículo para iniciar vistoria
3. O sistema carrega automaticamente o checklist da sua categoria
4. Preencha os campos (OK/NOK/NA + observações)
5. Adicione fotos onde permitido
6. Envie o formulário

**URLs:**
- Nova versão (dinâmica): `/dashboard/partner/checklist-v2?vehicleId=XXX`
- Versão antiga: `/dashboard/partner/checklist?vehicleId=XXX` (será substituída)

### Para Desenvolvedores

#### Usar o Hook

```typescript
import { useChecklistTemplate } from '@/modules/partner/hooks/useChecklistTemplate';

function MyComponent() {
  const { template, loading, error, category } = useChecklistTemplate(
    vehicleId,
    quoteId // opcional
  );

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      <h1>{template.title}</h1>
      {template.sections.map(section => (
        <Section key={section.section} data={section} />
      ))}
    </div>
  );
}
```

#### Usar o Componente Pronto

```typescript
import { DynamicChecklistForm } from '@/modules/partner/components/checklist/DynamicChecklistForm';

function ChecklistPage() {
  const handleSubmit = async (formData) => {
    await saveChecklist(formData);
  };

  return (
    <DynamicChecklistForm
      vehicleId={vehicleId}
      quoteId={quoteId}
      onSubmit={handleSubmit}
    />
  );
}
```

## 🧪 Testes

### Teste Automatizado

```bash
# Valida que todos os 6 templates estão funcionando
node scripts/test-init-template.cjs
```

**Output esperado:**
```
✅ Template encontrado: Checklist Mecânica Padrão (25 itens, 7 seções)
✅ Template encontrado: Checklist Funilaria e Pintura (16 itens, 3 seções)
✅ Template encontrado: Checklist Lavagem (14 itens, 3 seções)
✅ Template encontrado: Checklist Pneus (14 itens, 4 seções)
✅ Template encontrado: Checklist Loja (9 itens, 3 seções)
✅ Template encontrado: Checklist Pátio Atacado (19 itens, 6 seções)
```

### Teste Manual - Browser

1. **Login:**
   - Email: `mecanica@parceiro.com`
   - Senha: `123qwe`

2. **Acessar:**
   ```
   http://localhost:3000/dashboard/partner/checklist-v2?vehicleId=<UUID>
   ```

3. **Verificar:**
   - Template correto carregado
   - Seções e itens visíveis
   - Campos obrigatórios marcados com *
   - Hints de foto presentes

### Teste de API

```bash
# Listar todos os templates
curl http://localhost:3000/api/partner/checklist/templates

# Buscar template específico
curl http://localhost:3000/api/partner/checklist/templates/mecanica

# Buscar template + iniciar sessão
curl -X POST http://localhost:3000/api/partner/checklist/init \
  -H "Content-Type: application/json" \
  -d '{"vehicleId": "UUID", "quoteId": "UUID"}'
```

## 📊 Estrutura dos Dados

### Template

```typescript
{
  id: string;
  title: string;
  category: string;
  version: string;
  is_active: boolean;
  sections: [
    {
      section: string;        // ex: "motor", "brakes"
      items: [
        {
          id: string;
          item_key: string;   // ex: "motor_condition"
          label: string;      // ex: "Condição Geral do Motor"
          description?: string;
          section: string;
          subsection?: string;
          position: number;
          is_required: boolean;
          allows_photos: boolean;
          max_photos: number;
          help_text?: string;
        }
      ]
    }
  ]
}
```

### Form Data (Submit)

```typescript
{
  vehicleId: string;
  quoteId?: string;
  templateId: string;
  checklistData: {
    [item_key: string]: "ok" | "nok" | "na";
    [item_key_notes: string]: string;
  }
}
```

## 🗂️ Categorias e Templates

| Categoria | Nome Normalizado | Template | Itens | Seções |
|-----------|------------------|----------|-------|--------|
| Mecânica | `mecanica` | Checklist Mecânica Padrão | 25 | 7 |
| Funilaria/Pintura | `funilaria_pintura` | Checklist Funilaria e Pintura | 16 | 3 |
| Lavagem | `lavagem` | Checklist Lavagem | 14 | 3 |
| Pneus | `pneus` | Checklist Pneus | 14 | 4 |
| Loja | `loja` | Checklist Loja | 9 | 3 |
| Pátio Atacado | `patio_atacado` | Checklist Pátio Atacado | 19 | 6 |

## 🔧 Administração (Futuro)

### Adicionar Item ao Template

```sql
-- Adicionar novo item ao template de mecânica
INSERT INTO checklist_template_items (
  template_id,
  item_key,
  label,
  description,
  section,
  subsection,
  position,
  is_required,
  allows_photos,
  max_photos
) VALUES (
  (SELECT id FROM checklist_templates WHERE category = 'mecanica' AND is_active = true),
  'new_item_key',
  'Nome do Item',
  'Descrição detalhada',
  'motor',
  'geral',
  99,
  false,
  true,
  3
);
```

### Criar Nova Versão

```sql
-- 1. Copiar template existente
INSERT INTO checklist_templates (category, title, version, is_active)
SELECT category, title, '2.0', true
FROM checklist_templates
WHERE category = 'mecanica' AND version = '1.0';

-- 2. Desativar versão antiga
UPDATE checklist_templates
SET is_active = false
WHERE category = 'mecanica' AND version = '1.0';

-- 3. Copiar itens
INSERT INTO checklist_template_items (...)
SELECT ... FROM checklist_template_items
WHERE template_id = (versão antiga);

-- 4. Modificar itens conforme necessário
UPDATE checklist_template_items SET ...;
```

## 📚 Documentação Completa

- [Relatório Final - Integração Dinâmica](./PHASE_2_INTEGRATION_FINAL_REPORT.md)
- [Fase 2 - Progresso dos Templates](./PHASE_2_TEMPLATES_PROGRESS.md)
- [Fase 2 - Integração Dinâmica](./PHASE_2_DYNAMIC_INTEGRATION.md)
- [Status Geral da Migração](../@docs/MIGRATION_STATUS.md)

## 🐛 Troubleshooting

### Template não carregado

```bash
# Verificar se template existe
psql -c "SELECT * FROM checklist_templates WHERE category = 'mecanica' AND is_active = true;"

# Verificar itens
psql -c "SELECT COUNT(*) FROM checklist_template_items WHERE template_id = 'UUID';"
```

### Categoria não normalizada

```sql
-- Ver mapeamento de categorias
SELECT 
  category,
  lower(
    replace(
      replace(
        normalize(category, NFD),
        '//', '_'
      ),
      ' ', '_'
    )
  ) as normalized
FROM partners
GROUP BY category;
```

### Recriar templates

```bash
# Re-executar migrations
psql < supabase/migrations/20251014191601_create_checklist_templates_system.sql
psql < supabase/migrations/20251014192438_populate_remaining_templates.sql
```

## 💡 Dicas

1. **Performance:** Templates são cacheados no cliente via React state
2. **SEO:** Páginas de checklist não precisam de SEO (autenticadas)
3. **Acessibilidade:** Campos obrigatórios têm `required` HTML nativo
4. **Mobile:** Interface responsiva com TailwindCSS
5. **Offline:** Considerar PWA para checklists offline (futuro)

---

**Status:** ✅ Sistema operacional e testado  
**Versão:** 1.0  
**Última atualização:** 14 de Outubro de 2025
