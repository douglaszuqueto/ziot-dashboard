# Arquitetura Frontend

## Objetivo

Manter dashboard modular, previsível e alinhado com backend por domínio.

## Regras

- página não chama `fetch` direto
- componente visual não conhece endpoint
- validação de payload entra por Zod
- estado remoto fica em React Query
- estado global cliente fica em Zustand
- wrapper de rota em `src/pages`, lógica real em `src/modules`

## Camadas

### `src/app`

- `providers`
  - QueryClient, tooltips, toasts
- `router`
  - `AppRouter`
  - `ProtectedRoute`

### `src/shared`

- `api`
  - cliente HTTP central
  - tratamento de erro
- `auth`
  - persistência de token em `sessionStorage` ou `localStorage`
- `config`
  - env validado
- `components/states`
  - loading, erro, vazio
- `lib`
  - formatadores e helpers pequenos

### `src/modules`

Cada módulo segue padrão:

- `api`
  - chamadas HTTP ou stream
- `schemas`
  - contrato Zod
- `hooks`
  - React Query ou orquestração
- `components`
  - tela e blocos específicos
- `store`
  - apenas quando houver estado cliente compartilhado

## Estado

### React Query

Usado para:

- auth bootstrap (`auth/me`)
- dashboard overview
- catálogo e detalhe de devices
- central de alertas
- regras configuráveis de alertas
- inbox de notificações

### Zustand

Usado para:

- sessão autenticada
- tenant corrente
- estado do sino/notificações

## Navbar

Navbar consome módulos reais:

- `TenantSwitcher`
- `NotificationBell`
- `UserMenu`

Nada hardcoded.

## Realtime

`/v1/notifications/stream` usa SSE autenticado via `fetch`, não `EventSource`, porque API exige Bearer token.

Fluxo:

1. carrega inbox
2. abre stream
3. ao receber evento:
   - marca atividade
   - invalida inbox
   - invalida alerts overview
   - invalida dashboard overview

## Web Push

O dashboard também pode integrar com OneSignal Web Push.

- `VITE_ONESIGNAL_ENABLED=true` habilita o fluxo.
- `VITE_ONESIGNAL_APP_ID` é o app id público do OneSignal.
- `VITE_ONESIGNAL_SAFARI_WEB_ID` pode receber o `safari_web_id` gerado no painel do OneSignal.
- `public/OneSignalSDKWorker.js` precisa estar público no mesmo origin do dashboard.
- O usuário é vinculado ao OneSignal com `external_id = auth.user.id`.
- O prompt de permissão só aparece quando o usuário clica na ação do sino.
- SSE continua sendo a fonte de realtime dentro da aba; OneSignal cobre usuário fora da aba.

## Regras de alerta

A tela `/alertas/regras` permite criar e editar regras de telemetria sem misturar regras com ocorrências da central.

- contratos ficam em `src/modules/notifications/schemas`
- chamadas HTTP ficam em `src/modules/notifications/api`
- cache/mutations ficam em `src/modules/notifications/hooks`
- componente visual fica em `src/modules/alerts/components`
- regra pode valer para toda fazenda, um sensor específico ou grupo por etiqueta
- ao salvar/ativar/pausar, React Query invalida regras, inbox e visão de alertas

## Convenções

- nomes claros e curtos
- arquivos pequenos
- sem comentários redundantes
- sem duplicar DTO da API em componente visual
- adaptar contrato da API antes de renderizar widget
