import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicRouteProvider from "./PublicRoute.provider";
import LoginTemplate from "../components/templates/Login";
import { SignupTemplate } from "../components/templates/Signup";
import ProtectedRouteProvider from "./ProtectedRoute.provider";
import ConnectionsTemplate from "../components/templates/Connections";
import ContactsTemplate from "../components/templates/Contacts";
import MessageTemplate from "../components/templates/Message";
import { RouterPath } from "../interfaces/router.interface";

export const router = createBrowserRouter([
  {
    element: <PublicRouteProvider />,
    children: [
      { path: RouterPath.LOGIN, element: <LoginTemplate /> },
      { path: RouterPath.SIGNUP, element: <SignupTemplate /> },
    ],
  },
  {
    element: <ProtectedRouteProvider />,
    children: [
      { path: RouterPath.CONNECTIONS, element: <ConnectionsTemplate /> },
      {
        path: RouterPath.CONNECTION_CONTACTS,
        element: <ContactsTemplate />,
      },
      {
        path: RouterPath.CONNECTION_MESSAGES,
        element: <MessageTemplate />,
      },
    ],
  },
  { path: "*", element: <Navigate to={RouterPath.CONNECTIONS} replace /> },
]);
