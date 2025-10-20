# Solicitações de Correção - MVP Portal ProLine

**Data:** 20 de Outubro de 2025  


---

## 1. Notificação de Cadastros Pendentes (Admin)

**Solicitação:**
> "Na tela do adm precisa gera uma notificação pra avisar que tem novo cadastro pendente. Tipo ficar vermelho o campo (cadastros pendentes)"

**Solução Implementada:**
- Campo "Cadastros Pendentes" possui indicação visual em **vermelho** quando há novos cadastros
- Contador numérico atualiza em tempo real
- Destaque visual facilita identificação imediata

**Melhoria Futura (Pós-MVP):**
- Implementar sistema de mensagens completo
- Menu suspenso com central de atualizações
- Alertas automáticos para eventos importantes

---

## 2. Informações Completas do Cadastro

**Solicitação:**
> "As informações do cadastro solicitado devem aparecer para o adm fazer a aprovação"

**Solução Implementada:**
- Todas as informações do cadastro são listadas na tela de aprovação
- Dados pessoais, profissionais e de contato visíveis
- Interface clara para análise e tomada de decisão

**Dados Exibidos:**
- Nome completo
- E-mail
- Telefone
- CPF/CNPJ
- Papel/Função solicitada
- Data da solicitação
- Informações adicionais relevantes por tipo de usuário

---

## 3. Fluxo de Criação de Senha

**Solicitação:**
> "A senha do novo cadastrado deve ser criado por ele depois de aprovado o cadastro. No email que avisa a aprovação deve ter um link apontando para o portal com a tela de criação de senha"

**Comportamento Atual (Arquitetura Definida):**
1. Admin cria usuário → Sistema gera **senha temporária**
2. E-mail enviado com **senha temporária**
3. Primeiro acesso → Sistema **força mudança de senha**
4. Usuário define sua própria senha permanente

**Justificativa Técnica:**
- Maior segurança (senha inicial conhecida apenas pelo sistema)
- Controle de primeiro acesso
- Registro de ativação de conta
- Padrão utilizado em sistemas corporativos

**Observação:**
Este é um padrão de arquitetura já estabelecido no projeto. Mudanças neste fluxo requerem revisão de segurança e podem impactar outros módulos.

---

## 4. Formatação Automática de CEP

**Solicitação:**
> "Na tela cli para inserir pontos de coleta o campo CEP deve se formatar automaticamente no padrão com hífen (40000-000)"

**Solução Implementada:**
- Máscara automática no formato: `00000-000`
- Aplicada em "Adicionar Ponto de Coleta"
- Validação de formato incluída
- Feedback visual imediato

**Localização:**
- Tela: Dashboard Cliente → Adicionar Ponto de Coleta
- Campo: CEP

---

## 5. Atualização Dinâmica ao Adicionar Veículo

**Solicitação:**
> "Quando o cliente insere um carro, depois do ok o carro não aparece automaticamente na tela dele. Precisa dar um refresh. Tem q ser imediato"

**Solução Implementada:**
- Lista de veículos atualiza **automaticamente** após inserção
- Não requer atualização manual da página
- Novo veículo aparece instantaneamente na lista
- Mensagem de sucesso exibida

**Tecnologia:**
- Atualização automática após operação bem-sucedida
- Estado gerenciado automaticamente
- Sincronização em tempo real

---

## 6. Aviso de Definição de Coleta

**Solicitação:**
> "O carro inserido deve gerar um aviso para o cliente definir a coleta"

**Solução Implementada:**
- Identificação visual: **"Aguardando Definição de Coleta"**
- Status destacado na lista de veículos
- Indicação clara de ação necessária

**Melhoria Futura (Pós-MVP):**
- Sistema de mensagens com alertas
- Menu suspenso de ações pendentes
- Contador de tarefas que precisam de atenção
- Lembretes automáticos de prazos

**Observação:**
Similar à sugestão do item 1, podemos unificar mensagens de atualizações e ações pendentes em um sistema de alertas completo.

---

## 7. Coleta em Lote - Esclarecimento

