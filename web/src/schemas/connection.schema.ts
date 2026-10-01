import { z } from "zod";

export const connectionSchema = z.object({
  name: z.string().trim().min(1, "Nome da conexão é obrigatório"),
});

export type ConnectionFormData = z.infer<typeof connectionSchema>;
