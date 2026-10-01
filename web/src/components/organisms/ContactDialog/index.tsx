import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useState, type JSX } from "react";
import type { Contact } from "../../../interfaces/contact.interface";

type ContactDialogProps = {
  open: boolean;
  contact: Contact;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => Promise<void>;
};

export default function ContactDialog({
  open,
  contact,
  onClose,
  onSubmit,
}: Readonly<ContactDialogProps>): JSX.Element {
  const [name, setName] = useState<string>(contact.name ?? "");
  const [phone, setPhone] = useState<string>(contact.phone ?? "");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim() || !phone.trim()) {
      return;
    }

    try {
      setLoading(true);

      await onSubmit(name.trim(), phone.trim());

      setName("");
      setPhone("");
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(contact.id);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth>
      <DialogTitle>{isEditing ? "Editar contato" : "Novo contato"}</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          margin="normal"
          autoFocus
        />

        <TextField
          fullWidth
          label="Telefone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          margin="normal"
          placeholder="+55 11 99999-9999"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !phone.trim()}
        >
          {loading && isEditing
            ? "Editando"
            : isEditing
              ? "Editar"
              : loading && !isEditing
                ? "Salvando..."
                : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
