# 🧪 Fluxos de Teste - Especialista

Este documento descreve os fluxos de teste específicos para o contexto do especialista no sistema ProLine Hub.

## 📋 Visão Geral

O especialista é o profissional que realiza inspeções técnicas nos veículos, interagindo com o sistema para:
- Visualizar veículos atribuídos para inspeção
- Realizar análises detalhadas dos veículos
- Criar checklists de inspeção
- Adicionar evidências (fotos/vídeos)
- Finalizar inspeções e gerar relatórios

## 🎯 Objetivos de Teste

1. **Validar fluxos principais do especialista**
2. **Verificar consistência de dados**
3. **Testar cenários de erro**
4. **Avaliar experiência do usuário**
5. **Garantir acesso adequado às funcionalidades**

## 🔄 Fluxos Principais

### 1. Dashboard do Especialista

#### Casos de Teste Positivos
1. ✅ **Acesso ao dashboard**
   - Fazer login como especialista
   - Acessar `/dashboard/specialist`
   - Verificar carregamento correto do dashboard

2. ✅ **Visualização de métricas**
   - Verificar exibição correta de:
     - Veículos para análise
     - Análises em andamento
     - Análises concluídas
     - Métricas de produtividade

3. ✅ **Navegação entre seções**
   - Clicar em cada item do menu lateral
   - Verificar carregamento correto das páginas

#### Casos de Teste Negativos
1. ❌ **Acesso negado a funcionalidades restritas**
   - Tentar acessar URLs restritas a outros perfis
   - Verificar redirecionamento apropriado

### 2. Visualização de Veículos para Análise

#### Casos de Teste Positivos
1. ✅ **Listar veículos atribuídos**
   - Acessar página de veículos para análise
   - Verificar paginação e filtros
   - Verificar ordenação por colunas

2. ✅ **Visualizar detalhes do veículo**
   - Clicar em veículo da lista
   - Verificar exibição de dados do veículo
   - Verificar informações de coleta

3. ✅ **Iniciar análise do veículo**
   - Clicar em "Iniciar Análise" em veículo
   - Confirmar início da análise
   - Verificar status atualizado

#### Casos de Teste Negativos
1. ❌ **Tentar iniciar análise de veículo já em análise**
   - Tentar iniciar análise de veículo com status "em_analise"
   - Verificar mensagem de erro apropriada

2. ❌ **Tentar iniciar análise de veículo inexistente**
   - Tentar iniciar análise com ID inválido
   - Verificar mensagem de erro apropriada

### 3. Análise de Veículo

#### Casos de Teste Positivos
1. ✅ **Carregar checklist de análise**
   - Acessar checklist via `/dashboard/specialist/analysis?vehicleId=...`
   - Verificar carregamento correto do template
   - Verificar dados do veículo

2. ✅ **Preencher checklist de análise**
   - Marcar itens como OK/NOK/NA
   - Adicionar comentários
   - Adicionar severidade para itens NOK

3. ✅ **Adicionar evidências na análise**
   - Clicar em "Adicionar Evidência" em itens NOK
   - Fazer upload de imagem
   - Verificar preview da imagem
   - Remover evidência

4. ✅ **Salvar rascunho da análise**
   - Preencher alguns campos do checklist
   - Clicar em "Salvar Rascunho"
   - Verificar mensagem de sucesso
   - Recarregar página e verificar dados mantidos

5. ✅ **Finalizar análise**
   - Completar checklist
   - Clicar em "Finalizar Análise"
   - Confirmar finalização
   - Verificar bloqueio de edição

#### Casos de Teste Negativos
1. ❌ **Tentar salvar checklist com dados inválidos**
   - Tentar salvar checklist com campos obrigatórios vazios
   - Verificar validação apropriada

2. ❌ **Tentar finalizar análise incompleta**
   - Tentar finalizar análise com itens não preenchidos
   - Verificar validação apropriada

### 4. Visualização de Checklists

#### Casos de Teste Positivos
1. ✅ **Visualizar checklists de parceiros**
   - Acessar seção "Evidências" no dashboard
   - Verificar exibição de botões por `categoria • parceiro`
   - Clicar em botão para abrir viewer
   - Verificar exibição correta de itens e evidências

2. ✅ **Navegar por evidências**
   - Abrir checklist com múltiplas evidências
   - Navegar usando lightbox
   - Verificar todas as evidências são exibidas

