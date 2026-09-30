# Modelo de dados (collections flat)

Tenant = `ownerId` (= auth.uid), presente em todos os documentos.

| Collection  | Campos                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| connections | ownerId, name, createdAt, updatedAt                                                                                  |
| contacts    | ownerId, connectionId, name, phone, createdAt, updatedAt                                                             |
| messages    | ownerId, connectionId, contactIds[], body, status (`scheduled`\|`sent`), scheduledAt?, sentAt?, createdAt, updatedAt |

## Queries padrão

Sempre `where('ownerId','==',uid)` + `where('connectionId','==',id)`; filtro por `status` no servidor.

## Índices

Ver `firestore.indexes.json`.

## Integridade

- Cascade delete de conexão via Cloud Function.
- Mensagem guarda `contactIds`; contato excluído é ignorado na exibição.
