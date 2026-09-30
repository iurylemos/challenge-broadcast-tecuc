import { useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import { loginSchema, type LoginInput } from "../../../schemas/login.schema";
import { FirebaseService } from "../../../services/firebase.service";

export default function LoginTemplate(): JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async ({ email, password }): Promise<void> => {
    setServerError(null);

    try {
      await FirebaseService.signIn(email, password);
    } catch (error) {
      setServerError(FirebaseService.getAuthErrorMessage(error));
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-sm flex-col gap-4 p-6"
      noValidate
    >
      <h1 className="text-2xl font-semibold">Entrar</h1>
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
        autoComplete="current-password"
        {...register("password")}
        error={!!errors.password}
        helperText={errors.password?.message}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting}>
        Entrar
      </Button>
      <Link to="/signup">Criar conta</Link>
    </form>
  );
}
