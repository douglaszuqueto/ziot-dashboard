# Arquitetura Frontend

O `vizeos-admin` reaproveita a arquitetura modular do `field-connect-hub`, mas consome apenas o namespace administrativo `/v1/admin/*`.

## Regras

- página não chama `fetch` direto
- componente visual não conhece endpoint
- contratos de API ficam em Zod
- estado remoto fica em React Query
- sessão admin fica em Zustand
- wrapper de rota fica em `src/pages`; lógica real fica em `src/modules`

## Camadas

- `src/app`: providers, router e guard autenticado
- `src/shared`: HTTP client, env, auth session, formatadores e componentes comuns
- `src/modules`: auth, dashboard, clients, tenants, users, inventory e reports
- `src/pages`: wrappers de rota

## Componentes Compartilhados

- `src/shared/components/forms`: componentes pequenos de formulário reutilizados em modais e páginas, como `FieldError` e `PasswordInput`
- `src/shared/components/metrics`: componentes de indicadores e badges operacionais
- `src/shared/domain`: constantes e helpers de domínio compartilhados entre telas

## Testes

Testes unitários devem cobrir regras sem depender de renderização quando possível:

- schemas Zod alinhados ao banco/API
- helpers de agregação e formatação
- adapters de payload antes de chamadas remotas

## Auth admin

O app usa JWT com escopo admin e storage key `vizeos-admin.auth`.

Permissões esperadas:

- `platform.read`
- `platform.manage`
