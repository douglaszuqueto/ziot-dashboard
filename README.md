# Field Connect Hub

Dashboard React para operação final do cliente Vizeos.

## Stack

- React 19 + Vite 8 + TypeScript
- React Router
- TanStack React Query
- Zod
- Zustand
- Tailwind CSS 4.2 + shadcn/ui
- BiomeJS
- Vitest

## Scripts

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm test
```

App source lives in `apps/web` (pnpm workspace). Root scripts proxy to that package.

## Cloudflare Workers Builds

After the monorepo move, prefer building from the **repository root** (leave Root Directory empty), so pnpm finds `pnpm-lock.yaml` / `pnpm-workspace.yaml`:

| Setting | Value |
| --- | --- |
| Root directory | *(empty / repo root)* |
| Build command | `pnpm install && pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Non-production deploy | `npx wrangler versions upload` |

Root `wrangler.jsonc` points assets at `./apps/web/dist`. Local deploy from the app package (`pnpm deploy`) still uses `apps/web/wrangler.jsonc` + the Vite Cloudflare plugin.

If you set Root Directory to `apps/web`, install must still reach the workspace root, e.g. Install command `cd ../.. && pnpm install` and Build command `pnpm run build`.

## Ambiente

Criar `.env` baseado em `.env.example`.

```bash
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_APP_BRAND=vizeos
```

`VITE_APP_BRAND` é definido no build e aceita `hortishop` (padrão, verde
`#159846`) ou `vizeos` (azul `#006BB3`).

## Estrutura

- `src/app`
  - bootstrap, providers, router, guards
- `src/shared`
  - http client, env, auth session, utilitários, estados comuns
- `src/modules`
  - módulos por domínio: auth, tenants, pivot
- `src/pages`
  - wrappers finos para rotas

## Fluxos implementados

- login com JWT
- bootstrap de sessão
- proteção de rotas autenticadas
- seleção de tenant
- troca de tenant com novo token
- integração das telas:
  - Home (vazia)
  - Pivôs (lista, cadastro, edição e exclusão)
  - Pivô (detalhe; estado e comandos em breve)

## Documentação

- [Arquitetura frontend](./docs/frontend-architecture.md)
- [Mapeamento tela -> API](./docs/api-screen-mapping.md)
- [Notas de segurança](./docs/security.md)
- [Playbooks para agentes de IA](./docs/ai-agents/README.md)
