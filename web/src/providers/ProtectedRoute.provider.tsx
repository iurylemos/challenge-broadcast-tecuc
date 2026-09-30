import { useContext, type JSX } from "react";
import { AuthContext } from "../contexts/auth/Auth.context";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AuthState } from "../interfaces/auth.interface";
import Loading from "../components/atoms/Loading";

export default function ProtectedRouteProvider(): JSX.Element {
  const { user, loading } = useContext<AuthState>(AuthContext);

  const location = useLocation();

  if (loading) return <Loading />;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
