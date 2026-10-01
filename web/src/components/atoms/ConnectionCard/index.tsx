import { Button } from "@mui/material";
import type { JSX } from "react";

import type { Connection } from "../../../interfaces/connection.interface";
import { MagicNumber } from "../../../interfaces/magicNumber.enum";

type ConnectionCardProps = {
  connection: Connection;
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
  onOpen: (connection: Connection) => void;
};

export default function ConnectionCard({
  connection,
  onEdit,
  onDelete,
  onOpen,
}: Readonly<ConnectionCardProps>): JSX.Element {
  return (
    <article className="group rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10 transition-colors hover:border-violet-500/30">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <span className="text-lg font-bold text-violet-400">
              {connection.name.charAt(MagicNumber.ZERO).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-white">
              {connection.name}
            </h2>

            <p className="mt-1 truncate text-sm text-slate-400">
              ID: {connection.id}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <Button
            variant="contained"
            onClick={() => onOpen(connection)}
            sx={{
              minHeight: 40,
              flex: 1,
              borderRadius: "10px",
              backgroundColor: "#7c3aed",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#6d28d9",
                boxShadow: "none",
              },
            }}
          >
            Abrir
          </Button>

          <Button
            variant="outlined"
            onClick={() => onEdit(connection)}
            sx={{
              minHeight: 40,
              borderRadius: "10px",
              borderColor: "rgba(255,255,255,0.15)",
              color: "#cbd5e1",
              textTransform: "none",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.04)",
              },
            }}
          >
            Editar
          </Button>

          <Button
            onClick={() => onDelete(connection)}
            sx={{
              minHeight: 40,
              borderRadius: "10px",
              color: "#f87171",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(239,68,68,0.08)",
              },
            }}
          >
            Deletar
          </Button>
        </div>
      </div>
    </article>
  );
}
