# Mapeamento Tela -> API

## Login

- `POST /v1/admin/auth/login`
- `GET /v1/admin/auth/me`

## Dashboard

- `GET /v1/admin/clients`
- `GET /v1/admin/tenants`
- `GET /v1/admin/users`
- `GET /v1/admin/devices`
- `GET /v1/admin/sensors`
- `GET /v1/admin/reports/device-health`
- `GET /v1/admin/reports/device-health/summary`

## Clientes

- `GET /v1/admin/clients`
- `POST /v1/admin/clients`
- `GET /v1/admin/clients/:id`
- `PATCH /v1/admin/clients/:id`
- `DELETE /v1/admin/clients/:id`

## Tenants

- `GET /v1/admin/tenants`
- `POST /v1/admin/tenants`
- `GET /v1/admin/tenants/:id`
- `PATCH /v1/admin/tenants/:id`

## Usuários e memberships

- `GET /v1/admin/users`
- `POST /v1/admin/users`
- `GET /v1/admin/users/:id`
- `PATCH /v1/admin/users/:id`
- `POST /v1/admin/users/:id/change-password`
- `GET /v1/admin/memberships`
- `POST /v1/admin/memberships`
- `GET /v1/admin/memberships/:id`
- `PATCH /v1/admin/memberships/:id`
- `DELETE /v1/admin/memberships/:id`

## Inventário

- `GET /v1/admin/device-profiles`
- `GET /v1/admin/devices`
- `POST /v1/admin/devices`
- `GET /v1/admin/devices/:id`
- `PATCH /v1/admin/devices/:id`
- `POST /v1/admin/devices/:id/move`
- `POST /v1/admin/devices/:id/status`
- `GET /v1/admin/sensors`
- `POST /v1/admin/sensors`
- `GET /v1/admin/sensors/:id`
- `PATCH /v1/admin/sensors/:id`
- `POST /v1/admin/sensors/:id/move`
- `POST /v1/admin/sensors/:id/status`


## Relatórios

- `GET /v1/admin/reports/device-health`
- `GET /v1/admin/reports/device-health/summary`
