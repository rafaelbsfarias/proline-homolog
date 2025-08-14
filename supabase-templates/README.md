# Templates de Email Supabase - ProlineAuto

Este diretório contém templates de email profissionais para o sistema de autenticação do Supabase.

## 🚨 PROBLEMA IDENTIFICADO - Links Não Funcionam

O email está chegando com o design correto, mas **SEM LINKS FUNCIONAIS**. Isso indica um problema
com as variáveis do template no Supabase.

## � Versões de Template Disponíveis

### Versão 1 (Original)

- `magic-link-template.html` e `magic-link-template.txt`
- Usa sintaxe: `{{ .ConfirmationURL }}`

### Versão 2 (Sem espaços)

- `magic-link-v2.html` e `magic-link-v2.txt`
- Usa sintaxe: `{{.ConfirmationURL}}`

### Versão 3 (URL Manual)

- `magic-link-v3.html` e `magic-link-v3.txt`
- Usa sintaxe: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`

## 🔧 Como Testar as Versões

1. **Vá para o Painel do Supabase**
   - Dashboard > Authentication > Email Templates

2. **Selecione "Invite user"**

3. **Teste cada versão:**

   **VERSÃO 1** (Teste primeiro):

   ```html
   <!-- Cole o conteúdo de magic-link-template.html -->
   ```

   **VERSÃO 2** (Se v1 não funcionar):

   ```html
   <!-- Cole o conteúdo de magic-link-v2.html -->
   ```

   **VERSÃO 3** (Se v1 e v2 não funcionarem):

   ```html
   <!-- Cole o conteúdo de magic-link-v3.html -->
   ```

## 🧪 Como Testar

1. **Salve o template** no Supabase
2. **Execute o teste Cypress:**
   ```bash
   npx cypress run --spec cypress/e2e/especialista.cy.ts
   ```
3. **Verifique o email** que chegar
4. **Teste se o link funciona**

## ✅ Checklist de Configuração

- [ ] Template HTML configurado no Supabase
- [ ] Template de texto configurado no Supabase
- [ ] Subject line configurado: "Bem-vindo ao ProlineAuto"
- [ ] Links funcionando corretamente
- [ ] Redirecionamento para página de definição de senha
- [ ] Design responsivo funcionando

## � Próximos Passos

1. **Teste a Versão 1** primeiro (mais simples)
2. Se não funcionar, **teste a Versão 2** (sem espaços)
3. Se ainda não funcionar, **teste a Versão 3** (URL manual)
4. **Confirme** que o link redireciona para a página correta de definição de senha

## 📞 Suporte

Se nenhuma versão funcionar, verifique:

- Configuração do Site URL no Supabase
- Configuração do Redirect URLs
- Se o ambiente de desenvolvimento está acessível para o Supabase
