import type { JSX } from "react";
import { CircularProgress } from "@mui/material";

export default function Loading(): JSX.Element {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="flex min-w-48 flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 px-8 py-7 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/30">
          <span className="text-lg font-bold text-white">B</span>
        </div>

        <CircularProgress
          size={28}
          thickness={4}
          sx={{
            color: "#7c3aed",
          }}
        />

        <span className="text-sm font-medium text-slate-300">
          Processando...
        </span>
      </div>
    </div>
  );
}
