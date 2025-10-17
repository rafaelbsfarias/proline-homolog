# 🧪 Fluxos de Teste - Parceiro

Este documento descreve os fluxos de teste específicos para o contexto do parceiro no sistema ProLine Hub.

## 📋 Visão Geral

O parceiro é o prestador de serviço que interage com o sistema para:
- Visualizar solicitações de orçamento
- Criar checklists de vistoria
- Adicionar evidências (fotos/vídeos)
- Solicitar peças por item
- Submeter orçamentos para aprovação

## 🎯 Objetivos de Teste

1. **Validar fluxos principais do parceiro**
2. **Verificar consistência de dados**
3. **Testar cenários de erro**
4. **Avaliar experiência do usuário**
5. **Garantir isolamento por parceiro**

## 🔄 Fluxos Principais

### 1. Acesso ao Checklist

#### Casos de Teste Positivos
1. ✅ **Acesso ao checklist via dashboard**
   - Fazer login como parceiro
   - Acessar `/dashboard/partner`
   - Clicar em checklist pendente
   - Verificar redirecionamento correto

2. ✅ **Acesso ao checklist via URL direta**
   - Acessar `/dashboard/partner/checklist?quoteId=...`
   - Verificar carregamento correto do checklist

#### Casos de Teste Negativos
1. ❌ **Tentar acessar checklist de outro parceiro**
   - Fazer login como parceiro A
   - Tentar acessar checklist de parceiro B
   - Verificar redirecionamento ou erro 403

### 2. Carregamento do Checklist

#### Casos de Teste Positivos
1. ✅ **Carregar checklist existente**
   - Acessar checklist com dados pré-existentes
   - Verificar carregamento correto de:
     - Dados do veículo
     - Itens do checklist
     - Evidências existentes
     - Solicitações de peças

2. ✅ **Inicializar novo checklist**
   - Acessar checklist sem dados pré-existentes
   - Verificar inicialização com template correto

#### Casos de Teste Negativos
1. ❌ **Tentar carregar checklist inexistente**
   - Acessar checklist com ID inválido
   - Verificar mensagem de erro apropriada

### 3. Preenchimento do Checklist

#### Casos de Teste Positivos
1. ✅ **Marcar itens como OK/NOK/NA**
   - Selecionar item do checklist
   - Marcar como OK/NOK/NA
   - Verificar mudança de estado visual

2. ✅ **Adicionar comentários**
   - Adicionar comentários em itens
   - Verificar salvamento automático

3. ✅ **Adicionar severidade**
   - Marcar itens como NOK
   - Adicionar severidade (baixa/média/alta)
   - Verificar salvamento

#### Casos de Teste Negativos
1. ❌ **Tentar marcar item inválido**
   - Tentar marcar item com status inválido
   - Verificar validação apropriada

### 4. Upload de Evidências

#### Casos de Teste Positivos
1. ✅ **Upload de imagem válida**
   - Clicar em "Adicionar Evidência" em item NOK
   - Selecionar imagem JPG/PNG válida
   - Verificar upload com sucesso
   - Verificar preview da imagem

2. ✅ **Upload múltiplo**
   - Adicionar múltiplas evidências por item
   - Verificar todas são salvas corretamente

3. ✅ **Remoção de evidência**
   - Clicar em "Remover" em evidência existente
   - Confirmar remoção
   - Verificar que evidência desaparece

#### Casos de Teste Negativos
1. ❌ **Upload de arquivo inválido**
   - Tentar fazer upload de arquivo não-imagem
   - Verificar mensagem de erro apropriada

2. ❌ **Upload de arquivo muito grande**
   - Tentar fazer upload de imagem > 5MB
   - Verificar validação de tamanho

### 5. Solicitação de Peças

#### Casos de Teste Positivos
1. ✅ **Criar solicitação de peça**
   - Clicar em "Solicitar Peça" em item
   - Preencher formulário com dados válidos
   - Clicar em "Salvar"
   - Verificar criação da solicitação

2. ✅ **Editar solicitação de peça**
   - Acessar solicitação existente
   - Modificar dados
   - Salvar alterações
   - Verificar atualização

