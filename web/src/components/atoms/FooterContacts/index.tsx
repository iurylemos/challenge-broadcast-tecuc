import type { JSX } from "react";
import { Button } from "@mui/material";
import { RouterPath } from "../../../interfaces/router.interface";

type FooterContactsProps = {
  navigate: (path: string) => void;
};

export default function FooterContacts({
  navigate,
}: Readonly<FooterContactsProps>): JSX.Element {
  return (
    <footer className="border-t border-white/10 pt-6">
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
        ← Voltar para conexões
      </Button>
    </footer>
  );
}
