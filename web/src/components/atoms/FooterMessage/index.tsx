import type { JSX } from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { RouterPath } from "../../../interfaces/router.interface";
import { RouterUtil } from "../../../utils/router.util";

type FooterMessageProps = {
  connectionId: string | undefined;
};

export default function FooterMessage({
  connectionId,
}: Readonly<FooterMessageProps>): JSX.Element {
  const navigate = useNavigate();

  return (
    <footer className="flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:gap-4">
      <Button
        variant="text"
        onClick={() =>
          navigate(RouterUtil.generateRouteContacts(connectionId!))
        }
        sx={{
          color: "#94a3b8",
          textTransform: "none",
          fontWeight: 600,
          "&:hover": {
            color: "#e2e8f0",
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        }}
      >
        ← Contatos
      </Button>

      <Button
        variant="text"
        onClick={() => navigate(RouterPath.CONNECTIONS)}
        sx={{
          color: "#94a3b8",
          textTransform: "none",
          fontWeight: 600,
          "&:hover": {
            color: "#e2e8f0",
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        }}
      >
        Conexões
      </Button>
    </footer>
  );
}
