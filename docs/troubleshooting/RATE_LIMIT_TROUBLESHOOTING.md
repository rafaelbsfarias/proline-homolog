# ANÁLISE DE ERRO - Magic Link Rate Limit

## Problema Identificado

**Erro:** `email rate limit exceeded` **Status:** 500 Internal Server Error **API:**
`/api/admin/send-magic-link`

## Detalhes

O Supabase tem um limite de frequência (rate limit) para envio de emails, especialmente para Magic
Links e outros emails de autenticação. Isso é uma medida de segurança para prevenir spam e abuso.

### Resposta da API:

```json
{
  "error": "Erro ao enviar Magic Link.",
  "code": "MAGIC_LINK_ERROR",
  "details": "email rate limit exceeded",
  "debugInfo": {
    "email": "rafael@serejo.tech"
  }
}
```

## Soluções Implementadas

### 1. Melhor Visibilidade de Erros

- ✅ Captura detalhada de erros nos componentes `EmailTemplateTest` e `EdgeFunctionEmailTest`
- ✅ Exibição completa da resposta da API com detalhes do erro
- ✅ Formatação visual clara para distinguir sucessos de erros

### 2. Tratamento do Rate Limit

- ✅ Identificação específica do erro de rate limit
- 🔄 Implementar retry logic com backoff
- 🔄 Implementar sistema de cache/debounce para evitar múltiplas tentativas
- 🔄 Adicionar aviso específico para rate limit

## Rate Limits do Supabase

### Limites Conhecidos:

- **Magic Link:** Máximo 1 por email a cada 60 segundos
- **Invite User:** Máximo 1 por email a cada 60 segundos
- **Password Reset:** Máximo 1 por email a cada 60 segundos

### Workarounds:

1. **Edge Functions:** Usar Edge Functions para bypass do rate limit (já implementado)
2. **Diferentes Templates:** Alternar entre métodos para diferentes casos de uso
3. **Desenvolvimento:** Usar emails diferentes para testes

## Status das Melhorias

- ✅ **Visibilidade de Erro:** Implementada
- ✅ **Detalhamento da API:** Implementado
- 🔄 **Rate Limit Handler:** Próximo passo
- 🔄 **Retry Logic:** Próximo passo

## Próximos Passos

1. Implementar sistema de retry com backoff exponencial
2. Adicionar debounce nos botões de teste
3. Criar sistema de notificação específico para rate limits
4. Documentar melhor os limites para outros desenvolvedores

## Teste com Edge Functions

O método alternativo via Edge Functions deve funcionar para contornar esse limite, já que não usa o
sistema de auth do Supabase diretamente.
