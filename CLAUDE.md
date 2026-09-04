# Claude Instructions

Follow `AGENTS.md` first.

## Project Shape

- `src/pages`: route wrappers only.
- `src/modules`: domain implementation.
- `src/shared`: shared API, auth, config, formatters, and UI states.
- `src/components/ui`: base design-system components.

## Data Rules

- API functions live in module `api`.
- Zod schemas live in module `schemas`.
- React Query hooks live in module `hooks`.
- Components receive parsed domain data, not raw HTTP responses.

## Visual Rules

- Treat existing screens as approved client design.
- Before editing a page, inspect current component tree and preserve visual structure.
- Add new UI using existing cards, badges, buttons, charts, spacing, and icon language.
- If a layout must change, document why.

## Before Finishing

- Mention pages/modules affected.
- Mention lint/build/test results.
- Mention any visual change explicitly.


## graphify

Follow `AGENTS.md` Graphify section before exploring code.
