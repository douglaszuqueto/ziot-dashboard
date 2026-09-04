# Notas de Segurança

## Autenticação

- autenticação por Bearer token JWT com escopo admin
- token salvo em `sessionStorage` por padrão
- se o admin marcar manter conectado, token vai para `localStorage`
- logout limpa ambos storages
- bootstrap usa `GET /v1/admin/auth/me`

## Rotas protegidas

- todas as telas administrativas ficam atrás de `ProtectedRoute`
- a sessão admin carrega antes de liberar navegação
- o app usa permissões de plataforma para esconder menus e bloquear telas
- bloqueio visual no frontend é apenas UX; a autorização real fica no backend

## Transporte

- token sempre via header `Authorization`
- nenhum token em query string
- `credentials: "omit"` no cliente HTTP
- em desenvolvimento, proxy `/api` no Vite evita CORS entre frontend e backend

## Validação

- respostas da API passam por Zod na borda
- query params são montados por `URLSearchParams`
- erros da API são centralizados em `ApiError`

## XSS e CSRF

- frontend não usa `dangerouslySetInnerHTML`
- conteúdo vindo da API é renderizado como texto
- risco de CSRF é reduzido porque auth não usa cookie de sessão

## Próximos endurecimentos recomendados

- CSP no deploy
- rotação/refresh token se backend evoluir
- testes E2E de auth admin e permissões
- auditoria visual de ações destrutivas antes de produção

## Controle de acesso

- permissões de leitura usam sufixo `.read`
- permissões de escrita/gestão usam `.manage`
- tela `/acessos` permite revisar roles, permissões e módulos habilitados por tenant
- login e `me` retornam `policy_version`; se permissões mudarem, o token antigo pode ser invalidado pelo backend
