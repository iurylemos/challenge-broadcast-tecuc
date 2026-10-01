import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ConnectionParams } from "../../../interfaces/connection.interface";
import { AuthContext } from "../../../contexts/auth/Auth.context";
import type { AuthState } from "../../../interfaces/auth.interface";
import type { Contact } from "../../../interfaces/contact.interface";
import type {
  Message,
  MessageFilter,
} from "../../../interfaces/message.interface";
import { ContactsService } from "../../../services/contacts.service";
import { MessagesService } from "../../../services/messages.service";
import MessageList from "../../molecules/MessageList";
import MessageDialog from "../../organisms/MessageDialog";

export default function MessageTemplate(): JSX.Element {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const navigate = useNavigate();
  const { connectionId } = useParams<ConnectionParams>();
  const { user } = useContext<AuthState>(AuthContext);

  useEffect(() => {
    if (!user || !connectionId) {
      return;
    }

    return ContactsService.subscribe(
      user.uid,
      connectionId,
      setContacts,
      (error: Error) => {
        console.error(error);
        setError("Não foi possível carregar os contatos.");
      },
    );
  }, [user, connectionId]);

  useEffect(() => {
    if (!user || !connectionId) {
      return;
    }

    return MessagesService.subscribe(
      user.uid,
      connectionId,
      (items: Message[]): void => {
        setMessages(items);
        setLoading(false);
      },
      (error: Error): void => {
        console.error(error);
        setError("Não foi possível carregar as mensagens.");
        setLoading(false);
      },
    );
  }, [user, connectionId]);

  const filteredMessages = useMemo(() => {
    if (filter === "all") {
      return messages;
    }

    return messages.filter((message) => message.status === filter);
  }, [messages, filter]);

  const handleCreate = (): void => {
    setSelectedMessage(null);
    setDialogOpen(true);
  };

  const handleEdit = (message: Message): void => {
    setSelectedMessage(message);
    setDialogOpen(true);
  };

  const handleDelete = async (message: Message): Promise<void> => {
    try {
      await MessagesService.delete(message.id);
    } catch (error: unknown) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleSubmit = async (
    contactIds: string[],
    content: string,
    scheduledAt?: string,
  ): Promise<void> => {
    if (!connectionId) {
      return;
    }

    if (selectedMessage) {
      await MessagesService.update({
        id: selectedMessage.id,
        contactIds,
        message: content,
        scheduledAt,
      });
    } else {
      await MessagesService.create({
        connectionId,
        contactIds,
        message: content,
        scheduledAt,
      });
    }

    setDialogOpen(false);
    setSelectedMessage(null);
  };

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
              Broadcast
            </Typography>

            <Typography color="text.secondary">
              Envie ou agende mensagens para seus contatos
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!contacts.length}
          >
            Nova mensagem
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={filter}
          onChange={(_, value: MessageFilter) => setFilter(value)}
          sx={{ mb: 3 }}
        >
          <Tab value="all" label="Todas" />
          <Tab value="sent" label="Enviadas" />
          <Tab value="scheduled" label="Agendadas" />
        </Tabs>

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
          <MessageList
            messages={filteredMessages}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <MessageDialog
          open={dialogOpen}
          contacts={contacts}
          message={selectedMessage}
          onClose={() => {
            setDialogOpen(false);
            setSelectedMessage(null);
          }}
          onSubmit={handleSubmit}
        />

        <Box
          sx={{
            mt: 4,
          }}
        >
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => navigate(`/connections/${connectionId}/contacts`)}
            >
              Contatos
            </Button>

            <Button onClick={() => navigate("/connections")}>Conexões</Button>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}
