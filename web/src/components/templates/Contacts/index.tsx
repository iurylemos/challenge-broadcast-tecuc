import { Alert, Button, CircularProgress } from "@mui/material";
import { useContext, useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AuthContext } from "../../../contexts/auth/Auth.context";

import type { AuthState } from "../../../interfaces/auth.interface";
import type { Contact } from "../../../interfaces/contact.interface";
import type { ConnectionParams } from "../../../interfaces/connection.interface";

import { ContactsService } from "../../../services/contacts.service";

import ContactDialog from "../../organisms/ContactDialog";
import ContactList from "../../molecules/ContactList";
import Header from "../../organisms/Header";
import FooterContacts from "../../atoms/FooterContacts";

export default function ContactsTemplate(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const { user } = useContext<AuthState>(AuthContext);

  const navigate = useNavigate();
  const { connectionId } = useParams<ConnectionParams>();

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
      (items: Contact[]): void => {
        setContacts(items);
        setLoading(false);
      },
      (): void => {
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
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const handleDelete = async (contact: Contact): Promise<void> => {
    try {
      setLoading(true);
      await ContactsService.delete(contact.id);
    } catch (error) {
      console.error("Failed to delete contact:", error);
      setError("Não foi possível excluir o contato.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (name: string, phone: string): Promise<void> => {
    if (!connectionId) {
      return;
    }
    try {
      setLoading(true);

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
    } catch (error: unknown) {
      console.error("Failed to save or update contact:", error);

      const errorMessage = selectedContact.id
        ? "Não foi possível atualizar o contato."
        : "Não foi possível criar o contato.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!connectionId) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <Header />

        <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
          <Alert severity="error" className="rounded-xl!">
            Conexão não encontrada.
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />

      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Contatos
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Gerencie os contatos desta conexão
              </p>
            </div>

            <Button
              variant="contained"
              onClick={handleCreate}
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
              }}
            >
              Novo contato
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

          <section>
            {loading ? (
              <div className="flex justify-center py-16">
                <CircularProgress />
              </div>
            ) : (
              <ContactList
                contacts={contacts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                openMessages={() => {
                  navigate(`/connections/${connectionId}/messages`);
                }}
              />
            )}
          </section>

          <ContactDialog
            open={dialogOpen}
            contact={selectedContact}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleSubmit}
          />

          <FooterContacts navigate={(path) => navigate(path)} />
        </div>
      </div>
    </main>
  );
}
