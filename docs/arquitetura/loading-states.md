# Documentação da Implementação de Loading

## 1. Visão Geral

Esta documentação descreve o padrão de implementação de indicadores de `loading` (carregamento) nos principais componentes da aplicação ProLine Hub. O objetivo é garantir uma experiência de usuário consistente e informativa durante operações assíncronas, como busca de dados e submissão de formulários.

## 2. Componente Reutilizável: `Loading`

Para manter a consistência visual, a aplicação utiliza um componente centralizado de loading.

- **Localização**: `@/modules/common/components/Loading/Loading.tsx`
- **Tecnologia**: Utiliza a biblioteca `react-loading-indicators` para a animação.

### Como Usar

O componente `Loading` pode ser usado de duas formas principais:

1.  **Tela Cheia (Full Screen):** Ideal para o carregamento inicial de uma página.

    ```tsx
    import { Loading } from '@/modules/common/components/Loading/Loading';

    if (loading) {
      return <Loading fullScreen />;
    }
    ```

2.  **Container Específico:** Para indicar o carregamento de uma parte específica da UI.

    ```tsx
    {isLoadingSection && <Loading />}
    ```

## 3. Padrão de Implementação

A estratégia de loading é primariamente gerenciada através de hooks customizados, que encapsulam a lógica de busca de dados e o estado de carregamento.

### 3.1. Hooks Customizados

A maioria dos hooks que realizam operações assíncronas retorna um booleano `loading` ou `isLoading`.

**Exemplo (`useClientOverview.ts`):**

```typescript
const useClientOverview = (clientId: string) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Lógica para buscar dados...
    setLoading(false);
  }, [clientId]);

  return { data, loading, error };
};
```

### 3.2. Orquestração de Loading

Em páginas complexas como os dashboards, múltiplos estados de loading (de diferentes componentes filhos) são orquestrados na página principal através de callbacks como `onLoadingChange`.

**Exemplo (`AdminDashboard.tsx`):**

```tsx
const AdminDashboard: React.FC = () => {
  const [pendingRegLoading, setPendingRegLoading] = useState(true);
  const [usersCounterLoading, setUsersCounterLoading] = useState(true);

  const isOverallLoading = pendingRegLoading || usersCounterLoading;

  return (
    <div>
      {isOverallLoading && <Loading />}
      <PendingRegistrationsCounter onLoadingChange={setPendingRegLoading} />
      <UsersCounter onLoadingChange={setUsersCounterLoading} />
    </div>
  );
};
```

## 4. Implementação nos Componentes Principais

### 4.1. Páginas de Dashboard (Admin e Cliente)

-   **Carregamento Inicial:** Utilizam o estado `loading` de hooks como `useUserProfile` ou `useClientOverview` para exibir o componente `Loading` em tela cheia, bloqueando a interação até que os dados essenciais sejam carregados.
-   **Carregamento Parcial:** Componentes filhos notificam a página principal sobre a conclusão do seu carregamento através da prop `onLoadingChange`, permitindo um controle granular do indicador de loading geral da página.

### 4.2. Seções e Listas

-   Componentes como `PendingApprovalSection` ou `UserList` possuem seu próprio estado de `loading`.
-   Durante o carregamento, eles podem exibir uma mensagem de texto simples (ex: "Carregando propostas...") ou um esqueleto de UI (skeleton loader) para uma melhor experiência do usuário.

### 4.3. Ações, Formulários e Modais

-   **Feedback em Ações:** Em formulários de login, cadastro ou em modais que executam ações, o estado `isLoading` é usado para desabilitar botões e alterar o texto para fornecer feedback imediato (ex: "Salvar" -> "Salvando...").
-   **Prevenção de Ações Múltiplas:** O estado de `loading` desabilita os botões de submissão para prevenir que o usuário clique várias vezes enquanto a operação está em andamento.

**Exemplo (`ForceChangePasswordModal.tsx`):**

```tsx
const { handleSubmit, loading } = useForceChangePassword();

// ...

<button type="submit" disabled={loading}>
  {loading ? 'Salvando...' : 'Salvar'}
</button>
```

## 5. Boas Práticas e Recomendações

1.  **Centralizar:** Sempre que possível, utilizar o componente reutilizável `Loading` para manter a consistência.
2.  **Ser Específico:** Em vez de um indicador de loading genérico, fornecer mensagens específicas quando aplicável (ex: "Carregando clientes...").
3.  **Considerar Skeleton Loaders:** Para UIs complexas, o uso de skeleton loaders pode melhorar a percepção de performance. Esta é uma área para futuras melhorias.
4.  **Estado de Erro:** O estado de `loading` deve sempre ser acompanhado de um tratamento para o estado de `error`, garantindo que o usuário seja informado caso a operação falhe.
