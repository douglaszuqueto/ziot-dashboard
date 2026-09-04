# Playbook: API Integration

Use when connecting a backend endpoint to the dashboard.

## Implementation Path

1. Confirm endpoint, auth, query params, and response shape.
2. Add Zod schema at module boundary.
3. Add API function using shared HTTP client.
4. Add React Query hook with stable query key.
5. Handle `401` through existing auth flow.
6. Add loading, empty, and error states.
7. Keep tenant selection tied to existing tenant store/session.
8. Update `docs/api-screen-mapping.md` if page mapping changes.

## Realtime

- Prefer existing SSE/fetch stream for notifications.
- Do not use polling if stream exists.
- Abort stream on logout or tenant change.

## Security

- Bearer token only in `Authorization` header.
- No token in URL.
- Validate API data with Zod before rendering.
- Render API strings as text, never HTML.

