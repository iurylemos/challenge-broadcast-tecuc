import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./providers/Router.provider";
import GeneralProvider from "./providers/General.provider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GeneralProvider>
      <RouterProvider router={router} />
    </GeneralProvider>
  </StrictMode>,
);
