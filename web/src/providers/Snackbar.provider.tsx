import { useCallback, useState, type JSX, type ReactNode } from "react";
import { Alert, Snackbar, type SnackbarCloseReason } from "@mui/material";

import { SnackbarContext } from "../contexts/snackbar/snackbar.context";
import { SnackbarStatus } from "../interfaces/snackbar.interface";

type SnackbarProviderProps = {
  children: ReactNode;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarStatus;
};

const initialState: SnackbarState = {
  open: false,
  message: "",
  severity: SnackbarStatus.INFO,
};

const AUTO_HIDE_DURATION = 4000;

export function SnackbarProvider({
  children,
}: Readonly<SnackbarProviderProps>): JSX.Element {
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialState);

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarStatus): void => {
      setSnackbar({
        open: true,
        message,
        severity,
      });
    },
    [],
  );

  const handleClose = useCallback(
    (
      _event?: React.SyntheticEvent | Event,
      reason?: SnackbarCloseReason,
    ): void => {
      if (reason === "clickaway") {
        return;
      }

      setSnackbar((current) => ({
        ...current,
        open: false,
      }));
    },
    [],
  );

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={AUTO_HIDE_DURATION}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          variant="filled"
          role="alert"
          className="rounded-xl! font-medium!"
          sx={{
            minWidth: 320,
            borderRadius: "12px",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
