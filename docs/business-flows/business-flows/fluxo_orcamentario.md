# Fluxo Orçamentário e Execução de Serviços

## Visão Geral

Este documento descreve o fluxo completo de orçamento e execução de serviços para veículos após análise especializada. O processo envolve especialistas, parceiros, administradores e clientes, com foco em notificações, aprovações sequenciais, controle de status e monitoramento de tempo.

## Principais Entidades

### Veículo
- **Atributos**: ID, placa, marca, modelo, ano, status atual, data de criação
- **Status possíveis**:
  - `analisado` (após análise do especialista)
  - `fase_orcamentaria` (durante aprovação do orçamento)
  - `em_execucao_[servico]` (durante execução específica)
  - `concluido` (todos os serviços finalizados)

### Serviço
- **Atributos**: ID, categoria, descrição, parceiro responsável, status, tempo estimado (dias), data início, data fim
- **Status possíveis**: `pendente`, `em_execucao`, `concluido`, `cancelado`

### Parceiro
- **Atributos**: ID, nome, especialidades (categorias), contador de cotações pendentes
- **Permissões**: Visualizar apenas veículos associados por especialistas

### Orçamento
- **Atributos**: ID, veículo, serviços incluídos, valor total, status de aprovação
- **Status possíveis**: `pendente_aprovacao_admin`, `aprovado_admin`, `aprovado_cliente`, `rejeitado`

## Fluxo Detalhado

### 1. Pós-Análise - Marcação de Serviços
Após completar a análise do veículo, o especialista marca as categorias de serviço necessárias.

### 2. Notificação aos Parceiros
- Sistema identifica parceiros correspondentes às categorias marcadas
- Parceiros recebem notificação sobre nova cotação
- Contador de cotações do parceiro é incrementado

### 3. Acesso Restrito do Parceiro
Parceiro pode visualizar:
- Apenas veículos associados a ele por especialistas
- Detalhes básicos do veículo
- Fotos da inspeção
- Cotações pendentes

### 4. Processo de Orçamento
Parceiro elabora orçamento baseado nos serviços necessários.

### 5. Aprovação Sequencial
- **Primeira aprovação**: Administrador
- **Segunda aprovação**: Cliente
- Durante este período: Status do veículo = `fase_orcamentaria`

### 6. Seleção de Ordem de Execução
Após aprovação completa:
- Administrador define ordem de execução dos serviços
- Status do veículo muda para refletir serviço atual: `em_execucao_[categoria_servico]`

### 7. Execução e Registro
Para cada serviço:
- Parceiro registra início da execução
- Sistema inicia monitoramento de tempo (dias)
- Parceiro registra imagens "antes" e "depois"
- Parceiro marca serviço como concluído
- Sistema registra data fim e calcula tempo real

### 8. Monitoramento de Tempo
- Tempo estimado vs. tempo real por serviço
- Alertas para atrasos
- Relatórios de performance por parceiro

## Diagramas

### Diagrama de Sequência - Processo Completo

```mermaid
sequenceDiagram
    participant E as Especialista
    participant S as Sistema
    participant P as Parceiro
    participant A as Administrador
    participant C as Cliente
    participant V as Veículo

    E->>S: Marcar categorias de serviço
    S->>S: Identificar parceiros
    S->>P: Notificar cotação pendente
    S->>P: Incrementar contador cotações

    P->>S: Solicitar detalhes veículo
    S->>S: Verificar associação
    S->>P: Retornar dados + fotos

    P->>S: Enviar orçamento
    S->>A: Notificar orçamento pendente
    A->>S: Aprovar orçamento
    S->>C: Notificar orçamento para aprovação
    C->>S: Aprovar orçamento

    S->>V: Status = fase_orcamentaria
    S->>A: Solicitar ordem execução
    A->>S: Definir ordem serviços

    loop Para cada serviço na ordem
        S->>V: Status = em_execucao_[servico]
        S->>P: Notificar início execução
        P->>S: Registrar início + imagens antes
        S->>S: Iniciar monitoramento tempo
        
        P->>S: Registrar conclusão + imagens depois
        S->>S: Calcular tempo real
        S->>V: Atualizar status
    end

    S->>V: Status = concluido
```

### Diagrama de Estados - Veículo

```mermaid
stateDiagram-v2
    [*] --> analisado
    analisado --> fase_orcamentaria: Orçamento enviado
    fase_orcamentaria --> em_execucao_pintura: Ordem definida
    fase_orcamentaria --> em_execucao_mecanica: Ordem definida
    fase_orcamentaria --> em_execucao_eletrica: Ordem definida
    
    em_execucao_pintura --> em_execucao_mecanica: Serviço concluído
    em_execucao_mecanica --> em_execucao_eletrica: Serviço concluído
    em_execucao_eletrica --> concluido: Todos serviços finalizados
    
    fase_orcamentaria --> analisado: Orçamento rejeitado
    em_execucao_pintura --> cancelado: Serviço cancelado
    em_execucao_mecanica --> cancelado: Serviço cancelado
    em_execucao_eletrica --> cancelado: Serviço cancelado
    
    cancelado --> [*]
    concluido --> [*]
```

