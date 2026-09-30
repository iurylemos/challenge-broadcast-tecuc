# ADR-0001: Scheduler por polling de 1 minuto

Status: aceito
Contexto: mensagens agendadas precisam virar `sent` no backend sem app aberto.
Decisão: `onSchedule` a cada 1 min com batch update.
Alternativa: Cloud Tasks por mensagem (precisão ao segundo, maior complexidade e necessidade de cancelar/reagendar na edição).
Consequência: atraso de até 1 min; simplicidade e idempotência (query por status).
