# 📚 Glossário - Documentação de Testes de Usuário

Este documento define os termos técnicos e de negócio usados na documentação de testes de usuário do sistema ProLine Hub.

## 📋 Termos Técnicos

### Testes de Usuário
Avaliação sistemática do sistema ProLine Hub realizada por usuários reais ou representantes para verificar se as funcionalidades atendem aos requisitos e expectativas de uso.

### Caso de Teste
Cenário específico que descreve um conjunto de condições ou variáveis sob as quais um testador determinará se um sistema satisfaz os requisitos ou funciona corretamente.

### Suite de Testes
Coleção de casos de teste relacionados que são agrupados para testar uma funcionalidade ou módulo específico do software.

### Teste Positivo (✅)
Teste que verifica se o sistema se comporta corretamente quando recebe entradas válidas e esperadas.

### Teste Negativo (❌)
Teste que verifica se o sistema trata adequadamente entradas inválidas, inesperadas ou condições de erro.

### Teste de Regressão
Teste realizado para garantir que funcionalidades existentes continuem funcionando corretamente após mudanças no código.

### Teste de Aceitação
Teste realizado para verificar se o sistema atende aos critérios de aceitação definidos pelo cliente ou pela equipe de produto.

### Teste de Integração
Teste que verifica se diferentes módulos ou serviços funcionam bem juntos quando combinados.

### Teste Unitário
Teste que verifica se unidades individuais de código (funções, métodos, classes) funcionam conforme o esperado.

### Teste de Carga
Teste que verifica o desempenho do sistema sob uma carga de trabalho esperada ou superior ao normal.

### Teste de Stress
Teste que verifica o comportamento do sistema sob condições extremas ou carga máxima.

### Teste de Segurança
Teste que verifica se o sistema é seguro contra acessos não autorizados, vazamentos de dados e outras ameaças.

### Teste de Usabilidade
Teste que avalia quão fácil e intuitivo é usar o sistema para usuários reais.

### Teste de Acessibilidade
Teste que verifica se o sistema é utilizável por pessoas com deficiências, incluindo deficiências visuais, auditivas, motoras e cognitivas.

## 👥 Perfis de Usuário

### Cliente
Proprietário do veículo que interage com o sistema para solicitar serviços, aprovar orçamentos e acompanhar o status dos veículos.

### Parceiro
Prestador de serviço (mecânico, funileiro, pintor, etc.) que utiliza o sistema para criar checklists, orçamentos e executar serviços.

### Administrador
Membro da equipe interna da ProLine Hub que gerencia usuários, parceiros, aprova orçamentos e monitora o sistema.

### Especialista
Analista/profissional que realiza inspeções técnicas nos veículos e gera relatórios de análise.

### Especialista de Segurança
Profissional responsável por garantir que o sistema atenda aos padrões de segurança e proteção de dados.

## 🧪 Tipos de Teste

### Teste Manual
Teste realizado por um humano que interage diretamente com o sistema para verificar seu funcionamento.

### Teste Automatizado
Teste realizado por scripts ou ferramentas que simulam a interação do usuário com o sistema.

### Teste Exploratório
Teste informal onde o testador explora o sistema sem um plano específico para encontrar problemas.

### Teste de Caixa Preta
Teste onde o testador não tem conhecimento da implementação interna do sistema.

### Teste de Caixa Branca
Teste onde o testador tem conhecimento da implementação interna do sistema.

### Teste A/B
Teste que compara duas versões de uma funcionalidade para determinar qual performa melhor.

## 📱 Dispositivos e Ambientes

### Mobile
Dispositivos com telas pequenas como smartphones, geralmente com largura de tela entre 320px e 768px.

### Tablet
Dispositivos com telas médias como tablets, geralmente com largura de tela entre 769px e 1024px.

### Desktop
Computadores e laptops com telas grandes, geralmente com largura de tela acima de 1025px.

### Responsividade
Capacidade do sistema de se adaptar a diferentes tamanhos de tela e dispositivos.

### Cross-browser
Compatibilidade do sistema com diferentes navegadores web (Chrome, Firefox, Safari, Edge).

### Cross-platform
Compatibilidade do sistema com diferentes sistemas operacionais (Windows, macOS, Linux, iOS, Android).

## 🔧 Ferramentas de Teste

### Cypress
Framework de testes end-to-end para aplicações web modernas.

### Jest
Framework de testes unitários para JavaScript/TypeScript.

### Playwright
Framework de testes end-to-end que suporta múltiplos navegadores.

