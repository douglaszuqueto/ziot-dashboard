# Mapeamento Tela -> API

## Login

- `POST /v1/auth/login`
- `GET /v1/auth/me`

## Navbar

### Tenant selector

- `GET /v1/auth/tenants`
- `POST /v1/auth/switch-tenant`

### Avatar

- sessão local do usuário autenticado

## Home (`/`)

- sem chamadas à API (página vazia por enquanto)

## Pivôs (`/pivos`)

- `GET /v1/pivots`
- `POST /v1/pivots` (requer `pivot.write`)
- `PATCH /v1/pivots/:id` (requer `pivot.write`)
- `DELETE /v1/pivots/:id` (requer `pivot.write`)

## Pivô (`/pivos/:id`)

- `GET /v1/pivots/:id`
- `PATCH /v1/pivots/:id` / `DELETE /v1/pivots/:id` (requer `pivot.write`)
- Contrato das telas do app legado (ziot-api `docs/modules/pivot/README.md`,
  "Referência de telas do app legado") — ainda não implementado no backend;
  o front trata 404 como indisponível (`—`, listas vazias, gráficos sem série):
  - `GET /v1/pivots/:id/state` → `usePivotState` (tiles, pílula LIGADO/DESLIGADO, "Última atualização"); também usado por cartão na listagem `/pivos`
  - `GET /v1/pivots/:id/history?hours=24` → `usePivotHistory` (gráficos)
  - `GET /v1/pivots/:id/alerts?limit=50` · `GET /v1/pivots/:id/commands?limit=50` → `usePivotAlerts` / `usePivotCommands` (card Histórico)
  - `POST /v1/pivots/:id/commands/manual` (`{command, mode?, direction?, percentimeter?}`) · `.../commands/status` · `.../commands/gps` (requer `pivot.command`) → card Comandos; 404 → toast "Comandos ainda não disponíveis no backend"

## Observações

- `tenant_id` vem do JWT
- troca de tenant exige novo JWT
- rotas de módulo exigem o módulo `pivot` habilitado no tenant e a permissão `pivot.read`
- frontend não usa CRUD administrativo de tenants para navbar
