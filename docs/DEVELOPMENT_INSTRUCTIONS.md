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

## Práticas de Desenvolvimento

- Esse é um projeto **REACT/TS** e deve seguir as melhores práticas para um desenvolvimento seguro
- Considerar sempre que o ambiente está em produção, debugs devem ser removidos logo após a resolução do problema
- Manter o código limpo, após uma correção de código verifique duas vezes se não está deixando sujeira para trás
- O deploy é feito na vercel
- Toda **migration** deve ser **idempotente**
- Toda migration deve ser criada com **supabase migration new**

## Documentação de Bugs e Issues

Todos os bugs e issues conhecidos devem ser documentados seguindo o padrão estabelecido em:

- [Índice de Bugs](bugs/indice.md) - Documentação completa dos bugs identificados

Antes de implementar qualquer correção, deve-se:
1. Documentar o bug de forma clara e objetiva
2. Diagnosticar a causa raiz do problema
3. Propor uma solução técnica apropriada
4. Atualizar a documentação após a resolução

Esta prática garante que:
- Problemas conhecidos sejam facilmente identificáveis
- A equipe tenha contexto suficiente para resolver issues
- Histórico de problemas seja mantido para referência futura
- Soluções implementadas sejam bem documentadas