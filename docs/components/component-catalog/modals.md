# Documentação do Componente: Modal

## 1. Visão Geral

O `Modal` é um componente reutilizável que padroniza a exibição de caixas de diálogo (modais) em toda a aplicação ProLine Hub. Ele foi projetado para ser flexível, acessível e fácil de usar, encapsulando funcionalidades comuns como título, subtitulo, e controle de visibilidade.

## 2. Localização

O componente está localizado no seguinte caminho:
`@/modules/common/components/Modal/Modal.tsx`

## 3. Funcionalidades

- **Título e Subtítulo:** Permite a exibição de um título (obrigatório) e um subtítulo (opcional).
- **Controle de Visibilidade:** O modal pode ser exibido ou ocultado através da prop `isOpen`.
- **Botão de Fechar:** Opcional, pode ser exibido ou ocultado através da prop `showCloseButton`.
- **Dimensões Dinâmicas:** A largura e altura do modal podem ser ajustadas através das props `width` e `height`.
- **Conteúdo Flexível:** O conteúdo do modal é passado como `children`, permitindo a inserção de qualquer elemento React.

## 4. API de Props

| Prop            | Tipo                  | Obrigatório | Padrão  | Descrição                                                                 |
| :-------------- | :-------------------- | :---------- | :------ | :------------------------------------------------------------------------ |
| `isOpen`        | `boolean`             | Sim         | -       | Controla a visibilidade do modal.                                         |
| `onClose`       | `() => void`          | Sim         | -       | Função de callback executada quando o modal é fechado.                    |
| `title`         | `string`              | Sim         | -       | O texto a ser exibido como título do modal.                               |
| `subtitle`      | `string`              | Não         | -       | O texto a ser exibido como subtítulo do modal.                            |
| `children`      | `React.ReactNode`     | Sim         | -       | O conteúdo a ser exibido dentro do modal.                                 |
| `width`         | `string`              | Não         | `400px` | A largura do modal.                                                       |
| `height`        | `string`              | Não         | `auto`  | A altura do modal.                                                        |
| `showCloseButton` | `boolean`             | Não         | `true`  | Se `true`, exibe o botão de fechar.                                       |

## 5. Como Usar

### 5.1. Modal Básico

```tsx
import Modal from '@/modules/common/components/Modal/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Título do Modal"
>
  <p>Conteúdo do modal.</p>
</Modal>
```

### 5.2. Modal com Subtítulo e Largura Customizada

```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Título do Modal"
  subtitle="Este é um subtítulo."
  width="600px"
>
  <p>Conteúdo do modal.</p>
</Modal>
```

### 5.3. Modal sem Botão de Fechar

```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Atenção"
  subtitle="Esta ação não pode ser desfeita."
  showCloseButton={false}
>
  <p>Conteúdo do modal.</p>
</Modal>
```

## 6. Estilização

- **CSS Modules:** O componente utiliza CSS Modules para seu estilo base, localizado em `Modal.module.css`.
- **Estilos de Formulário:** O `Modal.module.css` também inclui estilos para formulários (`.form`, `.formGroup`, `.buttonGroup`) que podem ser utilizados dentro do modal para manter a consistência visual.

## 7. Boas Práticas

- **Acessibilidade:** Certifique-se de que o modal seja acessível, controlando o foco e o estado `isOpen` adequadamente.
- **Conteúdo:** Mantenha o conteúdo do modal conciso e direto ao ponto.
- **Ações:** Forneça ações claras para o usuário, como botões de "Salvar", "Cancelar", etc.
