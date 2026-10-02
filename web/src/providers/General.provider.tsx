import type { JSX, ReactNode } from "react";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { AuthProvider } from "./Auth.provider";
import { LoadingProvider } from "./Loading.provider";
import { SnackbarProvider } from "./Snackbar.provider";

type GeneralProviderProps = {
  children: ReactNode;
};

export default function GeneralProvider({
  children,
}: GeneralProviderProps): JSX.Element {
  return (
    <StyledEngineProvider injectFirst>
      <CssBaseline />
      <LoadingProvider>
        <SnackbarProvider>
          <AuthProvider>{children}</AuthProvider>
        </SnackbarProvider>
      </LoadingProvider>
    </StyledEngineProvider>
  );
}
