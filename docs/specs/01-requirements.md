# Requisitos

## Autenticação

- REQ-AUTH-01: cadastro e login com email/senha (Firebase Auth). Cada usuário = um cliente (tenant).
- REQ-AUTH-02: rotas privadas redirecionam para `/login` se não autenticado.

## Conexões

- REQ-CON-01: CRUD de conexão (campo: nome), listagem em tempo real.
- REQ-CON-02: excluir conexão remove contatos e mensagens dela (cascade no backend).

## Contatos

- REQ-CTT-01: CRUD de contato (nome, telefone) dentro de uma conexão, em tempo real.
- REQ-CTT-02: telefone validado (E.164 ou BR com DDD).

## Broadcast

- REQ-MSG-01: selecionar 1+ contatos da conexão e escrever mensagem.
- REQ-MSG-02: envio imediato (simulado): status `sent`.
- REQ-MSG-03: agendamento para data/hora futura: status `scheduled`.
- REQ-MSG-04: listagem em tempo real com filtro Todas | Agendadas | Enviadas.
- REQ-MSG-05: editar/excluir apenas mensagens `scheduled`.
- REQ-MSG-06: Cloud Function muda `scheduled` → `sent` quando `scheduledAt <= now`, sem app aberto.

## Não funcionais

- REQ-NFR-01: isolamento total entre clientes (rules + queries filtradas por `ownerId`).
- REQ-NFR-02: sem subcoleções; paradigma funcional; Vite; MUI + Tailwind.
- REQ-NFR-03: tempo real via `onSnapshot` sempre que aplicável.
- REQ-NFR-04: deploy via Firebase Hosting.