### Diagrama de Classes

```mermaid
classDiagram
    class Veiculo {
        +id: string
        +placa: string
        +marca: string
        +modelo: string
        +ano: number
        +status: StatusVeiculo
        +dataCriacao: Date
        +especialistaId: string
        +clienteId: string
        +orcamentoAtual: Orcamento
        +servicos: Servico[]
        +mudarStatus(novoStatus)
        +adicionarServico(servico)
    }

    class Servico {
        +id: string
        +categoria: string
        +descricao: string
        +parceiroId: string
        +status: StatusServico
        +tempoEstimado: number
        +tempoReal: number
        +dataInicio: Date
        +dataFim: Date
        +imagensAntes: Imagem[]
        +imagensDepois: Imagem[]
        +iniciarExecucao()
        +finalizarExecucao()
    }

    class Parceiro {
        +id: string
        +nome: string
        +especialidades: string[]
        +contadorCotacoes: number
        +veiculosAssociados: Veiculo[]
        +incrementarContador()
        +decrementarContador()
        +visualizarVeiculo(veiculoId)
    }

    class Orcamento {
        +id: string
        +veiculoId: string
        +servicos: Servico[]
        +valorTotal: number
        +status: StatusOrcamento
        +dataCriacao: Date
        +aprovadoAdmin: boolean
        +aprovadoCliente: boolean
        +aprovarAdmin()
        +aprovarCliente()
    }

    class Administrador {
        +id: string
        +nome: string
        +definirOrdemExecucao(veiculoId, ordem)
        +aprovarOrcamento(orcamentoId)
    }

    class Especialista {
        +id: string
        +nome: string
        +marcarServicos(veiculoId, categorias)
        +associarParceiro(veiculoId, parceiroId)
    }

    class Cliente {
        +id: string
        +nome: string
        +aprovarOrcamento(orcamentoId)
        +visualizarVeiculo(veiculoId)
    }

    class NotificacaoService {
        +notificarParceiro(parceiroId, mensagem)
        +notificarAdministrador(mensagem)
        +notificarCliente(clienteId, mensagem)
    }

    class MonitoramentoService {
        +iniciarMonitoramento(servicoId)
        +calcularTempoReal(servicoId)
        +gerarAlertaAtraso(servicoId)
    }

    Veiculo --> Orcamento
    Veiculo --> Servico
    Servico --> Parceiro
    Orcamento --> Servico
    Especialista --> Veiculo
    Administrador --> Veiculo
    Cliente --> Veiculo
    NotificacaoService --> Parceiro
    NotificacaoService --> Administrador
    NotificacaoService --> Cliente
    MonitoramentoService --> Servico
```

### Diagrama de Fluxo - Processo de Aprovação

```mermaid
flowchart TD
    A[Especialista marca serviços] --> B[Sistema identifica parceiros]
    B --> C[Parceiro notificado]
    C --> D[Parceiro elabora orçamento]
    D --> E[Orçamento enviado]
    
    E --> F{Administrador aprova?}
    F -->|Sim| G[Cliente notificado]
    F -->|Não| H[Orçamento rejeitado]
    
    G --> I{Cliente aprova?}
    I -->|Sim| J[Orçamento aprovado]
    I -->|Não| H
    
    J --> K[Administrador define ordem]
    K --> L[Status: fase_orcamentária → em_execução]
    L --> M[Parceiro executa serviço]
    M --> N[Registro com imagens]
    N --> O{Todos serviços concluídos?}
    O -->|Não| L
    O -->|Sim| P[Status: concluído]
```

## Requisitos Técnicos

### Notificações
- Sistema de notificações em tempo real
- Contadores visuais no dashboard do parceiro
- Histórico de notificações

### Controle de Acesso
- Parceiros só visualizam veículos associados
- Clientes só visualizam seus próprios veículos
- Administradores têm acesso completo

### Monitoramento
- Cronômetro automático por serviço
- Alertas configuráveis para atrasos
- Relatórios de performance

### Persistência
- Histórico completo de mudanças de status
- Registro de todas as imagens por serviço
- Logs de aprovação e rejeição

## Próximos Passos

1. **Validação da documentação** - Revisar diagramas e fluxo
2. **Implementação da base de dados** - Novas tabelas e relacionamentos
3. **Desenvolvimento das APIs** - Endpoints para CRUD das entidades
4. **Implementação das regras de negócio** - Lógica de status e notificações
5. **Desenvolvimento da UI** - Dashboards atualizados para cada perfil
6. **Testes** - Validação completa do fluxo

---

**Data de criação**: 02/09/2025
**Versão**: 1.0
**Autor**: Sistema de Documentação Automática
