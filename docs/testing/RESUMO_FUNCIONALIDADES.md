# ProLine Hub - Resumo de Funcionalidades

*Última atualização: 17 de Outubro de 2025*

---

## O que é este documento?

Este documento apresenta de forma simples e direta todas as funcionalidades que podem ser testadas na plataforma ProLine Hub. É um guia para entender o que o sistema faz e como cada tipo de usuário interage com ele.

---

## Tipos de Usuários

A plataforma possui **4 tipos diferentes de usuários**, cada um com suas próprias funcionalidades:

### 1. **Cliente** (Dono do Veículo)
Pessoa que possui um veículo e precisa de serviços automotivos.

### 2. **Parceiro** (Oficina/Prestador de Serviço)
Empresa que realiza serviços nos veículos (mecânica, funilaria, lavagem, etc).

### 3. **Administrador** (Equipe ProLine)
Funcionário da ProLine que gerencia a plataforma e aprova orçamentos.

### 4. **Especialista** (Inspetor Técnico)
Profissional que realiza inspeções técnicas detalhadas nos veículos.

---

## O que cada usuário pode fazer

### **Cliente - Funcionalidades**

#### Gerenciar Veículos
- Adicionar novos veículos ao sistema (placa, marca, modelo, ano)
- Ver a lista de todos os seus veículos
- Editar informações dos veículos
- Ver o histórico de serviços de cada veículo

#### Definir Forma de Coleta
- Escolher onde o veículo será coletado:
  - **Ponto de Coleta**: ProLine busca o veículo em um endereço
  - **Levar ao Pátio**: Cliente leva o veículo até o pátio ProLine
- Definir data e horário da coleta

#### Gerenciar Orçamentos
- Ver orçamentos recebidos dos parceiros
- Visualizar fotos e descrições detalhadas dos problemas
- Aprovar orçamentos completos ou parciais
- Rejeitar orçamentos que não concordar
- Acompanhar o status dos serviços aprovados

#### Acompanhar Status
- Ver em tempo real onde está seu veículo
- Receber notificações sobre mudanças de status
- Acompanhar o andamento dos serviços

---

### **Parceiro - Funcionalidades**

#### Criar Checklist de Vistoria
- Preencher formulário detalhado de inspeção do veículo
- Marcar cada item como:
  - **OK**: Funcionando bem
  - **NOK** (Não OK): Precisa de reparo
  - **NA** (Não Aplicável): Não se aplica a este veículo
- Adicionar comentários em cada item


#### Adicionar Evidências
- Tirar fotos dos problemas encontrados
- Fazer upload de múltiplas imagens por item
- Remover fotos caso necessário
- Visualizar todas as fotos antes de enviar

#### Solicitar Peças
- Criar lista de peças necessárias para cada serviço
- Informar descrição, quantidade e valor estimado
- Editar ou remover peças da lista
- Associar peças aos itens do checklist

#### Salvar Progresso
- Salvar checklist como rascunho enquanto trabalha
- Continuar de onde parou em outro momento
- Não perder nenhuma informação preenchida

#### Enviar Orçamento
- Revisar tudo antes de enviar
- Submeter checklist completo para aprovação
- Não poder mais editar após envio (garante integridade)


#### Acompanhar Desempenho
- Ver resumo financeiro dos orçamentos
- Acompanhar receita total e média
- Ver quantidade de orçamentos aprovados/pendentes
- Filtrar por período (mês, trimestre, ano)

---

### **Administrador - Funcionalidades**

#### Gerenciar Clientes
- Ver lista de todos os clientes
- Visualizar detalhes e veículos de cada cliente
- Editar informações dos clientes
- Ativar ou desativar clientes
- Aprovar novos clientes que se cadastraram

#### Gerenciar Parceiros
- Ver lista de todos os parceiros
- Aprovar novos parceiros que se cadastraram
- Rejeitar parceiros que não atendem requisitos
- Visualizar serviços oferecidos por cada parceiro
- Editar informações dos parceiros
- Ativar ou desativar parceiros

#### Aprovar Orçamentos
- Ver todos os orçamentos pendentes
- Visualizar checklists e evidências detalhadas
- Aprovar orçamentos completos
- Aprovar apenas parte dos serviços (aprovação parcial)
- Rejeitar orçamentos com justificativa
- Filtrar por status, parceiro ou cliente

#### Monitorar Sistema
- Ver métricas gerais da plataforma:
  - Total de clientes ativos
  - Total de parceiros ativos
  - Total de veículos cadastrados
  - Total de orçamentos por status
  - Total de coletas realizadas
- Acompanhar performance em tempo real

#### Visualizar Evidências
- Acessar todos os checklists da plataforma
- Ver fotos e vídeos de qualquer serviço
- Verificar conformidade dos serviços


#### Delegar Veículos para Especialistas
- Atribuir veículos específicos para especialistas realizarem inspeção
- Ver lista de veículos disponíveis para delegação
- Escolher qual especialista ficará responsável
- Acompanhar status das delegações
- Redelegar veículos se necessário

#### Delegar Serviços para Parceiros
- Atribuir categorias de serviços específicas para parceiros realizarem orçamentos
- Escolher qual parceiro de cada categoria receberá o pedido
- Definir se os serviços serão executados:
  - **Em Paralelo**: Múltiplas categorias trabalham ao mesmo tempo (ex: mecânica + lavagem simultaneamente)
  - **Em Sequência**: Uma categoria por vez, seguindo ordem de prioridade (ex: primeiro mecânica, depois pintura)
- Definir ordem de prioridade para serviços sequenciais
- Criar pedidos de orçamento (Service Orders) automaticamente
- Acompanhar status de cada delegação
- Ver quais parceiros estão trabalhando em cada veículo

---

### **Especialista - Funcionalidades**

#### Realizar Inspeções
- Ver lista de veículos que precisam de inspeção
- Iniciar análise técnica detalhada
- Preencher checklist de inspeção especializada
- Marcar itens e adicionar observações técnicas

#### Documentar Problemas
- Fotografar todos os problemas encontrados
- Adicionar múltiplas evidências por item
- Remover fotos desnecessárias

#### Criar Relatórios (Análise Preliminar)
- Adicionar comentários técnicos detalhados
- Salvar análise parcial como rascunho
- Finalizar inspeção

#### Acompanhar Produtividade
- Ver quantidade de inspeções realizadas
- Ver inspeções em andamento
- Ver inspeções concluídas
- Gerar relatórios de produtividade


#### Revisar e Definir Prazos
- Revisar prazos sugeridos pelos parceiros
- Ajustar prazos conforme complexidade identificada
- Adicionar observações sobre o prazo definido
- Enviar prazo revisado para o sistema

---

## Fluxo Completo do Sistema

### Como Tudo Funciona Junto

1. **Cliente** cadastra veículo e define coleta
2. **Administrador** delega veículo para um especialista
3. **Especialista** realiza inspeção técnica inicial e identifica necessidades
4. **Administrador** delega serviços para parceiros específicos (define se paralelo ou sequencial)
5. **Parceiro** recebe pedido, vistoria veículo e cria orçamento detalhado
6. **Administrador** revisa e aprova orçamento
7. **Cliente** recebe e aprova orçamento
8. **Especialista** revisa e ajusta os prazos definidos pelos parceiros
9. **Parceiro** executa serviços aprovados conforme ordem (paralela ou sequencial)
10. **Cliente** recebe veículo de volta

---

