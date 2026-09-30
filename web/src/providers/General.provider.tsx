import type { JSX, ReactNode } from "react";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { AuthProvider } from "./Auth.provider";

type GeneralProviderProps = {
  children: ReactNode;
};

export default function GeneralProvider({
  children,
}: GeneralProviderProps): JSX.Element {
  return (
    <StyledEngineProvider injectFirst>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </StyledEngineProvider>
  );
}