### Selenium
Framework de automação de navegadores para testes web.

### Postman
Ferramenta para testar APIs RESTful.

### Insomnia
Ferramenta para testar APIs RESTful e GraphQL.

### Lighthouse
Ferramenta automatizada do Google para melhorar a qualidade de páginas web.

### axe-core
Biblioteca para testes automatizados de acessibilidade.

## 🎯 Métricas e Indicadores

### Cobertura de Testes
Percentual do código que é executado durante os testes automatizados.

### Taxa de Sucesso
Percentual de testes que passam com sucesso em relação ao total de testes executados.

### Tempo de Execução
Tempo necessário para executar uma suite de testes completa.

### Tempo de Carregamento
Tempo necessário para carregar uma página ou funcionalidade.

### Taxa de Defeitos
Número de defeitos encontrados em relação ao total de funcionalidades testadas.

### MTTR (Mean Time To Repair)
Tempo médio necessário para corrigir um defeito identificado.

### MTBF (Mean Time Between Failures)
Tempo médio entre falhas do sistema.

## 🐛 Gerenciamento de Bugs

### Bug
Defeito ou erro no sistema que causa comportamento inesperado ou incorreto.

### Issue
Registro formal de um problema, solicitação ou tarefa no sistema de gerenciamento de projetos.

### Ticket
Solicitação de suporte ou problema registrado no sistema de help desk.

### Relato de Bug
Documento que descreve um problema encontrado durante os testes, incluindo passos para reproduzir, resultado esperado e resultado obtido.

### Prioridade de Bug
Classificação da importância de um bug com base em seu impacto no sistema e nos usuários.

### Severidade de Bug
Classificação do impacto técnico de um bug no sistema.

## 🔐 Segurança

### Vulnerabilidade
Fraqueza no sistema que pode ser explorada para causar danos.

### CVE (Common Vulnerabilities and Exposures)
Sistema de identificação padrão para vulnerabilidades de segurança conhecidas.

### Penetration Test (Pentest)
Teste de segurança que simula ataques reais para identificar vulnerabilidades.

### OWASP
Organização que fornece diretrizes e práticas recomendadas para segurança de aplicações web.

## 📈 Qualidade

### QA (Quality Assurance)
Conjunto de atividades destinadas a garantir a qualidade do software durante o processo de desenvolvimento.

### QC (Quality Control)
Conjunto de atividades destinadas a verificar a qualidade do software após o desenvolvimento.

### KPI (Key Performance Indicator)
Indicador mensurável que demonstra o quão efetivamente uma empresa está alcançando seus objetivos-chave.

### SLA (Service Level Agreement)
Acordo entre provedor de serviço e cliente que define o nível esperado de serviço.

## 🔄 Metodologias

### Agile Testing
Abordagem de teste que segue os princípios da metodologia ágil.

### BDD (Behavior Driven Development)
Abordagem de desenvolvimento que incentiva colaboração entre desenvolvedores, QA e stakeholders não-técnicos.

### TDD (Test Driven Development)
Abordagem de desenvolvimento onde testes são escritos antes do código.

### CI/CD (Continuous Integration/Continuous Deployment)
Prática de integração e deploy contínuos de código.

## 📊 Relatórios

### Relatório de Testes
Documento que resume os resultados dos testes realizados, incluindo métricas, bugs encontrados e recomendações.

### Plano de Testes
Documento que descreve a estratégia, abordagem, recursos e cronograma das atividades de teste.

### Caso de Teste
Documento que descreve um cenário de teste específico com entradas, ações e resultados esperados.

### Plano de Liberação
Documento que descreve os critérios para liberar uma nova versão do software em produção.

## 🎨 Design e UX

### UI (User Interface)
Interface do usuário, incluindo elementos visuais com os quais o usuário interage.

### UX (User Experience)
Experiência do usuário ao interagir com o sistema.

### Wireframe
Representação visual esquemática de uma interface de usuário.

### Mockup
Representação visual detalhada e estática de uma interface de usuário.

### Protótipo
Representação interativa de uma interface de usuário que simula a funcionalidade real.

## 🔧 Infraestrutura

### Staging
Ambiente de teste que replica a produção para validação final antes do deploy.

### Produção
Ambiente onde os usuários finais acessam o sistema.

### Desenvolvimento
Ambiente onde os desenvolvedores criam e testam código.

### Homologação
Ambiente onde clientes validam funcionalidades antes da liberação em produção.