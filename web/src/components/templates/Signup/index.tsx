import { useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import { signupSchema, type SignupInput } from "../../../schemas/signup.schema";
import { FirebaseService } from "../../../services/firebase.service";

export function SignupTemplate(): JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const registerUser = async (email: string, password: string) => {
    try {
      await FirebaseService.signUp(email, password);
    } catch (error: unknown) {
      console.log("error", error);
      setServerError(FirebaseService.getAuthErrorMessage(error));
    }
  };

  const onSubmit = handleSubmit(async ({ email, password }) => {
    console.log("here??");

    setServerError(null);

    await registerUser(email, password);
  });

  console.log("errors", errors);

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-sm flex-col gap-4 p-6"
      noValidate
    >
      <h1 className="text-2xl font-semibold">Criar conta</h1>
      {serverError && <Alert severity="error">{serverError}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        {...register("email")}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        {...register("password")}
        error={!!errors.password}
        helperText={errors.password?.message}
      />
      <TextField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        {...register("confirmPassword")}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting}>
        Cadastrar
      </Button>
      <Link to="/login">Já tenho conta</Link>
    </form>
  );
}
