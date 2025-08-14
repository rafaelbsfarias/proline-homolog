### Histórias de Usuário - Sistema de Gestão de Veículos

**Gestão do Fluxo de Serviço do Veículo**

#### **Histórias do Sistema**


*   **US-101: Cadastro de Cliente(MVP)**
    *   Como sistema, eu quero permitir cadastro de clientes sem restrição.
*   **US-102: Cadastro de Fornecedor(MVP)**
    *   Como sistema, eu quero notificar cadastro solicitação de cadastro de fornecedor para os administradores.
*   **US-103: Envio de notificação (Futuro)**
    *   Como sistema, eu quero conseguir notificar via aba de atualizações uma mudança de status do veículo.
*   **US-104: Business Intelligence (Futuro)**
    *   Como sistema, eu quero conseguir gerar relatórios dinâmicos voltado para cada tipo de usuário.
*   **US-100: Envio de notificação(Futuro)**
    *   Como sistema, eu quero conseguir notificar via aba de atualizações uma mudança de status do veículo.


---

#### **Histórias Comuns a Todos os Perfis**

**MVP:**

*   **US-034: Recuperação de Senha**
    *   Como usuário do sistema (Cliente, Especialista, Fornecedor ou Administrador), eu quero poder recuperar minha senha através da tela de login, para que eu possa acessar minha conta mesmo se esquecer minhas credenciais.
*   **US-040: Mudança de Senha** 
    *   Como usuário do sistema (Cliente, Especialista, Fornecedor ou Administrador), eu quero poder modificar minha senha.


---

#### **Perfil: Administrativo/ADM**

**MVP:**

*   **US-018: Aprovar Recomendações e Orçamentos**
    *   Como Administrador, eu quero poder aprovar os orçamentos dos fornecedores antes de enviar ao cliente e ter a opção de alterar a classificação (Atacado/Varejo).
*   **US-019: Gerenciar Status Geral dos Carros**
    *   Como Administrador, eu quero ter uma visão geral e poder gerenciar o status de todos os carros no sistema, para monitorar o fluxo de trabalho.
*   **US-033: Alterar Senha**
    *   Como Administrador, eu quero poder alterar minha senha.
*   **US-027: Gestão de Usuários**
    *   Como Administrador, eu quero poder gerenciar os diferentes perfis de usuários (Cliente, Especialista, Fornecedor, ADM), para controlar acessos, permissões e troca de senha.
*   **US-031: Filtrar Lista de Carros**
  *   Como Administrador, eu quero poder filtrar a lista de carros que estou como responsável (ex: por status, por data), para encontrar rapidamente os veículos que precisam de atenção. 

**Futuro:**
*   **US-020: Gerar Relatório de Peças para Compra**
    *   Como Administrador, eu quero um relatório que liste as peças necessárias para compra com base nos serviços aprovados, para otimizar o processo de aquisição.
*   **US-021: Marcar Peças como Compradas**
    *   Como Administrador, eu quero poder marcar as peças do relatório como "compradas", para controlar o estoque e o andamento das aquisições.
*   **US-025: Integração com Pagamentos**
    *   Como Administrador, eu quero que a plataforma possa emitir boletos e processar pagamentos com cartão, para automatizar o processo financeiro.
*   **US-026: Integração com Marketplace de Peças**
    *   Como Administrador, eu quero que o sistema possa se integrar com marketplaces (ex: Mercado Livre) para automatizar a compra de peças, otimizando o tempo e custo.
*   **US-028: Métricas de Produtividade**
    *   Como Administrador, eu quero ter acesso a métricas de produtividade (tempo médio do carro no processo, carros atrasados), para identificar gargalos e otimizar a operação.
*   **US-029: Funcionalidade de Venda de Carros**
    *   Como Administrador, eu quero poder listar carros para venda no portal Proline, para expandir o negócio para um marketplace de veículos.
*   **US-022: Gerar Lista de Faturamento**
    *   Como Administrador, eu quero uma lista do que precisa ser faturado (para o financeiro), para garantir a emissão correta das faturas.
*   **US-023: Acompanhar Taxas de Fornecedores**
    *   Como Administrador, eu quero acompanhar as taxas que os fornecedores devem ao sistema por carro, para gerenciar a receita.
*   **US-024: Dashboard de Relatórios**
    *   Como Administrador, eu quero um dashboard com relatórios básicos (carros por mês, proporção atacado/varejo, tempo médio), para ter insights sobre a operação.
---

#### **Perfil: Especialista/Operador**

**MVP:**

*   **US-001: Recomendar Serviços(MVP)**
    *   Como Especialista, eu quero poder selecionar e recomendar serviços (mecânica, funilaria, lavagem, etc.) para um veículo, para que o cliente possa revisar e aprovar.
*   **US-002: Aprovar Prazo de Entrega do Serviço(MVP)**
    *   Como Especialista, eu quero poder aprovar a **data de entrega** enviada pelo fornecedor, para que o sistema possa estimar o prazo de conclusão para o cliente.
