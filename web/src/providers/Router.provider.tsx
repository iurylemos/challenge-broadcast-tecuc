import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicRouteProvider from "./PublicRoute.provider";
import LoginTemplate from "../components/templates/Login";
import { SignupTemplate } from "../components/templates/Signup";
import ProtectedRouteProvider from "./ProtectedRoute.provider";
import ConnectionsTemplate from "../components/templates/Connections";
import ContactsTemplate from "../components/templates/Contacts";
import MessageTemplate from "../components/templates/Message";

export const router = createBrowserRouter([
  {
    element: <PublicRouteProvider />,
    children: [
      { path: "/login", element: <LoginTemplate /> },
      { path: "/signup", element: <SignupTemplate /> },
    ],
  },
  {
    element: <ProtectedRouteProvider />,
    children: [
      { path: "/connections", element: <ConnectionsTemplate /> },
      {
        path: "/connections/:connectionId/contacts",
        element: <ContactsTemplate />,
      },
      {
        path: "/connections/:connectionId/messages",
        element: <MessageTemplate />,
      },
    ],
  },
  { path: "*", element: <Navigate to="/connections" replace /> },
]);
