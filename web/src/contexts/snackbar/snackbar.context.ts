import { createContext } from "react";
import type { SnackbarStatus } from "../../interfaces/snackbar.interface";

export type SnackbarContextData = {
  showSnackbar: (message: string, status: SnackbarStatus) => void;
};

export const SnackbarContext = createContext<SnackbarContextData>({
  showSnackbar: () => {},
});