*   **US-003: Acompanhar Status do Carro(MVP)**
    *   Como Especialista, eu quero visualizar o status atual de cada carro que estou como responsável (pendente, em andamento, aguardando aprovação, etc.), para ter uma visão clara do progresso.
*   **US-004: Realizar Checklist Inicial e Fotos(MVP)**
    *   Como Especialista, eu quero poder realizar um checklist inicial e anexar fotos do veículo antes di início dos serviços, para documentar o antes e depois e a qualidade do trabalho.
*   **US-005: Realizar Checklist Final e Fotos(MVP)**
    *   Como Especialista, eu quero poder realizar um checklist final e anexar fotos do veículo após a conclusão dos serviços, para documentar a entrega e a qualidade do trabalho.
*   **US-006: Aprovar orçamento enviado pelo fornecedor(MVP)**
    *   Como Especialista, eu quero poder aprovar orçamento enviado pelo fornecedor, para que o sistema possa calcular o custo para o cliente.
*   **US-031: Filtrar Lista de Carros(MVP)**
    *   Como Especialista, eu quero poder filtrar a lista de carros que estou como responsável (ex: por status, por data), para encontrar rapidamente os veículos que precisam de atenção.
*   **US-032: Alterar Senha(MVP)**
    *   Como Especialista, eu quero poder alterar minha senha.

**Futuro:**

*   **US-006: Gerar PDF de Detalhes do Serviço**
    *   Como Especialista, eu quero poder gerar um PDF com todos os detalhes dos serviços realizados e evidências, para fornecer ao cliente uma documentação completa.

---

#### **Perfil: Cliente**

**MVP:**

*   **US-007: Visualizar Recomendações de Serviço**
    *   Como Cliente, eu quero visualizar os serviços recomendados para o meu veículo, para entender o escopo do trabalho.
*   **US-008: Aprovar/Reprovar Serviços**
    *   Como Cliente, eu quero poder aprovar ou reprovar os serviços recomendados e, em caso de reprovação total, ter a opção de enviar o carro para o **Atacado**.
*   **US-009: Acompanhar Status do Meu Carro**
    *   Como Cliente, eu quero visualizar o status do meu carro (em preparação, aguardando entrega, finalizado, etc.), para saber o andamento do serviço.
*   **US-010: Solicitar Entrega ou Retirada**
    *   Como Cliente, eu quero poder solicitar a entrega do meu veículo em um local específico ou indicar que farei a retirada, para conveniência.
*   **US-011: Acessar Relatórios de Carros**
    *   Como Cliente, eu quero acessar relatórios básicos sobre os carros que enviei (lista de carros, tempo médio de serviço), para ter um histórico e controle.
*   **US-012: Cadastro**
    *   Como Cliente, eu quero acessar relatórios básicos sobre os carros que enviei (lista de carros, tempo médio de serviço), para ter um histórico e controle.
*   **US-018: Atualizar Dados**
    *   Como Cliente, eu quero atualizar meus dados cadastrais.

---

#### **Perfil: Fornecedor**

**MVP:**

*   **US-012: Receber Solicitações de Serviço**
    *   Como Fornecedor, eu quero receber as solicitações de serviço para os veículos, para iniciar o processo de orçamento.
*   **US-013: Enviar Orçamento Detalhado**
    *   Como Fornecedor, eu quero poder enviar um orçamento detalhado, incluindo valor, descritivo dos serviços e uma **data de entrega** específica.
*   **US-014: Atualizar Status do Serviço**
    *   Como Fornecedor, eu quero poder atualizar o status dos serviços que estou realizando (em andamento, concluído), para manter o sistema atualizado.
*   **US-015: Visualizar Carros Atrasados**
    *   Como Fornecedor, eu quero que os carros com entrega atrasada sejam destacados visualmente no meu painel, para priorizar e gerenciar minhas tarefas.
*   **US-031: Solicitar Cadastro**
    *   Como Fornecedor, solicitar o cadastro na plataforma.
*   **US-016: Cadastrar Tabela de Preços**
    *   Como Fornecedor, eu quero ter uma tela para cadastrar e gerenciar minha tabela de preços de serviços, para agilizar a criação de orçamentos.
*   **US-019: Atualizar Dados**
    *   Como Fornecedor, eu quero atualizar meus dados cadastrais.

**Futuro:**

*   **US-017: Acompanhar Pagamentos de Taxas**
    *   Como Fornecedor, eu quero acompanhar os pagamentos das taxas que devo ao sistema por carro processado, para ter controle financeiro.
*   **US-030: Visualizar Relatório de Taxas**
    *   Como Fornecedor, eu quero poder visualizar um relatório das taxas que devo à plataforma por cada serviço realizado, para ter controle financeiro.

---


#### **Requisitos Não Funcionais**

**MVP:**

