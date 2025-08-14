### DIAGNÓSTICO: Problema com Email de Aprovação

## ✅ **Causa Identificada:**

- Status 500: "Erro ao salvar dados do contrato"
- A API está falhando na atualização da tabela `profiles`
- Campos que podem estar faltando: `parqueamento`, `quilometragem`, `percentual_fipe`,
  `taxa_operacao`

## 🔧 **Soluções:**

### 1. **Verificar no Supabase Dashboard:**

- Vá em Table Editor → profiles
- Confirme se existem as colunas: parqueamento, quilometragem, percentual_fipe, taxa_operacao

### 2. **Se as colunas não existirem, executar SQL:**

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parqueamento TEXT,
ADD COLUMN IF NOT EXISTS quilometragem TEXT,
ADD COLUMN IF NOT EXISTS percentual_fipe NUMERIC,
ADD COLUMN IF NOT EXISTS taxa_operacao NUMERIC;
```

### 3. **Teste após correção:**

```bash
npx cypress run --spec "cypress/e2e/debug-email-detailed.cy.ts" --browser electron
```

### 4. **O que esperamos ver após a correção:**

```
📥 Response Status: 200
📥 Response Body: {
  "success": true,
  "message": "Cadastro aprovado com sucesso!",
  "emailSent": true,
  "confirmationTokenSent": false
}
✅ SUCCESS: Email foi enviado com sucesso!
```

## 📧 **Sobre o Email:**

Uma vez que o erro 500 for corrigido, o sistema deveria:

1. Salvar os dados na tabela `profiles`
2. Chamar o serviço de email via Supabase Edge Function
3. Enviar email usando Resend API
4. Retornar `emailSent: true`

O email chegará em **rafaelbsfarias@gmail.com** com:

- Assunto: Cadastro aprovado na ProLine
- Conteúdo: Link para login e detalhes do contrato
