# 🧪 Fluxos de Teste - Cliente

Este documento descreve os fluxos de teste específicos para o contexto do cliente no sistema ProLine Hub.

## 📋 Visão Geral

O cliente é o proprietário do veículo que interage com o sistema para:
- Cadastrar veículos
- Definir métodos de coleta
- Aprovar orçamentos
- Acompanhar status dos serviços

## 🎯 Objetivos de Teste

1. **Validar fluxos principais do cliente**
2. **Verificar consistência de dados**
3. **Testar cenários de erro**
4. **Avaliar experiência do usuário**

## 🔄 Fluxos Principais

### 1. Cadastro de Veículo

#### Casos de Teste Positivos
1. ✅ **Cadastro de veículo com dados válidos**
   - Acessar dashboard do cliente
   - Clicar em "Adicionar Veículo"
   - Preencher placa, marca, modelo e ano válidos
   - Clicar em "Salvar"
   - Verificar que veículo aparece na lista

2. ✅ **Edição de veículo existente**
   - Acessar veículo existente
   - Clicar em "Editar"
   - Modificar algum campo
   - Salvar alterações
   - Verificar que dados foram atualizados

#### Casos de Teste Negativos
1. ❌ **Cadastro com placa inválida**
   - Tentar cadastrar com placa mal formatada
   - Verificar mensagem de erro apropriada

2. ❌ **Cadastro com ano inválido**
   - Tentar cadastrar com ano futuro ou muito antigo
   - Verificar validação apropriada

### 2. Definição de Coleta

#### Casos de Teste Positivos
1. ✅ **Definir ponto de coleta**
   - Selecionar veículo com status "Aguardando Definição de Coleta"
   - Clicar em "Definir Coleta"
   - Escolher opção "Ponto de Coleta"
   - Selecionar endereço existente
   - Definir data
   - Clicar em "Confirmar"
   - Verificar atualização de status

2. ✅ **Definir coleta por pátio**
   - Selecionar veículo com status "Aguardando Definição de Coleta"
   - Clicar em "Definir Coleta"
   - Escolher opção "Levar ao Pátio"
   - Definir data estimada
   - Clicar em "Confirmar"
   - Verificar atualização de status

#### Casos de Teste Negativos
1. ❌ **Tentar definir coleta sem endereço**
   - Tentar definir coleta sem selecionar endereço
   - Verificar mensagem de erro

### 3. Aprovação de Orçamento

#### Casos de Teste Positivos
1. ✅ **Aprovar orçamento completo**
   - Selecionar orçamento pendente
   - Clicar em "Ver Detalhes"
   - Verificar checklist e evidências
   - Clicar em "Aprovar Orçamento"
   - Confirmar aprovação
   - Verificar atualização de status

2. ✅ **Aprovar orçamento parcial**
   - Selecionar orçamento pendente
   - Clicar em "Ver Detalhes"
   - Desmarcar alguns serviços
   - Clicar em "Aprovar Parcialmente"
   - Confirmar aprovação
   - Verificar atualização de status

3. ✅ **Rejeitar orçamento**
   - Selecionar orçamento pendente
   - Clicar em "Ver Detalhes"
   - Clicar em "Rejeitar"
   - Confirmar rejeição
   - Verificar atualização de status

#### Casos de Teste Negativos
1. ❌ **Tentar aprovar orçamento já aprovado**
   - Tentar aprovar orçamento com status diferente de pendente
   - Verificar mensagem de erro apropriada

### 4. Visualização de Checklist

#### Casos de Teste Positivos
1. ✅ **Visualizar checklist de parceiro**
   - Acessar seção "Evidências de Parceiros"
   - Clicar em botão de categoria • parceiro
   - Verificar exibição correta do checklist
   - Verificar evidências carregadas
   - Verificar lightbox ao clicar nas imagens

#### Casos de Teste Negativos
1. ❌ **Tentar visualizar checklist inexistente**
   - Tentar acessar checklist que não existe
   - Verificar mensagem apropriada

## 📱 Testes de Responsividade

### Mobile
1. ✅ **Dashboard em mobile**
   - Acessar dashboard em dispositivo mobile
   - Verificar layout adaptado
   - Verificar navegação touch

2. ✅ **Formulários em mobile**
   - Preencher formulários em mobile
   - Verificar tamanho adequado dos campos
   - Verificar teclado apropriado por tipo de campo

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
   - Medir tempo de carregamento de listas
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

Para dúvidas ou problemas com os testes de cliente:
- 📧 **Email:** client-qa@proline.com.br
- 📞 **Slack:** #client-quality-assurance
- 📚 **Documentação:** Esta pasta contém todos os recursos necessários

---

**Última Atualização:** 14 de Outubro de 2025  
**Responsável:** Equipe de Qualidade ProLine Hub