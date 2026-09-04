# Vizeos Admin

Frontend React para administração da plataforma Vizeos.

## Stack

- React 19 + Vite 8 + TypeScript
- React Router
- TanStack React Query
- Zod
- Zustand
- Tailwind CSS 4.2 + shadcn/ui
- BiomeJS
- Vitest

## Ambiente

```bash
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
```

## Scripts

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Estrutura

- `src/app`: providers, router e proteção de rotas
- `src/shared`: cliente HTTP, env, sessão, helpers e estados comuns
- `src/modules`: módulos administrativos por domínio
- `src/pages`: wrappers finos de rotas

## Convenções

- Componentes de formulário compartilhados ficam em `src/shared/components/forms`
- Componentes de métricas e badges ficam em `src/shared/components/metrics`
- Helpers de domínio compartilhados ficam em `src/shared/domain`
- Helpers específicos de módulo ficam em `src/modules/*/lib`

## Endpoints administrativos

- `POST /v1/admin/auth/login`
- `GET /v1/admin/auth/me`
- `POST /v1/admin/auth/change-password`
- `/v1/admin/clients`
- `/v1/admin/tenants`
- `/v1/admin/users`
- `/v1/admin/memberships`
- `/v1/admin/devices`
- `/v1/admin/device-profiles`
- `/v1/admin/reports/device-health`
