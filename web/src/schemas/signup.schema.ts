import { string as zodString, type infer as zodInfer } from "zod";
import { loginSchema } from "./login.schema";
import { MagicNumber } from "../interfaces/magicNumber.enum";

export const signupSchema = loginSchema
  .extend({
    password: zodString().min(
      MagicNumber.SIX,
      `Mínimo de ${MagicNumber.SIX} caracteres`,
    ),
    confirmPassword: zodString(),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

export type SignupInput = zodInfer<typeof signupSchema>;
