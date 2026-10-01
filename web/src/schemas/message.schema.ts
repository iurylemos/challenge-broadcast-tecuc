import { z } from "zod";

export const messageSchema = z
  .object({
    contactIds: z.array(z.string()).min(1, "Selecione ao menos um contato."),
    content: z
      .string()
      .trim()
      .min(1, "Escreva a mensagem.")
      .max(1000, "Máximo de 1000 caracteres."),
    scheduled: z.boolean(),
    scheduledAt: z.string(),
  })
  .superRefine(({ scheduled, scheduledAt }, ctx) => {
    if (!scheduled) return;

    const time = new Date(scheduledAt).getTime();

    if (!scheduledAt || Number.isNaN(time)) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Informe a data e o horário.",
      });
      return;
    }

    if (time <= Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "A data deve ser futura.",
      });
    }
  });

export type MessageInput = z.infer<typeof messageSchema>;
