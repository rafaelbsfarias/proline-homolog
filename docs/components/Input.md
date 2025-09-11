# Documentação do Componente: Input

## 1. Visão Geral

O `Input` é um componente de formulário reutilizável que padroniza a aparência e o comportamento de campos de entrada de texto em toda a aplicação ProLine Hub. Ele foi projetado para ser flexível, acessível e fácil de usar, encapsulando funcionalidades comuns como labels, máscaras e visibilidade de senha.

## 2. Localização

O componente está localizado no seguinte caminho:
`@/modules/common/components/Input/Input.tsx`

## 3. Funcionalidades

- **Tipos Suportados:** `text`, `password`, `email`, e `tel`.
- **Label Integrada:** Associa uma `<label>` ao campo de entrada para melhor acessibilidade.
- **Visibilidade de Senha:** Para campos do tipo `password`, um ícone de olho permite ao usuário alternar a visibilidade da senha.
- **Máscaras de Input:** Suporte para formatação de entrada em tempo real (ex: CNPJ, telefone) utilizando a biblioteca `react-imask`.
- **Estado Desabilitado:** Permite desabilitar o campo de entrada.
- **Estilização Customizável:** Suporte para classes de CSS customizadas através da prop `className`.

## 4. API de Props

| Prop         | Tipo                                                  | Obrigatório | Padrão | Descrição                                                                                             |
| :----------- | :---------------------------------------------------- | :---------- | :----- | :---------------------------------------------------------------------------------------------------- |
| `id`         | `string`                                              | Sim         | -      | Identificador único para o input e o `for` da label.                                                  |
| `name`       | `string`                                              | Sim         | -      | Nome do campo, usado para identificar o valor no estado do formulário.                                |
| `label`      | `string`                                              | Sim         | -      | O texto a ser exibido na `<label>` associada ao input.                                                |
| `type`       | `'text' \| 'password' \| 'email' \| 'tel'`      | Não         | `text` | Define o tipo do campo de entrada.                                                                    |
| `value`      | `string`                                              | Sim         | -      | O valor atual do campo de entrada (controlado).                                                       |
| `onChange`   | `(e: React.ChangeEvent<HTMLInputElement>) => void`    | Sim         | -      | Função de callback executada quando o valor do campo muda.                                            |
| `disabled`   | `boolean`                                             | Não         | `false`| Se `true`, desabilita o campo de entrada.                                                             |
| `placeholder`| `string`                                              | Não         | -      | Texto de placeholder para o campo de entrada.                                                         |
| `className`  | `string`                                              | Não         | -      | Classe CSS customizada a ser aplicada ao elemento `<input>`. Útil para estilização de erro.         |
| `mask`       | `any`                                                 | Não         | -      | Define a máscara a ser aplicada. Aceita padrões da biblioteca `react-imask`.                        |
| `onAccept`   | `(value: any, maskRef: any) => void`                  | Não         | -      | Callback para inputs com máscara, executado quando o valor é aceito. Útil para obter o valor não mascarado. |

## 5. Como Usar

### 5.1. Input Básico

```tsx
import Input from '@/modules/common/components/Input/Input';

<Input
  id="fullName"
  name="fullName"
  label="Nome Completo"
  value={form.fullName}
  onChange={handleChange}
/>
```

### 5.2. Input de Senha

O ícone para mostrar/ocultar a senha é adicionado automaticamente.

```tsx
<Input
  id="password"
  name="password"
  label="Senha"
  type="password"
  value={form.password}
  onChange={handleChange}
/>
```

### 5.3. Input com Máscara (CNPJ)

Utilize a prop `mask` para formatar o valor do input.

```tsx
<Input
  id="cnpj"
  name="cnpj"
  label="CNPJ"
  value={form.cnpj}
  onChange={handleChange}
  mask="00.000.000/0000-00"
/>
```

### 5.4. Input com Tratamento de Erro

Passe uma classe de erro através da prop `className` para estilizar o campo quando houver um erro de validação.

```tsx
import styles from './YourComponent.module.css';

<Input
  id="email"
  name="email"
  label="Email"
  type="email"
  value={form.email}
  onChange={handleChange}
  className={fieldErrors.email ? styles.error : ''}
/>
<ErrorMessage message={fieldErrors.email} />
```

## 6. Estilização

-   **CSS Modules:** O componente utiliza CSS Modules para seu estilo base, localizado em `Input.module.css`.
-   **Classe de Erro:** A estilização de erro não é interna do componente. Ela deve ser aplicada externamente através da prop `className`, permitindo que o componente pai controle a aparência do erro. Isso garante maior flexibilidade.

## 7. Boas Práticas

-   **Acessibilidade:** Sempre forneça um `id` e `label` únicos para garantir que o formulário seja acessível.
-   **Tipo Semântico:** Utilize o `type` apropriado para cada campo para aproveitar os recursos nativos do navegador (validação, teclados mobile, etc.).
-   **Inputs Controlados:** O componente é projetado para ser controlado. Sempre gerencie seu estado (`value` e `onChange`) no componente pai.