**Solicitação:**
> "Opções de coleta em lote não ficou claro o que é. Depois que vc aperta o botão e insere uma data, nada acontece na tela do cliente"

**Como Funciona:**
A **Coleta em Lote** permite definir data/local de coleta para **múltiplos veículos simultaneamente**.

**Veículos Elegíveis:**
Somente veículos nos seguintes status podem ser afetados:
- "Aguardando Definição de Coleta"
- "Ponto de Coleta Selecionado"
- "Aguardando Chegada do Veículo"
- "Aguardando Aprovação de Coleta"
- "Solicitação de Mudança de Data"

**Fluxo de Uso:**
1. Cliente seleciona todos os veículos pertencentes a um ou mais do status citados
2. Clica em "Coleta em Lote"
3. Define data e local de coleta, para coleta ou somente data quando o cliente é responsável por levar o veículo
4. Confirma operação
5. Todos os veículos selecionados são atualizados

**Feedback Visual:**
- Status dos veículos atualiza automaticamente
- Identificação muda para status apropriado
- Mensagem de sucesso exibida

---

## 8. Visão Geral de Veículos (Admin)

**Solicitação:**
> "Na tela adm não dá um alerta de novo carro. Precisa ter uma visão de tela inicial que mostre todos os carros. E dali possa fazer os filtros"

**Solução Implementada:**
- **Contador de carros totais** já implementado no painel
- Clique no contador → Lista todos os veículos
- Acesso aos detalhes de cada veículo
- Sistema de filtros disponível:
  - Por placa
  - Por status
  - Por cliente
- Paginação para grandes volumes

**Navegação:**
Painel Admin → Contador de Veículos → Lista Completa → Filtros

---

## 9. Botão de E-mail (iPhone)

**Solicitação:**
> "O botão do email de novo cadastro de especialista não funciona no iPhone"

**Status:** OK - Funcionando conforme esperado

---

## 10. Informações de Preparação e Comercialização

**Solicitação:**
> "Quando o cliente seleciona que quer preparação e comercialização essa informação não chega para o administrador e consequentemente nem para o especialista"

**Solução Implementada:**

**Comportamento do Sistema:**
- Seleção de "Preparação" ou "Comercialização" **não requer validação humana**
- Informação flui automaticamente pelo sistema

**Checklist do Especialista:**
- **Comercialização** → Exibe apenas: Loja + Pátio
- **Preparação** → Exibe todas as demais categorias de serviço


---

## 11. Observações do Cliente

**Solicitação:**
> "As observações do cadastro inicial do veículo também ficam perdidas no sistema. Ela tem q aparecer com destaque para o adm e especialista"

**Solução Implementada:**
- **Seção "Observações do Cliente"** nos detalhes do veículo
- Visível para Admin e Especialista
- Destaque visual (título próprio)
- Acessível no checklist do especialista

**Localizações:**
- Página de detalhes do veículo
- Checklist do especialista

---

## 12. Evidências Fotográficas do Checklist

**Solicitação:**
> "Depois que o especialista faz o checklist inicial as fotos do checklist não estão aparecendo para o cliente. O registro de fotos deve ser todo disponibilizado. Tem q ter um botão de Evidencias em que aparece a evolução de todo processo através de imagens"

**Solução Implementada:**
- Seção **"Evidências da Análise Preliminar"** na página de detalhes
- Todas as fotos do checklist listadas
- **Visualização em tela cheia** ao clicar nas imagens
- Navegação entre imagens (setas laterais)

**Acesso:**
- Cliente: Painel → Meus Veículos → Detalhes → Evidências
- Admin/Especialista: Mesma navegação em suas respectivas áreas

---

## 13. Erro 404 ao Clicar em "Ver Detalhes Completos"

**Solicitação:**
> "Qdo clica no botão de detalhes completos na tela adm dá erro. 404"

**Comportamento Corrigido**
- Redirecionamento funcionando

---

## 14. Fluxo de Delegação de Serviços

**Solicitação:**
> "Depois de finalizado o check List do especialista a tela do adm não mostra para onde foi direcionado os carros e nem as pendências e nem para o especialista e nem para o cliente. É preciso que fique estabelecido e o canal entre o adm e os parceiros indicados e o especialista"

