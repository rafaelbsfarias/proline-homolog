# Documentação de Componentes: Button

## 1. Visão Geral

A aplicação ProLine Hub utiliza um conjunto padronizado de componentes de botão para garantir consistência visual e de experiência do usuário. Existem dois tipos principais de botões: `SolidButton` para ações primárias e `OutlineButton` para ações secundárias.

## 2. SolidButton

O `SolidButton` é o botão de ação principal, usado para as ações mais importantes em uma tela, como "Salvar", "Enviar" ou "Confirmar".

### 2.1. Localização

`@/modules/common/components/SolidButton/SolidButton.tsx`

### 2.2. API de Props

O componente `SolidButton` aceita todas as props padrão de um elemento `<button>` do HTML.

| Prop       | Tipo                                     | Obrigatório | Padrão | Descrição                                      |
| :--------- | :--------------------------------------- | :---------- | :----- | :--------------------------------------------- |
| `children` | `React.ReactNode`                        | Sim         | -      | O conteúdo do botão (texto, ícone, etc.).      |
| `...props` | `ButtonHTMLAttributes<HTMLButtonElement>` | Não         | -      | Quaisquer outras props de um botão HTML padrão. |

### 2.3. Como Usar

```tsx
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';

// Botão padrão
<SolidButton onClick={handleSubmit}>
  Salvar Alterações
</SolidButton>

// Botão desabilitado
<SolidButton disabled>
  Enviando...
</SolidButton>
```

### 2.4. Estilização

-   **CSS Modules:** `SolidButton.module.css`
-   **Estado Padrão:** Fundo sólido azul (`#002e4c`) com texto branco.
-   **Hover:** Fundo mais escuro (`#001f36`), com elevação e sombra para feedback.
-   **Desabilitado:** Fundo cinza (`#ccc`) e cursor `not-allowed`.

```css
.solidButton {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: #002e4c;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.solidButton:hover:not(:disabled) {
  background: #001f36;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.solidButton:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

## 3. OutlineButton

O `OutlineButton` é o botão de ação secundária, usado para ações menos críticas, como "Cancelar", "Voltar" ou "Ver Detalhes".

### 3.1. Localização

`@/modules/common/components/OutlineButton/OutlineButton.tsx`

### 3.2. API de Props

O componente `OutlineButton` aceita todas as props padrão de um elemento `<button>` do HTML.

| Prop       | Tipo                                     | Obrigatório | Padrão | Descrição                                      |
| :--------- | :--------------------------------------- | :---------- | :----- | :--------------------------------------------- |
| `children` | `React.ReactNode`                        | Sim         | -      | O conteúdo do botão (texto, ícone, etc.).      |
| `...props` | `ButtonHTMLAttributes<HTMLButtonElement>` | Não         | -      | Quaisquer outras props de um botão HTML padrão. |

### 3.3. Como Usar

```tsx
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';

// Botão padrão
<OutlineButton onClick={handleCancel}>
  Cancelar
</OutlineButton>

// Botão desabilitado
<OutlineButton disabled>
  Aguarde
</OutlineButton>
```

### 3.4. Estilização

-   **CSS Modules:** `OutlineButton.module.css`
-   **Estado Padrão:** Fundo transparente com borda e texto azul (`#002e4c`).
-   **Hover:** Fundo azul claro (`#e8f1ff`), com elevação e sombra para feedback.
-   **Desabilitado:** Fundo e texto cinza (`#ccc`, `#666`) e cursor `not-allowed`.

```css
.outlineButton {
  padding: 10px 20px;
  border: 1px solid #002e4c;
  border-radius: 8px;
  background: transparent;
  color: #002e4c;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.outlineButton:hover:not(:disabled) {
  background: #e8f1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.outlineButton:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  color: #666;
}
```

## 4. Boas Práticas

-   **Hierarquia:** Use `SolidButton` para a ação principal da tela e `OutlineButton` para ações secundárias para criar uma hierarquia clara para o usuário.
-   **Agrupamento:** Ao agrupar botões (ex: "Salvar" e "Cancelar"), a ação primária (`SolidButton`) geralmente fica à direita.
-   **Acessibilidade:** O texto dentro de `children` deve ser descritivo da ação que o botão executa.
