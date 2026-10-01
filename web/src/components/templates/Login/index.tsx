import { useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowForward, LockOutlined, MailOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { loginSchema, type LoginInput } from "../../../schemas/login.schema";
import { FirebaseService } from "../../../services/firebase.service";

export default function LoginTemplate(): JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async ({ email, password }): Promise<void> => {
    setServerError(null);

    try {
      await FirebaseService.signIn(email, password);
    } catch (error) {
      setServerError(FirebaseService.getAuthErrorMessage(error));
    }
  });

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-128 w-lg rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl">
        <section className="hidden flex-1 flex-col justify-between p-12 lg:flex xl:p-16">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/30">
                <span className="text-lg font-bold text-white">B</span>
              </div>

              <span className="text-xl font-bold tracking-tight text-white">
                Broadcast
              </span>
            </div>

            <div className="max-w-xl pt-16">
              <Typography
                component="h1"
                className="text-5xl! font-bold! leading-[1.1]! tracking-tight! text-white! xl:text-6xl!"
              >
                Conectar.
                <br />
                Comunicar.
                <br />
                <span className="text-violet-400">Crescer.</span>
              </Typography>

              <Typography
                component="p"
                className="mt-6! max-w-lg! text-lg! leading-8! text-slate-400!"
              >
                Gerencie seus contatos e mensagens a partir de uma única
                plataforma simples e poderosa, construída para comunicação
                moderna.
              </Typography>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Broadcast. All rights reserved.
          </p>
        </section>

        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-130 lg:px-10">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                <span className="text-lg font-bold text-white">B</span>
              </div>

              <span className="text-xl font-bold text-black">Broadcast</span>
            </div>

            <div className="mb-8">
              <Typography
                component="h2"
                className="text-3xl! font-bold! tracking-tight! text-black!"
              >
                Bem-vindo de volta!
              </Typography>

              <Typography
                component="p"
                className="mt-2! text-sm! leading-6! text-slate-400!"
              >
                Faça login na sua conta para continuar.
              </Typography>
            </div>

            {serverError && (
              <Alert severity="error" className="mb-6! rounded-xl!">
                {serverError}
              </Alert>
            )}

            <form
              onSubmit={onSubmit}
              noValidate
              className="flex flex-col gap-5 "
            >
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                fullWidth
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Senha"
                type="password"
                autoComplete="current-password"
                fullWidth
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
                endIcon={!isSubmitting && <ArrowForward />}
                sx={{
                  minHeight: 52,
                  borderRadius: "12px",
                  backgroundColor: "#7c3aed",
                  textTransform: "none",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  boxShadow: "0 10px 25px rgba(124, 58, 237, 0.25)",
                  "&:hover": {
                    backgroundColor: "#6d28d9",
                    boxShadow: "0 12px 30px rgba(124, 58, 237, 0.35)",
                  },
                }}
              >
                {isSubmitting ? "Carregando..." : "Login"}
              </Button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-black" />
              <span className="text-xs text-slate-500">OU</span>
              <div className="h-px flex-1 bg-black" />
            </div>

            <p className="text-center text-sm text-slate-400">
              Não tem uma conta?{" "}
              <Link
                to="/signup"
                className="font-semibold text-violet-500 transition-colors hover:text-violet-400"
              >
                Crie uma conta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
