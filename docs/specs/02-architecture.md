# Arquitetura

## Frontend (`/web/src`)

app/ (router, providers, theme) · features/{auth,connections,contacts,messages} · shared/{lib,components,types}

Regras:

- `api.ts` por feature: funções puras que falam com o Firestore (`subscribeX`, `createX`, `updateX`, `deleteX`).
- `useX.ts`: hook que encapsula `onSnapshot` + cleanup, retorna `{ data, loading, error }`.
- Componentes só compõem hooks e UI; nenhuma chamada Firebase em componente.
- Formulários: react-hook-form + schema zod por feature.
- Sem classes. Imutabilidade, funções pequenas e puras, tipos explícitos nas fronteiras.
- MUI para componentes, Tailwind para layout/espaçamento. Tailwind sem preflight.

## Backend (`/functions/src`)

- `dispatchScheduledMessages` (onSchedule, 1 min): query `status == scheduled && scheduledAt <= now`, batch update.
- `cascadeDeleteConnection` (onDocumentDeleted): remove contacts e messages da conexão.
- Lógica em funções puras testáveis separadas dos handlers.

## Deploy

Hosting serve `web/dist` (SPA rewrite). Functions e rules/indexes via `firebase deploy`.