#### Casos de Teste Negativos
1. ❌ **Tentar visualizar checklist inexistente**
   - Tentar abrir checklist com parâmetros inválidos
   - Verificar mensagem apropriada

### 5. Histórico de Análises

#### Casos de Teste Positivos
1. ✅ **Visualizar análises concluídas**
   - Acessar seção de análises concluídas
   - Verificar listagem de análises
   - Verificar filtros por data, veículo, status

2. ✅ **Visualizar detalhes de análise concluída**
   - Clicar em análise da lista
   - Verificar exibição de dados da análise
   - Verificar checklist e evidências

#### Casos de Teste Negativos
1. ❌ **Tentar visualizar análise inexistente**
   - Tentar acessar análise com ID inválido
   - Verificar mensagem apropriada

### 6. Relatórios e Métricas

#### Casos de Teste Positivos
1. ✅ **Gerar relatório de produtividade**
   - Acessar seção de relatórios
   - Selecionar período
   - Gerar relatório
   - Verificar download correto

2. ✅ **Visualizar métricas de qualidade**
   - Acessar dashboard de métricas
   - Verificar gráficos e indicadores
   - Verificar atualização em tempo real

#### Casos de Teste Negativos
1. ❌ **Tentar gerar relatório com período inválido**
   - Selecionar data inicial maior que data final
   - Verificar validação apropriada

## 📱 Testes de Responsividade

### Mobile
1. ✅ **Dashboard em mobile**
   - Acessar dashboard em dispositivo mobile
   - Verificar layout adaptado
   - Verificar navegação touch

2. ✅ **Checklist em mobile**
   - Acessar checklist em mobile
   - Verificar campos acessíveis
   - Verificar upload de fotos via câmera

### Tablet
1. ✅ **Dashboard em tablet**
   - Acessar dashboard em tablet
   - Verificar layout adaptado
   - Verificar disposição de cards

### Desktop
1. ✅ **Dashboard em desktop**
   - Acessar dashboard em desktop
   - Verificar layout completo
   - Verificar navegação com mouse

## 🔧 Testes de Performance

### Carregamento
1. ✅ **Tempo de carregamento do dashboard**
   - Medir tempo de carregamento da página
   - Verificar < 3 segundos

2. ✅ **Tempo de carregamento de checklists**
   - Medir tempo de carregamento de checklists complexos
   - Verificar paginação adequada

## 🔍 Testes de Acessibilidade

### Teclado
1. ✅ **Navegação por teclado**
   - Navegar usando apenas teclado
   - Verificar foco visível em elementos interativos

### Leitor de Tela
1. ✅ **Compatibilidade com leitores de tela**
   - Verificar labels adequados
   - Verificar landmarks semânticos

## 🐛 Relato de Bugs

### Como Reportar
1. **Identificar o problema**
   - Descrever passo a passo para reproduzir
   - Anotar dados de entrada usados
   - Capturar mensagens de erro

2. **Informações essenciais**
   - **URL da página:** onde o erro ocorreu
   - **Passos para reproduzir:** sequência exata de ações
   - **Resultado esperado:** o que deveria acontecer
   - **Resultado obtido:** o que realmente aconteceu
   - **Screenshots:** imagens que ajudem a entender o problema
   - **Dados de teste usados:** emails, veículos, etc.

3. **Canal de reporte**
   - Abrir issue no GitHub com label `bug`
   - Enviar email para equipe de desenvolvimento
   - Registrar no sistema de tickets interno

## 📈 Métricas de Qualidade

### Critérios de Aceite
- ✅ **100% dos fluxos principais funcionando**
- ✅ **0 erros críticos em produção**
- ✅ **< 5% de erros em funcionalidades secundárias**
- ✅ **Tempo de carregamento < 3 segundos**
- ✅ **Navegação intuitiva em todos os contextos**

## 📞 Suporte

Para dúvidas ou problemas com os testes de especialista:
- 📧 **Email:** specialist-qa@proline.com.br
- 📞 **Slack:** #specialist-quality-assurance
- 📚 **Documentação:** Esta pasta contém todos os recursos necessários

---

**Última Atualização:** 14 de Outubro de 2025  
**Responsável:** Equipe de Qualidade ProLine Hub