# Broadcast

App multi-tenant de broadcast (simulado) com React, TypeScript, Vite e Firebase (Auth, Firestore, Cloud Functions, Hosting).

## Stack

Web: React 19, TS, Vite, MUI, Tailwind v4, react-hook-form + zod · Backend: Cloud Functions v2 (Node 22, TS) · Paradigma funcional (sem classes).

## Estrutura

| Pasta             | Conteúdo                                                           |
| ----------------- | ------------------------------------------------------------------ |
| `/web`            | Frontend (feature-based)                                           |
| `/functions`      | Scheduler de mensagens e cascade delete                            |
| `/docs/specs`     | Fonte de verdade: requisitos, arquitetura, dados, segurança, tasks |
| `/docs/adr`       | Decisões arquiteturais                                             |
| `/.claude/agents` | Subagents que implementam e revisam contra a spec                  |

## Como rodar

1. `npm i` na raiz, em `/web` e em `/functions`
2. `cp web/.env.example web/.env` e preencher com a config do app Firebase
3. `npm run dev` (emulators) e, em outro terminal, `npm run dev:web`

## Deploy

`npm run deploy` (rules, indexes, functions e hosting) ou `npm run deploy:hosting`.

## Desenvolvimento orientado a spec

Leia `docs/specs/` na ordem. Mudou comportamento? Atualize a spec **antes** do código. As tasks em `05-tasks.md` são a fila de trabalho; `CLAUDE.md` e os subagents garantem que a IA siga a mesma documentação.

## Decisões e trade-offs

Ver `docs/adr/`.
