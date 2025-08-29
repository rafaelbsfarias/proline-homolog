# Relatório Completo de Rotas do Sistema

## Rotas Públicas (sem autenticação necessária)
- `/` (página principal)
- `/login`
- `/cadastro`
- `/recuperar-senha`
- `/confirm-email` (usado para confirmação de email via link)
- `/test` (possivelmente para testes)
- `/test-cadastro` (possivelmente para testes)

## Rotas Protegidas (requerem autenticação)
- `/dashboard` (painel principal do usuário)
- `/dashboard/services` (serviços no dashboard)
- `/dashboard/admin` (área administrativa do dashboard)
- `/dashboard/admin/clients` (clientes na área administrativa)
- `/dashboard/admin/clients/[id]` (detalhes de cliente específico)
- `/dashboard/admin/pendentes` (itens pendentes na área administrativa)
- `/dashboard/admin/usuarios` (usuários na área administrativa)
- `/meu-perfil` (perfil do usuário)
- `/admin` (área administrativa principal)
- `/admin/clients` (gerenciamento de clientes)
- `/admin/clients/[id]` (detalhes de cliente específico)
- `/admin/pendentes` (itens pendentes)
- `/admin/usuarios` (gerenciamento de usuários)
- `/di` (injeção de dependência - não parece ser uma rota web acessível)

## Rotas da API (endpoints)
- `/api/auth/send-password-reset-email`
- `/api/auth/request-password-reset`
- `/api/signup/create-user`
- `/api/signup/create-profile`
- `/api/signup/finalize`
- `/api/admin/send-magic-link`
- `/api/client/get-profile`
- `/api/users-count`
- `/api/partner/get-profile`
- `/api/specialist/get-profile`
- `/api/confirm-email`
- `/api/login/sync-profile`
- `/api/test-create-vehicle`
- `/api/test-vehicles`
- `/api/veiculos/validate-chassi`
- `/api/veiculos/create`
- `/api/veiculos/list`
- `/api/veiculos/[id]` (detalhes de veículo específico)

## Observações de Segurança

Com base na auditoria de autenticação, as seguintes rotas NÃO estão atualmente protegidas no middleware:
- `/meu-perfil`
- `/test`
- `/test-cadastro`
- `/confirm-email`
- `/dashboard/services`
- `/dashboard/admin/*` (todas as sub-rotas)
- `/di`

Apenas as seguintes rotas estão atualmente protegidas no middleware:
- `/dashboard` (raiz)
- `/admin` (raiz)

Rotas que deveriam ser públicas mas não estão definidas como tal:
- `/recuperar-senha` (atualmente não está na lista de rotas públicas do middleware)