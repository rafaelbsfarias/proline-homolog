# 🧪 Fluxos de Teste - Administrador

Este documento descreve os fluxos de teste específicos para o contexto do administrador no sistema ProLine Hub.

## 📋 Visão Geral

O administrador é o membro da equipe interna da ProLine Hub que interage com o sistema para:
- Gerenciar clientes e parceiros
- Aprovar orçamentos
- Visualizar checklists e evidências
- Monitorar performance do sistema
- Configurar parâmetros globais

## 🎯 Objetivos de Teste

1. **Validar fluxos principais do administrador**
2. **Verificar consistência de dados**
3. **Testar cenários de erro**
4. **Avaliar experiência do usuário**
5. **Garantir acesso adequado a todas as funcionalidades**

## 🔄 Fluxos Principais

### 1. Dashboard do Administrador

#### Casos de Teste Positivos
1. ✅ **Acesso ao dashboard**
   - Fazer login como administrador
   - Acessar `/dashboard/admin`
   - Verificar carregamento correto do dashboard

2. ✅ **Visualização de métricas**
   - Verificar exibição correta de:
     - Contadores de clientes
     - Contadores de parceiros
     - Contadores de veículos
     - Contadores de orçamentos
     - Contadores de coletas

3. ✅ **Navegação entre seções**
   - Clicar em cada item do menu lateral
   - Verificar carregamento correto das páginas

#### Casos de Teste Negativos
1. ❌ **Acesso negado a funcionalidades restritas**
   - Tentar acessar URLs restritas a outros perfis
   - Verificar redirecionamento apropriado

### 2. Gestão de Clientes

#### Casos de Teste Positivos
1. ✅ **Listar clientes**
   - Acessar página de clientes
   - Verificar paginação e filtros
   - Verificar ordenação por colunas

2. ✅ **Visualizar detalhes do cliente**
   - Clicar em cliente da lista
   - Verificar exibição de dados do cliente
   - Verificar lista de veículos

3. ✅ **Editar cliente**
   - Clicar em "Editar" cliente
   - Modificar dados
   - Salvar alterações
   - Verificar atualização na lista

4. ✅ **Desativar cliente**
   - Clicar em "Desativar" cliente
   - Confirmar desativação
   - Verificar cliente marcado como inativo

5. ✅ **Reativar cliente**
   - Clicar em "Reativar" cliente inativo
   - Confirmar reativação
   - Verificar cliente marcado como ativo

#### Casos de Teste Negativos
1. ❌ **Tentar editar cliente com dados inválidos**
   - Tentar salvar cliente com email inválido
   - Verificar mensagem de erro apropriada

2. ❌ **Tentar desativar cliente com orçamentos ativos**
   - Tentar desativar cliente com orçamentos em andamento
   - Verificar mensagem de erro apropriada

### 3. Gestão de Parceiros

#### Casos de Teste Positivos
1. ✅ **Listar parceiros**
   - Acessar página de parceiros
   - Verificar paginação e filtros
   - Verificar ordenação por colunas

2. ✅ **Visualizar detalhes do parceiro**
   - Clicar em parceiro da lista
   - Verificar exibição de dados do parceiro
   - Verificar lista de serviços

3. ✅ **Aprovar parceiro**
   - Clicar em "Aprovar" parceiro pendente
   - Confirmar aprovação
   - Verificar parceiro marcado como ativo

4. ✅ **Rejeitar parceiro**
   - Clicar em "Rejeitar" parceiro pendente
   - Informar motivo da rejeição
   - Confirmar rejeição
   - Verificar parceiro marcado como rejeitado

5. ✅ **Editar parceiro**
   - Clicar em "Editar" parceiro
   - Modificar dados
   - Salvar alterações
   - Verificar atualização na lista

6. ✅ **Desativar parceiro**
   - Clicar em "Desativar" parceiro
   - Confirmar desativação
   - Verificar parceiro marcado como inativo

7. ✅ **Reativar parceiro**
   - Clicar em "Reativar" parceiro inativo
   - Confirmar reativação
   - Verificar parceiro marcado como ativo

#### Casos de Teste Negativos
1. ❌ **Tentar aprovar parceiro já aprovado**
   - Tentar aprovar parceiro com status "ativo"
   - Verificar mensagem de erro apropriada

