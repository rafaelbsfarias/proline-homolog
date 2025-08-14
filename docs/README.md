# 📚 Documentação do Projeto

Esta pasta contém toda a documentação técnica do projeto, organizada por categorias para facilitar a navegação e manutenção.

## 📂 Estrutura da Documentação

### � [Guia de Migração](./MIGRATION_GUIDE.md)
Referência para encontrar arquivos após reorganização

### 📖 [Instruções de Desenvolvimento](./DEVELOPMENT_INSTRUCTIONS.md)
Instruções gerais de desenvolvimento do projeto

### �🚀 [Setup](./setup/)
Guias de configuração e instalação do projeto

- **[QUICK_START.md](./setup/QUICK_START.md)** - Guia rápido para começar
- **[SUPABASE_LOCAL_SETUP.md](./setup/SUPABASE_LOCAL_SETUP.md)** - Configuração completa do ambiente local Supabase
- **[EDGE_FUNCTIONS_SETUP.md](./setup/EDGE_FUNCTIONS_SETUP.md)** - Configuração das Edge Functions
- **[SUPABASE_EMAIL_SETUP.md](./setup/SUPABASE_EMAIL_SETUP.md)** - Configuração do sistema de emails
- **[EMAIL-PROVIDER-MODULE.md](./setup/EMAIL-PROVIDER-MODULE.md)** - Módulo de provedores de email
- **[CONFIGURACAO_EMAIL_SUPABASE_RESEND.md](./setup/CONFIGURACAO_EMAIL_SUPABASE_RESEND.md)** - Configuração de email com Supabase e Resend
- **[FASE1_COMPLETED.md](./setup/FASE1_COMPLETED.md)** - Documentação da Fase 1 concluída
- **[FASE_3_COMPLETED.md](./setup/FASE_3_COMPLETED.md)** - Documentação da Fase 3 concluída
- **[QA-OPTIMIZATION-COMPLETE.md](./setup/QA-OPTIMIZATION-COMPLETE.md)** - Otimizações de QA implementadas
- **[QA-SETUP-COMPLETE.md](./setup/QA-SETUP-COMPLETE.md)** - Setup de QA concluído
- **[FASE_3_COMPLETED.md](./setup/FASE_3_COMPLETED.md)** - Documentação da Fase 3 concluída

### 🏗️ [Architecture](./architecture/)
Documentação de arquitetura e fluxos do sistema

- **[FASE_4_ARCHITECTURE.md](./architecture/FASE_4_ARCHITECTURE.md)** - Arquitetura da Fase 4
- **[FINAL_AUTH_SOLUTION.md](./architecture/FINAL_AUTH_SOLUTION.md)** - Solução final de autenticação
- **[FLUXO_CRIACAO_USUARIO_SUPABASE.md](./architecture/FLUXO_CRIACAO_USUARIO_SUPABASE.md)** - Fluxo de criação de usuários

### ⚡ [Features](./features/)
Documentação de funcionalidades específicas

- **[VEHICLE_REGISTRATION_CLIENT.md](./features/VEHICLE_REGISTRATION_CLIENT.md)** - Cadastro de veículos para clientes
- **[EDGE_FUNCTION_RENAMING_GUIDE.md](./features/EDGE_FUNCTION_RENAMING_GUIDE.md)** - Guia de renomeação de Edge Functions
- **[QUICK_TESTING_GUIDE.md](./features/QUICK_TESTING_GUIDE.md)** - Guia de testes rápidos
- **[VEHICLE_REGISTRATION_ANALYSIS.md](./features/VEHICLE_REGISTRATION_ANALYSIS.md)** - Análise do cadastro de veículos
- **[CLIENT_CONTRACT_TERMS.md](./features/CLIENT_CONTRACT_TERMS.md)** - Termos de contrato do cliente
- **[PENDING_REGISTRATIONS_IMPLEMENTATION.md](./features/PENDING_REGISTRATIONS_IMPLEMENTATION.md)** - Implementação de cadastros pendentes
- **[USER_MODAL_FIX.md](./features/USER_MODAL_FIX.md)** - Correção do modal de usuário

