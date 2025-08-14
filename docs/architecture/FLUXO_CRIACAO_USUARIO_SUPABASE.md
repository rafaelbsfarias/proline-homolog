# Documentação: Fluxo de Criação de Usuário via Supabase (Magic Link)

## Caminho Padrão (Supabase)

- O endpoint `/api/admin/create-user` utiliza o método `inviteUserByEmail` do Supabase Auth Admin.
- O usuário recebe um e-mail automático do Supabase com um link para definir a senha (magic link).
- O usuário é criado como pendente até aceitar o convite.
- Limitações: sujeito a rate limit de e-mails do Supabase (erro 429: email rate limit exceeded).
- Código preservado e documentado para testes futuros.

## Próximos Passos

- Implementar um caminho alternativo usando Resend para envio de convite personalizado, sem depender do limite de e-mails do Supabase.
- O caminho Supabase será mantido para comparação e fallback.

---

**Arquivo gerado automaticamente por GitHub Copilot em 03/08/2025.**
