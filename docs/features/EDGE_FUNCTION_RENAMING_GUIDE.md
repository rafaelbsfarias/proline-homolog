# Renomeação da Edge Function

## ✅ Alterações Realizadas

A Edge Function foi renomeada de `send-welcome-email` para `send-specialist-welcome` para melhor
refletir sua funcionalidade específica.

### Arquivos Atualizados:

1. **Diretório da Edge Function:**
   - `supabase/functions/send-welcome-email/` → `supabase/functions/send-specialist-welcome/`

2. **Documentação:**
   - `supabase/functions/README.md` - URLs e nomes atualizados
   - `EDGE_FUNCTIONS_SETUP.md` - Comandos de deploy atualizados

3. **API:**
   - `app/api/admin/create-user-with-email/route.ts` - URL da Edge Function atualizada

4. **Testes:**
   - `cypress/e2e/edge-functions.cy.ts` - Interceptação atualizada

### Comandos Atualizados:

**Deploy:**

```bash
supabase functions deploy send-specialist-welcome
```

**URL da Edge Function:**

```
${SUPABASE_URL}/functions/v1/send-specialist-welcome
```

**Logs:**

```
Dashboard Supabase > Functions > send-specialist-welcome
```

## 🎯 Próximos Passos:

1. **Deploy da função com novo nome:**

   ```bash
   supabase functions deploy send-specialist-welcome
   ```

2. **Testar a nova função** no dashboard admin

3. **Verificar logs** no painel do Supabase com o novo nome

## ✅ Verificação:

- ✅ Diretório renomeado
- ✅ Arquivos de documentação atualizados
- ✅ API atualizada para usar novo endpoint
- ✅ Testes atualizados
- ✅ URLs atualizadas em todos os arquivos

A renomeação foi concluída com sucesso! Todos os arquivos agora referenciam
`send-specialist-welcome`.