### 🔧 [Troubleshooting](./troubleshooting/)
Guias de resolução de problemas e debugging

- **[EMAIL_DEBUG_GUIDE.md](./troubleshooting/EMAIL_DEBUG_GUIDE.md)** - Guia de debug de problemas com emails
- **[EMAIL_DIAGNOSTICS.md](./troubleshooting/EMAIL_DIAGNOSTICS.md)** - Diagnóstico de sistema de emails
- **[AUTHENTICATION_TROUBLESHOOTING.md](./troubleshooting/AUTHENTICATION_TROUBLESHOOTING.md)** - Solução de problemas de autenticação
- **[ERROR_HANDLING_IMPROVEMENTS.md](./troubleshooting/ERROR_HANDLING_IMPROVEMENTS.md)** - Melhorias de tratamento de erros
- **[RATE_LIMIT_TROUBLESHOOTING.md](./troubleshooting/RATE_LIMIT_TROUBLESHOOTING.md)** - Solução de problemas de rate limits
- **[LINT_GUIDE.md](./troubleshooting/LINT_GUIDE.md)** - Guia de linting
- **[QA-TOOLS.md](./troubleshooting/QA-TOOLS.md)** - Ferramentas de QA
- **[QUICK_LINT_REFERENCE.md](./troubleshooting/QUICK_LINT_REFERENCE.md)** - Referência rápida de linting
- **[VERCEL-BUILD-FIXED.md](./troubleshooting/VERCEL-BUILD-FIXED.md)** - Correção de problemas de build na Vercel
- **[QA-TOOLS.md](./troubleshooting/QA-TOOLS.md)** - Ferramentas de QA
- **[RATE_LIMIT_ANALYSIS.md](./troubleshooting/RATE_LIMIT_ANALYSIS.md)** - Análise de rate limits
- **[VERCEL-BUILD-FIXED.md](./troubleshooting/VERCEL-BUILD-FIXED.md)** - Correção de build no Vercel

### 🏛️ [Sistema](./sistema/)
Documentação específica do sistema

- **[DATABASE_SCHEMA_DOCUMENTATION.md](./sistema/database_schema_documentation.md)** - Documentação do esquema do banco de dados

### 🤝 [MOC](./moc/)
Mecanismo de Orquestração de Contexto para Refatoração Colaborativa

## 📋 Outros Documentos Importantes

- **[DEVELOPMENT_INSTRUCTIONS.md](./DEVELOPMENT_INSTRUCTIONS.md)** - Instruções gerais de desenvolvimento

## 🎯 Como Usar Esta Documentação

### Para Desenvolvedores Novos
1. Comece com **[QUICK_START.md](./setup/QUICK_START.md)**
2. Configure o ambiente seguindo **[SUPABASE_LOCAL_SETUP.md](./setup/SUPABASE_LOCAL_SETUP.md)**
3. Entenda a arquitetura em **[Architecture](./architecture/)**

### Para Debugging
1. Consulte **[Troubleshooting](./troubleshooting/)** para problemas comuns
2. Use **[DEBUG_EMAIL.md](./troubleshooting/DEBUG_EMAIL.md)** para problemas de email
3. Verifique **[AUTHENTICATION_FIX.md](./troubleshooting/AUTHENTICATION_FIX.md)** para problemas de auth

### Para Novas Features
1. Consulte **[Features](./features/)** para implementações similares
2. Siga os padrões de arquitetura em **[Architecture](./architecture/)**
3. Use os guias de setup em **[Setup](./setup/)**

## 📋 Convenções de Documentação

- **Setup**: Documentos que ensinam como configurar algo
- **Architecture**: Documentos que explicam como o sistema funciona
- **Features**: Documentos sobre funcionalidades específicas
- **Troubleshooting**: Documentos para resolver problemas
- **Sistema**: Documentação específica do domínio do projeto

## 🔄 Atualizando a Documentação

Quando adicionar nova documentação:
1. Coloque na pasta apropriada
2. Atualize este README.md
3. Use nomes descritivos para os arquivos
4. Mantenha a documentação atualizada com o código

---

📅 **Última atualização:** Agosto 2025  
👥 **Mantenedores:** Equipe de Desenvolvimento
