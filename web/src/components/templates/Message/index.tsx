import { Alert, Button } from "@mui/material";
import { useContext, useEffect, useMemo, useState, type JSX } from "react";
import { useParams } from "react-router-dom";

import { AuthContext } from "../../../contexts/auth/auth.context";
import type { AuthState } from "../../../interfaces/auth.interface";
import type { ConnectionParams } from "../../../interfaces/connection.interface";
import type { Contact } from "../../../interfaces/contact.interface";
import type {
  Message,
  MessageFilter,
} from "../../../interfaces/message.interface";

import { ContactsService } from "../../../services/contacts.service";
import { MessagesService } from "../../../services/messages.service";

import MessageList from "../../molecules/MessageList";
import MessageDialog from "../../organisms/MessageDialog";
import Header from "../../atoms/Header";
import FooterMessage from "../../atoms/FooterMessage";
import Tabs from "../../atoms/Tabs";
import {
  LoadingContext,
  type LoadingContextData,
} from "../../../contexts/loading/loading.context";
import {
  SnackbarContext,
  type SnackbarContextData,
} from "../../../contexts/snackbar/snackbar.context";
import { SnackbarStatus } from "../../../interfaces/snackbar.interface";

export default function MessageTemplate(): JSX.Element {
  const [error, setError] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { connectionId } = useParams<ConnectionParams>();
  const { user } = useContext<AuthState>(AuthContext);
  const { setIsLoading } = useContext<LoadingContextData>(LoadingContext);
  const { showSnackbar } = useContext<SnackbarContextData>(SnackbarContext);

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
        setIsLoading(false);
      },
      (error: Error): void => {
        console.error(error);
        setError("Não foi possível carregar as mensagens.");
        setIsLoading(false);
      },
    );
  }, [user, connectionId, setIsLoading]);

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
      setIsLoading(true);
      await MessagesService.delete(message.id);

      setIsLoading(false);
      showSnackbar("Mensagem deletada com sucesso!", SnackbarStatus.SUCCESS);
    } catch (error: unknown) {
      console.error("Failed to delete message:", error);
      setError("Não foi possível deletar a mensagem");
      setIsLoading(false);
      showSnackbar("Não foi possível deletar a mensagem", SnackbarStatus.ERROR);
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

    try {
      setIsLoading(true);

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
      setIsLoading(false);
      showSnackbar(
        `Mensagem ${selectedMessage ? "atualizada" : "criada"} com sucesso!`,
        SnackbarStatus.SUCCESS,
      );
    } catch (error: unknown) {
      const errorMessage = selectedMessage
        ? "Não foi possível atualizar a mensagem"
        : "Não foi possível criar a mensagem";

      console.error(errorMessage, error);

      setIsLoading(false);
      showSnackbar(errorMessage, SnackbarStatus.ERROR);
      setError(errorMessage);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />

      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Gerenciar Mensagens
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Envie ou agende mensagens para seus contatos
              </p>
            </div>

            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!contacts.length}
              sx={{
                minHeight: 42,
                borderRadius: "10px",
                backgroundColor: "#7c3aed",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 10px 25px rgba(124, 58, 237, 0.2)",
                "&:hover": {
                  backgroundColor: "#6d28d9",
                  boxShadow: "0 12px 30px rgba(124, 58, 237, 0.3)",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#3f3f46",
                  color: "#71717a",
                },
              }}
            >
              Nova mensagem
            </Button>
          </header>

          {error && (
            <Alert
              severity="error"
              className="rounded-xl! border border-red-500/20!"
            >
              {error}
            </Alert>
          )}

          <Tabs currentFilter={filter} setFilter={setFilter} />

          <section>
            <MessageList
              messages={filteredMessages}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </section>

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

          <FooterMessage connectionId={connectionId} />
        </div>
      </div>
    </main>
  );
}
