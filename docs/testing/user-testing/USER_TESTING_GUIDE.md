# 🧪 Guia Completo de Testes de Usuário - ProLine Hub

**Data:** 14 de Outubro de 2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso

## 📋 Visão Geral

Este guia descreve todos os testes que podem ser realizados por um usuário final no sistema ProLine Hub, cobrindo todos os fluxos principais da aplicação organizados por contexto de usuário.

## 🎯 Público-Alvo

- **Clientes** - Proprietários de veículos que usam o sistema para solicitar serviços
- **Parceiros** - Prestadores de serviço (mecânicos, funileiros, pintores, etc.)
- **Administradores** - Equipe interna da ProLine Hub
- **Especialistas** - Analistas que realizam inspeções técnicas

## 🧭 Estrutura do Guia

1. [Autenticação e Acesso](#-autenticação-e-acesso)
2. [Fluxos do Cliente](#-fluxos-do-cliente)
3. [Fluxos do Parceiro](#-fluxos-do-parceiro)
4. [Fluxos do Administrador](#-fluxos-do-administrador)
5. [Fluxos do Especialista](#-fluxos-do-especialista)
6. [Fluxos Compartilhados](#-fluxos-compartilhados)

---

## 🔐 Autenticação e Acesso

### Login

**URL:** `/login`  
**Credenciais de Teste:** 
- Email: `cliente@teste.com` 
- Senha: `123qwe`

**Casos de Teste:**

1. ✅ **Login com credenciais válidas**
   - Acessar `/login`
   - Preencher email e senha válidos
   - Clicar em "Entrar"
   - Verificar redirecionamento para `/dashboard`

2. ❌ **Login com credenciais inválidas**
   - Acessar `/login`
   - Preencher email ou senha inválidos
   - Clicar em "Entrar"
   - Verificar mensagem de erro "Credenciais inválidas"

3. 🔐 **Login com conta inativa**
   - Acessar `/login`
   - Preencher credenciais de conta desativada
   - Clicar em "Entrar"
   - Verificar mensagem de erro "Conta desativada"

### Recuperação de Senha

**URL:** `/recuperar-senha`

**Casos de Teste:**

1. ✅ **Recuperação com email válido**
   - Acessar `/recuperar-senha`
   - Preencher email cadastrado
   - Clicar em "Enviar"
   - Verificar mensagem "Instruções enviadas para seu email"

2. ❌ **Recuperação com email inválido**
   - Acessar `/recuperar-senha`
   - Preencher email não cadastrado
   - Clicar em "Enviar"
   - Verificar mensagem de erro "Email não encontrado"

3. 📧 **Link de recuperação expirado**
   - Usar link de recuperação com mais de 24h
   - Tentar definir nova senha
   - Verificar mensagem "Link expirado"

### Cadastro

**URL:** `/cadastro`

**Casos de Teste:**

1. ✅ **Cadastro com dados válidos**
   - Acessar `/cadastro`
   - Preencher todos os campos obrigatórios
   - Clicar em "Cadastrar"
   - Verificar redirecionamento para confirmação

2. ❌ **Cadastro com dados inválidos**
   - Acessar `/cadastro`
   - Preencher campos com dados inválidos
   - Clicar em "Cadastrar"
   - Verificar mensagens de validação

3. 🔐 **Cadastro com CPF já existente**
   - Acessar `/cadastro`
   - Preencher CPF já cadastrado
   - Clicar em "Cadastrar"
   - Verificar mensagem "CPF já cadastrado"

---

## 👥 Fluxos do Cliente

### Dashboard do Cliente

**URL:** `/dashboard`

**Casos de Teste:**

1. ✅ **Visualização do Dashboard**
   - Fazer login como cliente
   - Verificar exibição correta dos contadores:
     - Veículos Cadastrados
     - Coletas Pendentes
     - Orçamentos Pendentes
     - Orçamentos Aprovados

2. ✅ **Navegação entre seções**
   - Clicar em cada botão do menu lateral
   - Verificar carregamento correto das páginas

### Cadastro de Veículo

**URL:** `/dashboard` → Botão "Adicionar Veículo"

**Casos de Teste:**

1. ✅ **Cadastro de veículo com dados válidos**
   - Acessar dashboard
   - Clicar em "Adicionar Veículo"
   - Preencher dados válidos (placa, marca, modelo, ano)
   - Clicar em "Salvar"
   - Verificar veículo na lista

2. ❌ **Cadastro com placa inválida**
   - Tentar cadastrar veículo com placa mal formatada
   - Verificar mensagem de erro

3. 🔢 **Cadastro com ano inválido**
   - Tentar cadastrar veículo com ano futuro ou muito antigo
   - Verificar validação apropriada

### Definição de Coleta

**URL:** `/dashboard` → Seção "Coletas Pendentes"

**Casos de Teste:**

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

3. ❌ **Tentar definir coleta sem endereço**
   - Tentar definir coleta sem selecionar endereço
   - Verificar mensagem de erro

### Aprovação de Orçamento

**URL:** `/dashboard` → Seção "Orçamentos Pendentes"

**Casos de Teste:**

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

3. ❌ **Rejeitar orçamento**
   - Selecionar orçamento pendente
   - Clicar em "Ver Detalhes"
   - Clicar em "Rejeitar"
   - Confirmar rejeição
   - Verificar atualização de status

---

## 🤝 Fluxos do Parceiro

### Dashboard do Parceiro

**URL:** `/dashboard/partner`

**Casos de Teste:**

1. ✅ **Visualização do Dashboard**
   - Fazer login como parceiro
   - Verificar exibição correta dos contadores:
     - Orçamentos Pendentes
     - Orçamentos Aprovados
     - Serviços em Execução
     - Serviços Concluídos

2. ✅ **Visualização de checklist pendente**
   - Verificar exibição de checklist na seção "Solicitações de Orçamentos Pendentes"

### Checklist do Parceiro

**URL:** `/dashboard/partner/checklist?quoteId=...`

**Casos de Teste:**

1. ✅ **Carregar checklist**
   - Acessar checklist via dashboard
   - Verificar carregamento correto do template
   - Verificar dados do veículo

2. ✅ **Preencher checklist**
   - Marcar itens como OK/NOK/NA
   - Adicionar comentários
   - Adicionar severidade para itens NOK

3. ✅ **Adicionar evidências**
   - Clicar em "Adicionar Evidência" em itens NOK
   - Fazer upload de imagem
   - Verificar preview da imagem
   - Remover evidência

4. ✅ **Solicitar peças**
   - Clicar em "Solicitar Peça" em itens apropriados
   - Preencher formulário de solicitação
   - Salvar solicitação
   - Verificar exibição na lista

5. ✅ **Salvar rascunho**
   - Preencher alguns campos do checklist
   - Clicar em "Salvar Rascunho"
   - Verificar mensagem de sucesso
   - Recarregar página e verificar dados mantidos

6. ✅ **Submeter checklist**
   - Completar checklist
   - Clicar em "Submeter"
   - Confirmar submissão
   - Verificar bloqueio de edição

### Visualização de Evidências

**URL:** `/dashboard/partner` → Seção "Evidências"

**Casos de Teste:**

1. ✅ **Visualizar evidências de outros parceiros**
   - Verificar exibição de botões por categoria • parceiro
   - Clicar em botão para abrir viewer
   - Verificar exibição correta de itens e evidências

---

## 👑 Fluxos do Administrador

### Dashboard do Administrador

**URL:** `/dashboard/admin`

**Casos de Teste:**

1. ✅ **Visualização do Dashboard**
   - Fazer login como administrador
   - Verificar exibição correta das seções:
     - Clientes
     - Parceiros
     - Veículos
     - Orçamentos
     - Coletas

### Gestão de Clientes

**URL:** `/dashboard/admin/clients`

**Casos de Teste:**

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

### Gestão de Parceiros

**URL:** `/dashboard/admin/partners`

**Casos de Teste:**

1. ✅ **Listar parceiros**
   - Acessar página de parceiros
   - Verificar paginação e filtros
   - Verificar ordenação por colunas

2. ✅ **Visualizar detalhes do parceiro**
   - Clicar em parceiro da lista
   - Verificar exibição de dados do parceiro
   - Verificar lista de serviços

3. ✅ **Aprovar/rejeitar orçamento do parceiro**
   - Acessar orçamentos pendentes do parceiro
   - Aprovar ou rejeitar orçamento
   - Verificar atualização de status

### Visualização de Checklists

**URL:** `/dashboard/admin` → Seção "Evidências"

**Casos de Teste:**

1. ✅ **Visualizar checklists de parceiros**
   - Verificar exibição de botões por categoria • parceiro
   - Clicar em botão para abrir viewer
   - Verificar exibição correta de itens e evidências

---

## 🔍 Fluxos do Especialista

### Dashboard do Especialista

**URL:** `/dashboard/specialist`

**Casos de Teste:**

1. ✅ **Visualização do Dashboard**
   - Fazer login como especialista
   - Verificar exibição correta das seções:
     - Veículos para Análise
     - Análises em Andamento
     - Análises Concluídas

### Análise de Veículo

**URL:** `/dashboard/specialist/analysis?vehicleId=...`

**Casos de Teste:**

1. ✅ **Iniciar análise**
   - Acessar veículo para análise
   - Clicar em "Iniciar Análise"
   - Verificar criação de checklist

2. ✅ **Preencher checklist de análise**
   - Marcar itens como OK/NOK/NA
   - Adicionar comentários
   - Adicionar severidade para itens NOK

3. ✅ **Adicionar evidências na análise**
   - Clicar em "Adicionar Evidência" em itens NOK
   - Fazer upload de imagem
   - Verificar preview da imagem

4. ✅ **Finalizar análise**
   - Completar checklist
   - Clicar em "Finalizar Análise"
   - Confirmar finalização
   - Verificar criação de orçamento

### Visualização de Checklists

**URL:** `/dashboard/specialist` → Seção "Evidências"

**Casos de Teste:**

1. ✅ **Visualizar checklists de análise**
   - Verificar exibição de botões por categoria • especialista
   - Clicar em botão para abrir viewer
   - Verificar exibição correta de itens e evidências

---

## 🔄 Fluxos Compartilhados

### Timeline do Veículo

**URLs:** 
- `/dashboard` (cliente)
- `/dashboard/partner` (parceiro)
- `/dashboard/admin` (administrador)
- `/dashboard/specialist` (especialista)

**Casos de Teste:**

1. ✅ **Visualização da timeline**
   - Acessar detalhes de veículo em qualquer contexto
   - Verificar exibição correta da timeline
   - Verificar eventos ordenados cronologicamente

2. ✅ **Atualização da timeline**
   - Realizar ação que afeta a timeline (ex: aprovar orçamento)
   - Verificar atualização imediata da timeline

### Notificações

**URLs:** 
- `/dashboard` (cliente)
- `/dashboard/partner` (parceiro)
- `/dashboard/admin` (administrador)
- `/dashboard/specialist` (especialista)

**Casos de Teste:**

1. ✅ **Visualização de notificações**
   - Verificar exibição do contador de notificações
   - Clicar no ícone de notificações
   - Verificar lista de notificações

2. ✅ **Marcação de notificações como lidas**
   - Clicar em notificação não lida
   - Verificar marcação como lida
   - Verificar atualização do contador

### Perfil do Usuário

**URLs:** 
- `/meu-perfil` (todos os contextos)

**Casos de Teste:**

1. ✅ **Visualização de dados do perfil**
   - Acessar página de perfil
   - Verificar exibição correta dos dados

2. ✅ **Edição de dados do perfil**
   - Clicar em "Editar Perfil"
   - Modificar dados
   - Salvar alterações
   - Verificar atualização

3. ✅ **Alteração de senha**
   - Acessar aba "Segurança"
   - Preencher formulário de alteração de senha
   - Salvar nova senha
   - Verificar sucesso na operação

---

## 🧪 Dados de Teste

### Contas de Teste

#### Cliente
- **Email:** `cliente@teste.com`
- **Senha:** `123qwe`
- **Veículos:** 3 veículos cadastrados

#### Parceiro (Mecânica)
- **Email:** `mecanica@parceiro.com`
- **Senha:** `123qwe`
- **Categoria:** Mecânica
- **Orçamentos:** 2 orçamentos pendentes

#### Parceiro (Funilaria/Pintura)
- **Email:** `funilaria@parceiro.com`
- **Senha:** `123qwe`
- **Categoria:** Funilaria/Pintura
- **Orçamentos:** 1 orçamento pendente

#### Administrador
- **Email:** `admin@proline.com`
- **Senha:** `123qwe`

#### Especialista
- **Email:** `especialista@proline.com`
- **Senha:** `123qwe`

### Dados de Teste Prontos

#### Veículos para Teste
1. **ABC1234** - Volkswagen Gol 2020 (Aguardando Definição de Coleta)
2. **XYZ5678** - Fiat Uno 2015 (Coleta Aprovada)
3. **DEF9012** - Chevrolet Onix 2022 (Análise Finalizada)

#### Orçamentos para Teste
1. **Orçamento Mecânica** - Veículo ABC1234 (Pendente de Aprovação)
2. **Orçamento Funilaria** - Veículo XYZ5678 (Aprovado Parcialmente)
3. **Orçamento Pintura** - Veículo DEF9012 (Rejeitado)

---

## 📱 Testes de Responsividade

### Dispositivos para Teste

#### Mobile
- **iPhone SE** (375×667)
- **Samsung Galaxy S20** (360×800)

#### Tablet
- **iPad Mini** (768×1024)
- **iPad Pro** (1024×1366)

#### Desktop
- **Laptop** (1366×768)
- **Desktop HD** (1920×1080)

### Casos de Teste de Responsividade

1. ✅ **Navegação em dispositivos móveis**
   - Verificar menu hamburguer
   - Verificar disposição de cards
   - Verificar campos de formulário

2. ✅ **Visualização de checklist em mobile**
   - Verificar layout adaptado
   - Verificar tamanho dos botões
   - Verificar upload de fotos

3. ✅ **Visualização de evidências em diferentes tamanhos**
   - Verificar grid de evidências
   - Verificar lightbox responsivo
   - Verificar navegação touch

---

## 🐛 Relato de Bugs

### Como Reportar Bugs

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

### Bugs Conhecidos

#### Checklist do Parceiro
1. **Evidências não carregam após refresh**
   - **Status:** Em investigação
   - **Workaround:** Não atualizar a página durante preenchimento

2. **Solicitações de peças não salvam**
   - **Status:** Corrigido na branch `develop`
   - **Deploy:** Agendado para próxima release

#### Dashboard do Cliente
1. **Contador de veículos duplicado**
   - **Status:** Corrigido
   - **Deploy:** Em produção

2. **Timeline não atualiza em tempo real**
   - **Status:** Em desenvolvimento
   - **Previsão:** Próxima sprint

---

## 📈 Métricas de Qualidade

### Critérios de Aceite para Testes

#### Funcionalidade
- ✅ **100% dos fluxos principais funcionando**
- ✅ **0 erros críticos em produção**
- ✅ **< 5% de erros em funcionalidades secundárias**

#### Usabilidade
- ✅ **Tempo de carregamento < 3 segundos**
- ✅ **Navegação intuitiva em todos os contextos**
- ✅ **Feedback visual claro para todas as ações**

#### Acessibilidade
- ✅ **WCAG 2.1 AA Compliance**
- ✅ **Teclado navegável em 100% das páginas**
- ✅ **Leitores de tela compatíveis**

#### Performance
- ✅ **Lighthouse score > 90 em mobile**
- ✅ **Bundle size < 2MB**
- ✅ **First Contentful Paint < 1.5s**

#### Segurança
- ✅ **0 vulnerabilidades críticas**
- ✅ **Autenticação obrigatória em todas as rotas**
- ✅ **Rate limiting implementado**

---

## 🚀 Próximos Passos

### Testes Automatizados

1. **Cypress E2E Tests**
   - Scripts de teste para os principais fluxos
   - Execução em pipeline CI/CD
   - Relatórios automatizados

2. **Testes de Regressão**
   - Verificação automática após cada deploy
   - Comparação de screenshots
   - Detecção de breaking changes

### Melhorias Contínuas

1. **Expansão da Cobertura de Testes**
   - Adicionar testes para fluxos secundários
   - Incluir casos de erro nos testes
   - Testar integração com APIs externas

2. **Documentação de Testes**
   - Atualizar este guia conforme novas funcionalidades
   - Adicionar exemplos de código para testes automatizados
   - Criar vídeos tutoriais para testes manuais

3. **Ferramentas de Teste**
   - Implementar testes A/B para novas features
   - Adicionar ferramentas de heatmap para UX
   - Integrar testes de usabilidade automatizados

---

## 📞 Suporte

### Problemas Comuns

**Login não funciona:**
- Verificar conexão com internet
- Verificar email e senha
- Tentar recuperar senha
- Limpar cache e cookies do navegador

**Página não carrega:**
- Verificar se outros sites estão acessíveis
- Tentar recarregar a página (F5)
- Tentar em outro navegador
- Verificar se há atualizações do navegador

**Dados não aparecem:**
- Verificar filtros aplicados
- Tentar limpar filtros
- Recarregar a página
- Verificar permissões de acesso

### Contato

Para suporte técnico ou dúvidas sobre testes:
- 📧 **Email:** suporte@proline.com.br
- 📞 **Telefone:** (11) 99999-9999
- 🌐 **Chat:** Acessar via ícone no canto inferior direito

### Feedback

Para enviar feedback sobre a experiência de uso:
- 📝 **Formulário:** Acessar através do menu "Ajuda" → "Enviar Feedback"
- 📧 **Email:** feedback@proline.com.br
- 📊 **Pesquisa:** Participar das pesquisas periódicas enviadas por email

---

**Última Atualização:** 14 de Outubro de 2025  
**Versão:** 1.0