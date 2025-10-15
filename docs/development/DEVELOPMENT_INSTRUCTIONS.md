## Princípios de Desenvolvimento

Este projeto adere aos seguintes princípios para garantir a qualidade, manutenibilidade e
escalabilidade do código:

- **DRY (Don't Repeat Yourself):** Evitar a duplicação de código, promovendo a reutilização e a
  centralização da lógica.
- **SOLID:** Seguir os cinco princípios do design orientado a objetos (Single Responsibility,
  Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) para criar sistemas
  mais compreensíveis, flexíveis e manuteníveis.
- **Object Calisthenics:** Aplicar um conjunto de nove regras simples para escrever código mais
  limpo, coeso e desacoplado, focando na simplicidade e na responsabilidade única dos objetos.
- **Arquitetura Modular:** Organizar o código em módulos independentes e coesos, facilitando a
  manutenção, escalabilidade e reusabilidade. Cada módulo deve ter responsabilidades bem definidas e
  interfaces claras.
- **Criação de Componentes:** Todos os componentes devem seguir o composition pattern. As páginas principais atuarão como "containers" que compõem múltiplos componentes filhos, cada um gerenciando uma parte específica do fluxo. Modais serão
- **KISS** (Keep It Simple, Stupid):** Manter o código o mais simples possível, evitando complexidade desnecessária.


- Esse é um projeto **REACT/TS** e deve seguir as melhores praticas para um desenvolvimento seguro

- Considerar sempre que o ambiente está em produção, debugs devem ser removidos logo após a resolução
do problema

- Mantenha o código limpo, após uma correção de código verique duas vezes se não está deixando sujeira
para trás

- o deploy e feito na vercel

- toda **migration** deve ser **idempotente**
- toda migration deve ser criada com **supabase migration new**

- Nunca trabalhar diretamente na main, sempre criar uma branch nova, exceto se expressamente autorizado.

-Nunca commitar usando a flag --no-verify