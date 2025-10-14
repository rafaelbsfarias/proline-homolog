# Riscos, Trade-offs e Mitigações

## Riscos Principais

- Inconsistências entre legado e novo modelo (divergência por `item_key`).
- Erros ao filtrar por `partner_id` em tabelas que não o suportam (mecânica).
- Regressão na visualização de evidências (mídias inválidas ou lentidão).
- Sobrecarga no storage por evidências duplicadas durante shadow-write.

## Mitigações

- Tabela de mapeamento de `item_key` legado ➜ template atual por categoria.
- Feature flags para ativar novo modelo por grupo/cliente.
- View `vw_partner_checklist_summary` para validação rápida de contagens.
- Policies de lifecycle no bucket para expirar objetos órfãos.

## Planos de Contingência

- Rollback para leitura do legado se detecção de inconsistência > X% por checklist.
- Congelar novas submissões enquanto reconcilia diferenças (janela curta).
