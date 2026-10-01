import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/auth/Auth.context";
import type { AuthState } from "../../../interfaces/auth.interface";
import type { Contact } from "../../../interfaces/contact.interface";
import { ContactsService } from "../../../services/contacts.service";
import type { ConnectionParams } from "../../../interfaces/connection.interface";
import ContactDialog from "../../organisms/ContactDialog";
import ContactList from "../../molecules/ContactList";

export default function ContactsTemplate(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const { connectionId } = useParams<ConnectionParams>();

  const navigate = useNavigate();

  const { user } = useContext<AuthState>(AuthContext);

  const defaultContact: Contact = {
    id: "",
    connectionId: connectionId ?? "",
    name: "",
    phone: "",
  };

  const [selectedContact, setSelectedContact] =
    useState<Contact>(defaultContact);

  useEffect(() => {
    if (!user || !connectionId) {
      return;
    }

    return ContactsService.subscribe(
      user.uid,
      connectionId,
      (items) => {
        setContacts(items);
        setLoading(false);
      },
      () => {
        setError("Não foi possível carregar os contatos.");
        setLoading(false);
      },
    );
  }, [user, connectionId]);

  const handleCreate = (): void => {
    setSelectedContact({
      ...defaultContact,
      connectionId: connectionId ?? "",
    });

    setDialogOpen(true);
  };

  const handleEdit = (contact: Contact): void => {
    console.log("contact", contact);
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const handleDelete = async (contact: Contact): Promise<void> => {
    try {
      await ContactsService.delete(contact.id);
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const handleSubmit = async (name: string, phone: string): Promise<void> => {
    if (!connectionId) {
      return;
    }

    if (selectedContact.id) {
      await ContactsService.update(selectedContact.id, name, phone);
    } else {
      await ContactsService.create(connectionId, name, phone);
    }

    setDialogOpen(false);
    setSelectedContact({
      ...defaultContact,
      connectionId,
    });
  };

  if (!connectionId) {
    return (
      <Container>
        <Alert severity="error">Conexão não encontrada.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack
          sx={{
            direction: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              Contatos
            </Typography>

            <Typography color="text.secondary">
              Gerencie os contatos desta conexão
            </Typography>
          </Box>

          <Button variant="contained" onClick={handleCreate}>
            Novo contato
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 6,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            <ContactList
              contacts={contacts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              openMessages={() => {
                navigate(`/connections/${connectionId}/messages`);
              }}
            />
          </Stack>
        )}

        <ContactDialog
          open={dialogOpen}
          contact={selectedContact}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
        />

        <Box
          sx={{
            mt: 4,
          }}
        >
          <Button onClick={() => navigate("/connections")}>
            Voltar para conexões
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
