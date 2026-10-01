import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type JSX } from "react";
import type { Contact } from "../../../interfaces/contact.interface";
import type { Message } from "../../../interfaces/message.interface";

type MessageDialogProps = {
  open: boolean;
  contacts: Contact[];
  message: Message | null;
  onClose: () => void;
  onSubmit: (
    contactIds: string[],
    content: string,
    scheduledAt?: string,
  ) => Promise<void>;
};

export default function MessageDialog({
  open,
  contacts,
  message,
  onClose,
  onSubmit,
}: Readonly<MessageDialogProps>): JSX.Element {
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [content, setContent] = useState<string>("");
  const [scheduled, setScheduled] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const toggleContact = (id: string): void => {
    setContactIds((current) =>
      current.includes(id)
        ? current.filter((contactId) => contactId !== id)
        : [...current, id],
    );
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      if (!contactIds.length || !content.trim()) {
        return;
      }

      if (scheduled && !scheduledAt) {
        return;
      }

      console.log("scheduledAt", scheduledAt);

      setLoading(true);

      await onSubmit(
        contactIds,
        content.trim(),
        scheduled ? scheduledAt : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(message);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth>
      <DialogTitle>
        {isEditing ? "Editar mensagem" : "Nova mensagem"}
      </DialogTitle>

      <DialogContent>
        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
          Contatos
        </Typography>

        <FormGroup>
          {contacts.map((contact) => (
            <FormControlLabel
              key={contact.id}
              control={
                <Checkbox
                  checked={contactIds.includes(contact.id)}
                  onChange={() => toggleContact(contact.id)}
                />
              }
              label={`${contact.name} — ${contact.phone}`}
            />
          ))}
        </FormGroup>

        <TextField
          fullWidth
          multiline
          minRows={4}
          label="Mensagem"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          margin="normal"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={scheduled}
              onChange={(event) => setScheduled(event.target.checked)}
            />
          }
          label="Agendar mensagem"
        />

        {scheduled && (
          <TextField
            fullWidth
            type="datetime-local"
            label="Data e horário"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            margin="normal"
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            loading ||
            !contactIds.length ||
            !content.trim() ||
            (scheduled && !scheduledAt)
          }
        >
          {loading ? "Salvando..." : scheduled ? "Agendar" : "Enviar agora"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
