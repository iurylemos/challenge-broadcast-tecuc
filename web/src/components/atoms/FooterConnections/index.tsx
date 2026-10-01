import type { JSX } from "react";
import { Button } from "@mui/material";
import type { User } from "firebase/auth";

type FooterConnectionsProps = {
  user: User | null;
  signout: () => void;
};

export default function FooterConnections({
  user,
  signout,
}: Readonly<FooterConnectionsProps>): JSX.Element {
  return (
    <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-400">
        Logado como{" "}
        <span className="font-medium text-slate-200">{user?.email}</span>
      </p>

      <Button
        variant="outlined"
        onClick={signout}
        sx={{
          minHeight: 40,
          borderRadius: "10px",
          borderColor: "rgba(255,255,255,0.15)",
          color: "#cbd5e1",
          textTransform: "none",
          fontWeight: 600,
          "&:hover": {
            borderColor: "rgba(255,255,255,0.3)",
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        }}
      >
        Sair
      </Button>
    </footer>
  );
}