*   **RNF-001: Layout Moderno e minimalista**
    * **Descrição:** O sistema deve apresentar uma interface de usuário (UI) limpa, intuitiva e contemporânea, com foco na simplicidade visual, uso eficiente do espaço em branco e tipografia legível para garantir uma experiência de usuário agradável e descomplicada.
* **RNF-002: Layout Responsivo**
    * **Descrição:** A interface do usuário deve se adaptar fluidamente a diferentes tamanhos de tela e dispositivos (desktops, tablets, smartphones), garantindo a usabilidade e a funcionalidade completas independentemente do dispositivo de acesso.
* **RNF-003: Autenticação Segura**
    * **Descrição:** O sistema deve implementar mecanismos de autenticação robustos, incluindo hash de senhas, prevenção contra ataques de força bruta (ex: bloqueio temporário após N tentativas falhas) e, opcionalmente, autenticação de dois fatores (2FA) para perfis administrativos.
* **RNF-004: Autorização Baseada em Perfil**
    * **Descrição:** O acesso a funcionalidades e dados deve ser estritamente controlado por perfis de usuário (Cliente, Especialista, Parceiro, Administrador), garantindo que cada usuário só possa acessar os recursos para os quais tem permissão.
* **RNF-005: Proteção Contra Ataques Comuns**
    * **Descrição:** O sistema deve ser resistente a vulnerabilidades de segurança web comuns, como injeção SQL, Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF) e ataques de injeção de código, utilizando práticas de codificação segura e frameworks com proteção integrada.
* **RNF-006: Criptografia de Dados Sensíveis em Trânsito**
    * **Descrição:** Todas as comunicações entre o cliente (navegador/aplicativo) e o servidor, bem como entre os serviços de backend (incluindo middleware), devem ser criptografadas utilizando HTTPS/TLS 1.2 ou superior para proteger dados sensíveis.
* **RNF-007: Criptografia de Dados Sensíveis em Repouso**
    * **Descrição:** Dados sensíveis armazenados no banco de dados (ex: senhas, informações pessoais críticas) devem ser criptografados em repouso.
* **RNF-008: Disponibilidade do Sistema**
    * **Descrição:** O sistema deve estar disponível para uso **24 horas por dia, 7 dias por semana**, com um tempo de atividade (uptime) mínimo de **98%** (excluindo janelas de manutenção planejadas).
* **RNF-009: Tratamento de Erros e Mensagens Amigáveis**
    * **Descrição:** O sistema deve tratar erros de forma graciosa, exibindo mensagens de erro claras, informativas e amigáveis ao usuário, em vez de mensagens técnicas que possam expor informações do sistema.
* **RNF-010: Capacidade de Backup e Restauração**
    * **Descrição:** Deve haver um processo automatizado de backup diário de todos os dados do sistema, com a capacidade de restaurar o banco de dados e os arquivos para um ponto anterior em no máximo **4 horas** em caso de falha catastrófica.
* **RNF-011: Consistência da Interface do Usuário**
    * **Descrição:** Todos os elementos da interface (botões, ícones, formulários, navegação) devem seguir um padrão visual e comportamental consistente em todo o sistema, facilitando o aprendizado e a navegação do usuário.
* **RNF-012: Facilidade de Navegação**
    * **Descrição:** A arquitetura de informação e a navegação do sistema devem ser intuitivas, permitindo que os usuários encontrem rapidamente as funcionalidades desejadas com um número mínimo de cliques ou passos.
* **RNF-013: Feedback Visual para Ações do Usuário**
    * **Descrição:** O sistema deve fornecer feedback visual imediato para as ações do usuário (ex: indicadores de carregamento, mensagens de sucesso/erro, realce de campos obrigatórios) para confirmar o processamento da ação.
* **RNF-014: Modularidade do Código**
    * **Descrição:** O código-fonte deve ser organizado em módulos ou componentes bem definidos, com responsabilidades claras e baixo acoplamento, facilitando a manutenção, o teste e a evolução futura do sistema.
* **RNF-015: Escalabilidade Vertical e Horizontal**
    * **Descrição:** A arquitetura do sistema deve permitir a escalabilidade para suportar um aumento no número de usuários ou na carga de processamento, seja por meio de upgrade de recursos (vertical) ou adição de instâncias (horizontal).
* **RNF-016: Observabilidade (Logging e Monitoramento)**
    * **Descrição:** O sistema deve gerar logs de eventos importantes (erros, transações críticas, acesso a APIs) em um formato estruturado, e deve ser possível monitorar o desempenho e a saúde dos componentes em tempo real para diagnóstico e otimização.
* **RNF-017: Conformidade com LGPD/GDPR (Proteção de Dados)**
    * **Descrição:** O sistema deve estar em conformidade com as leis de proteção de dados (LGPD/GDPR), garantindo a coleta, armazenamento e processamento de dados pessoais de forma ética, segura e transparente, incluindo direitos de acesso e exclusão de dados.



---
