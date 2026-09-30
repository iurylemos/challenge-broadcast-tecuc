import {
  string as zodString,
  object as zodObject,
  type infer as zodInfer,
} from "zod";
import { MagicNumber } from "../interfaces/magicNumber.enum";

export const loginSchema = zodObject({
  email: zodString().email("Email inválido"),
  password: zodString().min(MagicNumber.ONE, "Informe a senha"),
});

export type LoginInput = zodInfer<typeof loginSchema>;
