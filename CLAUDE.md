# Broadcast: contexto do projeto

A fonte de verdade está em `docs/specs/`. Leia antes de qualquer mudança.

## Regras

- Spec primeiro: mudou comportamento, atualize `docs/specs` antes do código.
- Trabalhe uma task de `05-tasks.md` por vez e marque ao concluir.
- Paradigma funcional: sem classes, sem estado mutável compartilhado.
- Sem subcoleções. Todo doc tem `ownerId`; toda query filtra por `ownerId`.
- Firebase só em `features/*/api.ts` e `shared/lib`; componentes usam hooks.
- MUI para componentes, Tailwind para layout. Tipos estritos, sem `any`.
- Antes de concluir: `npm run test`, `tsc --noEmit` e lint.

## Comandos

`npm run dev` · `npm run dev:web` · `npm run test` · `npm run deploy`
