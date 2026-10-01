import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import type { JSX } from "react";
import type { Contact } from "../../../interfaces/contact.interface";

type ContactListProps = {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  openMessages: (contact: Contact) => void;
  onSelect?: (contact: Contact) => void;
  selectedIds?: string[];
};

export default function ContactList({
  contacts,
  onEdit,
  onDelete,
  openMessages,
}: Readonly<ContactListProps>): JSX.Element {
  if (!contacts.length) {
    return (
      <Typography color="text.secondary">Nenhum contato cadastrado.</Typography>
    );
  }

  return (
    <Box>
      {contacts.map((contact) => (
        <Card key={contact.id}>
          <CardContent>
            <Typography variant="h6">{contact.name}</Typography>

            <Typography color="text.secondary">{contact.phone}</Typography>
          </CardContent>

          <CardActions>
            <Button size="small" onClick={() => onEdit(contact)}>
              Editar
            </Button>
            <Button
              size="small"
              color="secondary"
              onClick={() => openMessages(contact)}
            >
              Ver mensagens
            </Button>

            <Button
              size="small"
              color="error"
              onClick={() => onDelete(contact)}
            >
              Excluir
            </Button>
          </CardActions>
        </Card>
      ))}
    </Box>
  );
}
