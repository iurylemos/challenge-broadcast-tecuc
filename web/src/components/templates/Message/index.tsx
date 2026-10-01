import { Alert, Button, CircularProgress } from "@mui/material";
import { useContext, useEffect, useMemo, useState, type JSX } from "react";
import { useParams } from "react-router-dom";

import { AuthContext } from "../../../contexts/auth/Auth.context";
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
import Header from "../../organisms/Header";
import FooterMessage from "../../atoms/FooterMessage";

export default function MessageTemplate(): JSX.Element {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

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
      setLoading(true);
      await MessagesService.delete(message.id);
    } catch (error: unknown) {
      console.error("Failed to delete message:", error);
      setError("Não foi possível deletar a mensagem");
    } finally {
      setLoading(false);
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
      setLoading(true);

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
    } catch (error: unknown) {
      const errorMessage = selectedMessage
        ? "Não foi possível atualizar a mensagem"
        : "Não foi possível criar a mensagem";

      console.error(errorMessage, error);

      setError(errorMessage);
    } finally {
      setLoading(false);
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

          <div className="border-b border-white/10">
            <div className="border-b border-white/10">
              <div className="flex flex-col sm:flex-row">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`border-b-2 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-0 sm:pb-3 sm:mr-6 ${
                    filter === "all"
                      ? "border-violet-500 text-violet-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("sent")}
                  className={`border-b-2 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-0 sm:pb-3 sm:mr-6 ${
                    filter === "sent"
                      ? "border-violet-500 text-violet-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Enviadas
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("scheduled")}
                  className={`border-b-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                    filter === "scheduled"
                      ? "border-violet-500 text-violet-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Agendadas
                </button>
              </div>
            </div>
          </div>

          <section>
            {loading ? (
              <div className="flex justify-center py-16">
                <CircularProgress />
              </div>
            ) : (
              <MessageList
                messages={filteredMessages}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
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
