# Notas de Segurança

## Autenticação

- autenticação por Bearer token JWT
- token salvo em `sessionStorage` por padrão
- se usuário marcar “manter conectado”, token vai para `localStorage`
- logout limpa ambos storages
- `401` limpa sessão e volta para login

## Rotas protegidas

- todas as telas operacionais ficam atrás de `ProtectedRoute`
- bootstrap de sessão roda antes de liberar navegação
- menus e telas também validam permissões e módulos recebidos no login
- bloqueio visual no frontend é apenas UX; a autorização real fica no backend

## Transporte

- token sempre via header `Authorization`
- nenhum token em query string
- `credentials: "omit"` no cliente HTTP
- em desenvolvimento, proxy `/api` no Vite evita CORS entre dashboard e backend

## Validação

- respostas da API passam por Zod na borda
- query params são montados por `URLSearchParams`
- erros da API são centralizados em `ApiError`

## XSS

- frontend não usa `dangerouslySetInnerHTML` nas telas novas
- conteúdo vindo da API é renderizado como texto

## CSRF

- risco reduzido nesta fase porque auth não usa cookie de sessão
- como fluxo é Bearer token, requisições autenticadas dependem de header explícito

## SSE

- stream de notificações usa Bearer token
- conexão é abortada na troca de tenant ou logout
- erro `401` encerra sessão

## Controle de acesso

- permissões seguem formato `recurso.acao`, como `devices.read`
- módulos controlam disponibilidade contratual, como `devices`, `dashboards` e `alerts`
- troca de tenant carrega novo JWT com novo conjunto de permissões, módulos e `policy_version`
- se a política mudar no backend, token antigo pode expirar e exigir novo login

## Próximos endurecimentos recomendados

- CSP no deploy
- rotação/refresh token se backend evoluir
- testes E2E de auth e tenant switching
- observabilidade de falhas de SSE e auth bootstrap
