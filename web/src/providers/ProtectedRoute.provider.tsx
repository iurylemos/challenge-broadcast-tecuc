import { useContext, type JSX } from "react";
import { AuthContext } from "../contexts/auth/auth.context";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AuthState } from "../interfaces/auth.interface";
import { RouterPath } from "../interfaces/router.interface";
import {
  LoadingContext,
  type LoadingContextData,
} from "../contexts/loading/loading.context";

export default function ProtectedRouteProvider(): JSX.Element {
  const { user } = useContext<AuthState>(AuthContext);
  const { isLoading } = useContext<LoadingContextData>(LoadingContext);

  const location = useLocation();

  if (user || isLoading) return <Outlet />;

  return <Navigate to={RouterPath.LOGIN} replace state={{ from: location }} />;
}
