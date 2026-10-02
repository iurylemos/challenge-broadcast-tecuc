import { createContext } from "react";
import type { AuthState } from "../../interfaces/auth.interface";

export const AuthContext = createContext<AuthState>({
  loading: false,
  user: null,
});
