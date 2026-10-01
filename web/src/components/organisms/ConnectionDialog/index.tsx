import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useMemo, useState, type JSX } from "react";
import type { Connection } from "../../../interfaces/connection.interface";

type ConnectionDialogProps = {
  open: boolean;
  connection: Connection;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export default function ConnectionDialog({
  open,
  connection,
  onClose,
  onSubmit,
}: Readonly<ConnectionDialogProps>): JSX.Element {
  const [name, setName] = useState<string>("");

  const isEditing = useMemo<boolean>(
    () => !!(connection && connection.id),
    [connection],
  );

  const handleSubmit = (): void => {
    onSubmit(name);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEditing ? "Editar conexão" : "Criar conexão"}
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="normal"
          label="Nome do contato"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          {isEditing ? "Salvar" : "Criar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
