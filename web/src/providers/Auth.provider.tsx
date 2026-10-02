import { useEffect, useState, type JSX, type ReactNode } from "react";
import type { AuthState } from "../interfaces/auth.interface";
import { FirebaseService } from "../services/firebase.service";
import { AuthContext } from "../contexts/auth/auth.context";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(
    () =>
      FirebaseService.subscribeAuth((user) =>
        setState({ user, loading: false }),
      ),
    [],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
