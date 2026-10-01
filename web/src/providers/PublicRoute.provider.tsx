import { useContext, type JSX } from "react";
import { AuthContext } from "../contexts/auth/Auth.context";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { LocationState } from "../interfaces/location.interface";
import type { AuthState } from "../interfaces/auth.interface";
import Loading from "../components/atoms/Loading";
import { RouterPath } from "../interfaces/router.interface";

export default function PublicRouteProvider(): JSX.Element {
  const { user, loading } = useContext<AuthState>(AuthContext);

  const location = useLocation();

  if (loading) return <Loading />;

  if (user) {
    const from = (location.state as LocationState | null)?.from?.pathname;

    return <Navigate to={from ?? RouterPath.CONNECTIONS} replace />;
  }

  return <Outlet />;
}