3. ✅ **Remover solicitação de peça**
   - Clicar em "Remover" em solicitação existente
   - Confirmar remoção
   - Verificar que solicitação desaparece

#### Casos de Teste Negativos
1. ❌ **Criar solicitação sem título**
   - Tentar criar solicitação sem título
   - Verificar validação apropriada

2. ❌ **Editar solicitação de outro parceiro**
   - Tentar editar solicitação de outro parceiro
   - Verificar erro 403

### 6. Salvamento de Rascunho

#### Casos de Teste Positivos
1. ✅ **Salvar rascunho com dados**
   - Preencher checklist parcialmente
   - Clicar em "Salvar Rascunho"
   - Verificar mensagem de sucesso
   - Recarregar página
   - Verificar dados mantidos

2. ✅ **Salvar rascunho vazio**
   - Acessar checklist novo
   - Clicar em "Salvar Rascunho" sem alterações
   - Verificar mensagem de sucesso

#### Casos de Teste Negativos
1. ❌ **Salvar com dados inválidos**
   - Preencher campos com dados inválidos
   - Tentar salvar
   - Verificar validação apropriada

### 7. Submissão do Checklist

#### Casos de Teste Positivos
1. ✅ **Submeter checklist completo**
   - Preencher todos os itens obrigatórios
   - Clicar em "Submeter"
   - Confirmar submissão
   - Verificar bloqueio de edição

2. ✅ **Submeter checklist parcial**
   - Preencher apenas alguns itens
   - Clicar em "Submeter"
   - Confirmar submissão
   - Verificar bloqueio de edição

#### Casos de Teste Negativos
1. ❌ **Tentar submeter checklist já submetido**
   - Tentar submeter checklist com status "submitted"
   - Verificar mensagem de erro apropriada

2. ❌ **Tentar editar após submissão**
   - Submeter checklist
   - Tentar editar campos
   - Verificar campos bloqueados

### 8. Visualização de Evidências de Outros Parceiros

#### Casos de Teste Positivos
1. ✅ **Visualizar checklist de outros parceiros**
   - Acessar `PartnerEvidencesSection`
   - Verificar botões por `categoria • parceiro`
   - Clicar em botão
   - Verificar abertura do viewer
   - Verificar exibição correta de itens e evidências

2. ✅ **Navegar por evidências**
   - Abrir viewer com múltiplas evidências
   - Navegar usando setas
   - Verificar lightbox funcionando

#### Casos de Teste Negativos
1. ❌ **Tentar visualizar checklist inexistente**
   - Tentar abrir viewer com parâmetros inválidos
   - Verificar mensagem apropriada

## 📱 Testes de Responsividade

### Mobile
1. ✅ **Checklist em mobile**
   - Acessar checklist em dispositivo mobile
   - Verificar layout adaptado
   - Verificar campos de formulário acessíveis

2. ✅ **Upload de evidências em mobile**
   - Fazer upload de fotos tiradas com câmera
   - Verificar preview adequado
   - Verificar salvamento

### Tablet
1. ✅ **Checklist em tablet**
   - Acessar checklist em tablet
   - Verificar layout adaptado
   - Verificar navegação touch

### Desktop
1. ✅ **Checklist em desktop**
   - Acessar checklist em desktop
   - Verificar layout completo
   - Verificar navegação com mouse

## 🔧 Testes de Performance

### Carregamento
1. ✅ **Tempo de carregamento do checklist**
   - Medir tempo de carregamento da página
   - Verificar < 3 segundos

2. ✅ **Tempo de upload de evidências**
   - Medir tempo de upload de múltiplas imagens
   - Verificar barra de progresso

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

Para dúvidas ou problemas com os testes de parceiro:
- 📧 **Email:** partner-qa@proline.com.br
- 📞 **Slack:** #partner-quality-assurance
- 📚 **Documentação:** Esta pasta contém todos os recursos necessários

---

**Última Atualização:** 14 de Outubro de 2025  
**Responsável:** Equipe de Qualidade ProLine Hub