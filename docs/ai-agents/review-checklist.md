# Agent Review Checklist

## Architecture

- Page remains thin.
- Domain code lives under `src/modules/<domain>`.
- Shared code only when reused by more than one module.
- API, schema, hook, component responsibilities are separated.

## Data

- Zod parses responses.
- React Query owns remote state.
- Zustand not used for server cache.
- Tenant/token flow uses existing stores.
- `401` behavior still logs out or refreshes session as designed.

## UI

- Approved layout preserved.
- Existing icons preserved.
- Loading, empty, and error states present.
- No hardcoded demo data unless explicitly documented.
- Responsive behavior preserved.

## Security

- No token in URL.
- No unsafe HTML rendering.
- No bypass of protected routes.
- Query params built safely.

## Checks

- `pnpm lint`
- `pnpm build`
- `pnpm test` when hooks/schemas/stores changed
