# Segurança e isolamento

- Toda leitura/escrita exige `resource.data.ownerId == request.auth.uid`.
- Create: `ownerId == auth.uid` e, para contacts/messages, a conexão referenciada pertence ao usuário (`get()`).
- Update: `ownerId` e `connectionId` imutáveis; mensagens só editáveis se `scheduled`.
- Functions usam Admin SDK (ignoram rules) e só tocam dados derivados dos próprios documentos.
- Testes com `@firebase/rules-unit-testing`: usuário B não lê, cria, edita ou apaga dados do A.