**Solução Implementada:**

**Fluxo Completo de Delegação:**

### 1. Especialista Finaliza a Análise
- Checklist completo com todas as categorias preenchidas
- Fotos de evidências registradas
- Sistema incrementa automaticamente o contador **"Delegações Pendentes"** no painel do Admin

### 2. Admin Acessa Delegações Pendentes
- Contador de "Delegações Pendentes" visível no painel principal
- Clique no contador → Redireciona para página de delegação
- Página exibe todos os veículos com análise finalizada aguardando delegação

### 3. Admin Configura e Delega Serviços

O administrador tem controle total sobre como os serviços serão executados:

**A) Escolha do Tipo de Execução:**
   - **Paralelo**: Múltiplos parceiros trabalham ao mesmo tempo em categorias diferentes
     - Exemplo: Funilaria + Mecânica + Elétrica simultaneamente
    
   
   - **Sequencial**: Parceiros trabalham um após o outro em ordem de prioridade
     - Exemplo: 1º Mecânica → 2º Funilaria → 3º Pintura
    

**B) Definição de Prioridades:**
   - Para execução sequencial, define ordem numérica (1, 2, 3...)
   - Prioridade mais baixa inicia primeiro
   - Próximo parceiro só recebe quando anterior finalizar

**C) Seleção de Parceiros:**
   - Sistema mostra parceiros disponíveis por categoria de serviço
   - Admin atribui parceiro específico para cada categoria

### 4. Visibilidade Completa para Todos

**Admin - Painel de Controle:**
- Visualiza todos os veículos delegados
- Acompanha status de cada serviço em tempo real
- Vê qual parceiro está responsável por cada categoria
- Monitora progresso: Pendente → Em Execução → Concluído
- Acesso ao histórico completo de delegações

**Especialista - Acompanhamento:**
- Vê status dos veículos que analisou
- Acompanha quais serviços foram delegados
- Monitora progresso da execução

**Cliente - Transparência Total:**
- Visualiza progresso do seu veículo
- Vê quais serviços estão sendo executados
- Acompanha prazos estimados
- Recebe atualizações de status

**Parceiro - Painel de Trabalho:**
- Recebe serviços delegados em seu painel
- Vê apenas serviços atribuídos a ele
- Envia orçamento para aprovação do admin
- Após aprovação, executa e registra evidências


### Exemplo Prático de Delegação

**Cenário**: Veículo ABC1234 precisa de Mecânica, Funilaria e Pintura

**Opção 1 - Paralelo (Mais Rápido):**
```
Admin delega:
- Mecânica → Parceiro A 
- Funilaria → Parceiro B 
- Pintura → Parceiro C 

Todos trabalham simultaneamente

```

**Opção 2 - Sequencial (Com Dependências):**
```
Admin delega com prioridades:
- Prioridade 1: Mecânica → Parceiro A (prioridade 0)
- Prioridade 2: Funilaria → Parceiro B (prioridade 1)
- Prioridade 3: Pintura → Parceiro C (prioridade 2)

Execução em ordem:
1. Parceiro A finaliza mecânica (orçamento e execução)
2. Sistema libera Parceiro B 
3. Parceiro B finaliza funilaria (orçamento e execução)
4. Sistema libera Parceiro C 
5. Parceiro C finaliza pintura (orçamento e execução)

```

## Melhorias Futuras (Pós-MVP)

### Roadmap de Melhorias

1. **Sistema de Mensagens Unificado**
   - Alertas em tempo real
   - Central de notificações com menu suspenso
   - Contador unificado de atualizações e ações pendentes
   - Alertas automáticos

2. **Sistema de Lembretes Automáticos**
   - Lembretes de prazos importantes
   - Alertas de ações que precisam de atenção
   - Mensagens personalizadas por tipo de usuário

3. **Painel de Indicadores**
   - Métricas atualizadas em tempo real
   - Gráficos de desempenho
   - Indicadores por cliente, especialista e parceiro

