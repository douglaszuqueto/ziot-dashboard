# Playbook: Dashboard Feature

Use this when adding or changing dashboard behavior.

## Required Decisions

- Page or module affected.
- API endpoints used.
- Tenant/auth behavior.
- Loading, empty, and error states.
- Realtime behavior, if any.
- Visual surface that must stay unchanged.

## Implementation Path

1. Inspect existing page and module components before editing.
2. Add or update Zod schema in `src/modules/<domain>/schemas`.
3. Add API call in `src/modules/<domain>/api`.
4. Add React Query hook in `src/modules/<domain>/hooks`.
5. Keep page wrapper thin and render module component.
6. Reuse existing UI components and visual patterns.
7. Add tests when hook/schema/store logic changes.
8. Update docs when route/API mapping changes.

## Rules

- No raw `fetch` in pages.
- No duplicated parsing in components.
- No route-level tenant hardcode.
- No visual redesign unless requested.
- Keep MapView changes isolated to map module.

## Done Means

- `pnpm lint` passes.
- `pnpm build` passes for larger changes.
- Visual structure matches original page unless change was requested.
