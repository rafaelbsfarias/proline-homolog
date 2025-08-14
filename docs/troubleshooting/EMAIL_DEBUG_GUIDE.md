### Como investigar o problema do email

Agora que adicionamos a variável `NEXT_PUBLIC_SITE_URL=http://localhost:3000` no `.env.local`, vamos
verificar se o email está funcionando:

## 1. Passos para testar manualmente:

1. **Reinicie o servidor da aplicação** (para carregar a nova variável de ambiente):

   ```bash
   # Pare o servidor (Ctrl+C se estiver rodando)
   npm run dev
   ```

2. **Execute o teste de aprovação novamente**:

   ```bash
   npx cypress run --spec "cypress/e2e/teste-aprovacao-email.cy.ts" --browser electron
   ```

3. **Verifique os logs no terminal** do servidor Next.js para ver se há erros relacionados ao envio
   de email.

## 2. Possíveis problemas:

### A. Edge Functions não estão rodando

- As Edge Functions do Supabase precisam estar deployadas
- Verifique no painel do Supabase se a função `send-approval-email` está ativa

### B. Configuração do Resend

- Verifique se a chave `RESEND_API_KEY` está correta
- Teste se o domínio está verificado no Resend

### C. Fallback não está funcionando

- Se a Edge Function falhar, o código usa um fallback
- Verifique os logs para ver qual caminho está sendo usado

## 3. Para debugar melhor:

Abra as **DevTools** do navegador durante a aprovação manual e vá em:

- **Network tab** → procure pela requisição `/api/admin/approve-registration`
- **Console tab** → procure por erros de JavaScript
- Veja a resposta da API para verificar se `emailSent: true`

## 4. Teste manual direto:

1. Crie um usuário manualmente no cadastro
2. Logue como admin
3. Vá em `/admin/pendentes`
4. Aprove o usuário
5. Abra as DevTools e veja a resposta da API

A resposta deve ser algo como:

```json
{
  "success": true,
  "message": "Cadastro aprovado com sucesso!",
  "emailSent": true,
  "confirmationTokenSent": false
}
```

Se `emailSent` for `false`, o problema está no serviço de email.