2. ❌ **Tentar editar parceiro com dados inválidos**
   - Tentar salvar parceiro com CNPJ inválido
   - Verificar mensagem de erro apropriada

### 4. Aprovação de Orçamentos

#### Casos de Teste Positivos
1. ✅ **Listar orçamentos pendentes**
   - Acessar página de orçamentos pendentes
   - Verificar exibição correta dos orçamentos
   - Verificar filtros por status, parceiro, cliente

2. ✅ **Visualizar detalhes do orçamento**
   - Clicar em orçamento da lista
   - Verificar exibição de dados do orçamento
   - Verificar checklist e evidências

3. ✅ **Aprovar orçamento completo**
   - Selecionar orçamento pendente
   - Clicar em "Aprovar"
   - Confirmar aprovação
   - Verificar status atualizado

4. ✅ **Aprovar orçamento parcial**
   - Selecionar orçamento pendente
   - Desmarcar alguns serviços
   - Clicar em "Aprovar Parcialmente"
   - Confirmar aprovação
   - Verificar status atualizado

5. ✅ **Rejeitar orçamento**
   - Selecionar orçamento pendente
   - Clicar em "Rejeitar"
   - Informar motivo da rejeição
   - Confirmar rejeição
   - Verificar status atualizado

#### Casos de Teste Negativos
1. ❌ **Tentar aprovar orçamento já aprovado**
   - Tentar aprovar orçamento com status "aprovado"
   - Verificar mensagem de erro apropriada

2. ❌ **Tentar aprovar orçamento sem selecionar serviços**
   - Tentar aprovar orçamento sem selecionar nenhum serviço
   - Verificar mensagem de erro apropriada

### 5. Visualização de Checklists

#### Casos de Teste Positivos
1. ✅ **Visualizar checklists de parceiros**
   - Acessar seção "Evidências" no dashboard
   - Verificar exibição de botões por `categoria • parceiro`
   - Clicar em botão para abrir viewer
   - Verificar exibição correta de itens e evidências

2. ✅ **Navegar por evidências**
   - Abrir checklist com múltiplas evidências
   - Navegar usando setas/lightbox
   - Verificar todas as evidências são exibidas

#### Casos de Teste Negativos
1. ❌ **Tentar visualizar checklist inexistente**
   - Tentar abrir checklist com parâmetros inválidos
   - Verificar mensagem apropriada

### 6. Monitoramento de Performance

#### Casos de Teste Positivos
1. ✅ **Visualizar métricas de sistema**
   - Acessar seção de métricas/performance
   - Verificar exibição de gráficos e dados
   - Verificar atualização em tempo real

2. ✅ **Exportar relatórios**
   - Clicar em "Exportar" relatório
   - Verificar download correto do arquivo
   - Verificar conteúdo do relatório

### 7. Configuração de Parâmetros

#### Casos de Teste Positivos
1. ✅ **Editar parâmetros globais**
   - Acessar página de configuração
   - Modificar parâmetros
   - Salvar alterações
   - Verificar parâmetros atualizados

2. ✅ **Restaurar padrões**
   - Acessar página de configuração
   - Clicar em "Restaurar Padrões"
   - Confirmar restauração
   - Verificar parâmetros restaurados

#### Casos de Teste Negativos
1. ❌ **Tentar salvar parâmetros inválidos**
   - Tentar salvar valores fora dos limites
   - Verificar validação apropriada

## 📱 Testes de Responsividade

### Mobile
1. ✅ **Dashboard em mobile**
   - Acessar dashboard em dispositivo mobile
   - Verificar layout adaptado
   - Verificar navegação touch

2. ✅ **Listagens em mobile**
   - Acessar listas em mobile
   - Verificar paginação adequada
   - Verificar filtros funcionando

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

2. ✅ **Tempo de carregamento de listas**
   - Medir tempo de carregamento de listas grandes
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

Para dúvidas ou problemas com os testes de administrador:
- 📧 **Email:** admin-qa@proline.com.br
- 📞 **Slack:** #admin-quality-assurance
- 📚 **Documentação:** Esta pasta contém todos os recursos necessários

---

**Última Atualização:** 14 de Outubro de 2025  
**Responsável:** Equipe de Qualidade ProLine Hub