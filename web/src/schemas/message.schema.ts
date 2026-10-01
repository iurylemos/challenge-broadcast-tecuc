import { z } from "zod";

export const messageSchema = z
  .object({
    contactIds: z.array(z.string()).min(1, "Selecione pelo menos um contato."),
    content: z.string().trim().min(1, "Digite uma mensagem."),
    scheduled: z.boolean(),
    scheduledAt: z.string(),
  })
  .refine((data) => !data.scheduled || Boolean(data.scheduledAt), {
    message: "Informe a data e o horário.",
    path: ["scheduledAt"],
  });

export type MessageInput = z.Infer<typeof messageSchema>;
