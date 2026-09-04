# Agent Rules

This repo is the customer dashboard. Preserve approved UX first, then add behavior.

## Hard Rules

- Do not redesign existing pages unless user explicitly asks.
- Preserve existing layout, icons, spacing, card hierarchy, colors, and design system.
- Keep pages thin. Put feature code under `src/modules/<domain>`.
- Use Zod at API boundaries.
- Use TanStack React Query for remote server state.
- Use Zustand only for shared client state like auth, tenant, and notifications.
- Use shared HTTP/SSE clients. Do not call `fetch` directly from pages.
- Never put token in query string.
- Keep authenticated routes behind existing guards.
- Avoid duplicated DTOs inside components.
- Never rewrite unrelated files or revert user changes.

## Required Checks

- Run `pnpm lint` for frontend changes.
- Run `pnpm build` before finishing larger changes.
- Run `pnpm test` when touching data hooks, schemas, stores, or route behavior.

## Useful Playbooks

- `docs/ai-agents/dashboard-feature.md`
- `docs/ai-agents/api-integration.md`
- `docs/ai-agents/design-system-guardrails.md`
- `docs/ai-agents/review-checklist.md`


## Graphify

Este projeto tem um knowledge graph local em `graphify-out/` (não versionado).

Antes de abrir arquivos ou explorar o código:

1. Consulte o Graphify (`graphify query "..."`, `graphify path "A" "B"`, `graphify explain "..."`).
2. Identifique os módulos/símbolos envolvidos.
3. Abra apenas os arquivos necessários.
4. Só então faça alterações.

Comandos úteis (na raiz deste repo):

```bash
graphify query "<pergunta>"
graphify path "<A>" "<B>"
graphify explain "<conceito>"
graphify update .          # após mudanças de código (AST, sem LLM)
graphify extract . --mode deep --backend claude-cli --force   # rebuild semântico
```

Se `graphify-out/graph.json` não existir, rode o extract deep acima antes de explorar.

