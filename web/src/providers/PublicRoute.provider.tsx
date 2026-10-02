import { useContext, type JSX } from "react";
import { AuthContext } from "../contexts/auth/auth.context";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { LocationState } from "../interfaces/location.interface";
import type { AuthState } from "../interfaces/auth.interface";
import { RouterPath } from "../interfaces/router.interface";
import {
  LoadingContext,
  type LoadingContextData,
} from "../contexts/loading/loading.context";

export default function PublicRouteProvider(): JSX.Element {
  const { user } = useContext<AuthState>(AuthContext);

  const { isLoading } = useContext<LoadingContextData>(LoadingContext);

  const location = useLocation();

  if (!user || isLoading) return <Outlet />;

  const from = (location.state as LocationState | null)?.from?.pathname;

  return <Navigate to={from ?? RouterPath.CONNECTIONS} replace />;
}
