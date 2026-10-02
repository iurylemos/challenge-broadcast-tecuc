import { Alert, Button } from "@mui/material";
import { useContext, useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AuthContext } from "../../../contexts/auth/auth.context";

import type { AuthState } from "../../../interfaces/auth.interface";
import type { Contact } from "../../../interfaces/contact.interface";
import type { ConnectionParams } from "../../../interfaces/connection.interface";

import { ContactsService } from "../../../services/contacts.service";

import ContactDialog from "../../organisms/ContactDialog";
import ContactList from "../../molecules/ContactList";
import Header from "../../atoms/Header";
import FooterContacts from "../../atoms/FooterContacts";
import { RouterUtil } from "../../../utils/router.util";
import {
  LoadingContext,
  type LoadingContextData,
} from "../../../contexts/loading/loading.context";
import {
  SnackbarContext,
  type SnackbarContextData,
} from "../../../contexts/snackbar/snackbar.context";
import { SnackbarStatus } from "../../../interfaces/snackbar.interface";

export default function ContactsTemplate(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { user } = useContext<AuthState>(AuthContext);
  const { setIsLoading } = useContext<LoadingContextData>(LoadingContext);
  const { showSnackbar } = useContext<SnackbarContextData>(SnackbarContext);

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
        setIsLoading(false);
      },
      (): void => {
        setIsLoading(false);
        showSnackbar(
          "Não foi possível carregar os contatos.",
          SnackbarStatus.ERROR,
        );
      },
    );
  }, [user, connectionId, setIsLoading, showSnackbar]);

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
      setIsLoading(true);

      await ContactsService.delete(contact.id);

      setIsLoading(false);

      showSnackbar("Contato deletado com sucesso!", SnackbarStatus.SUCCESS);
    } catch (error) {
      console.error("Failed to delete contact:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";

      setIsLoading(false);

      showSnackbar(errorMessage, SnackbarStatus.ERROR);
    }
  };

  const handleSubmit = async (name: string, phone: string): Promise<void> => {
    if (!connectionId) {
      return;
    }
    try {
      setIsLoading(true);

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

      setIsLoading(false);

      showSnackbar(
        `Contato ${selectedContact.id ? "atualizado" : "criado"} com sucesso!`,
        SnackbarStatus.SUCCESS,
      );
    } catch (error: unknown) {
      console.error("Failed to save or update contact:", error);

      const errorMessage = selectedContact.id
        ? "Não foi possível atualizar o contato."
        : "Não foi possível criar o contato.";

      setIsLoading(false);

      showSnackbar(errorMessage, SnackbarStatus.ERROR);
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

          <section>
            <ContactList
              contacts={contacts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              openMessages={() => {
                navigate(RouterUtil.generateRouteMessages(connectionId));
              }}
            />
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
