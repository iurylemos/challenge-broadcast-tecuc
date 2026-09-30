import type { JSX } from "react";
import { CircularProgress } from "@mui/material";

export default function Loading(): JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center">
      <CircularProgress />
    </div>
  );
}
