import { Button } from "@mui/material";
import { useContext, useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";

import type { Connection } from "../../../interfaces/connection.interface";
import type { AuthState } from "../../../interfaces/auth.interface";

import { FirebaseService } from "../../../services/firebase.service";
import { ConnectionsService } from "../../../services/connections.service";
import { AuthContext } from "../../../contexts/auth/Auth.context";
import ConnectionList from "../../molecules/ConnectionList";
import ConnectionDialog from "../../organisms/ConnectionDialog";
import Header from "../../organisms/Header";
import FooterConnections from "../../atoms/FooterConnections";
import { RouterUtil } from "../../../utils/router.util";

export default function ConnectionsTemplate(): JSX.Element {
  const defaultConnection: Connection = {
    id: "",
    name: "",
  };

  const navigate = useNavigate();

  const { user } = useContext<AuthState>(AuthContext);

  const [connections, setConnections] = useState<Connection[]>([]);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const [selectedConnection, setSelectedConnection] =
    useState<Connection>(defaultConnection);

  useEffect(() => {
    if (!user) {
      return;
    }

    return ConnectionsService.subscribe(user.uid, setConnections, (error) => {
      console.error("Failed to load connections:", error);
    });
  }, [user]);

  const handleCreate = (): void => {
    setSelectedConnection(defaultConnection);
    setDialogOpen(true);
  };

  const handleEdit = (connection: Connection): void => {
    setSelectedConnection(connection);
    setDialogOpen(true);
  };

  const handleDelete = async (connection: Connection): Promise<void> => {
    try {
      await ConnectionsService.delete(connection.id);
    } catch (error) {
      console.error("Failed to delete connection:", error);
    }
  };

  const handleOpen = (connection: Connection): void => {
    navigate(RouterUtil.generateRouteContacts(connection.id));
  };

  const handleSubmit = async (name: string): Promise<void> => {
    try {
      console.log("selectedConnection", selectedConnection);

      if (selectedConnection.id) {
        await ConnectionsService.update(selectedConnection.id, name);
      } else {
        await ConnectionsService.create(name);
      }

      setDialogOpen(false);
      setSelectedConnection(defaultConnection);
    } catch (error: unknown) {
      console.error("Failed to save connection:", error);
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
                Conexões
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Gerencie suas conexões
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
              Nova conexão
            </Button>
          </header>

          <section>
            <ConnectionList
              connections={connections}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpen={handleOpen}
            />
          </section>

          <ConnectionDialog
            open={dialogOpen}
            connection={selectedConnection}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleSubmit}
          />

          <FooterConnections
            user={user}
            signout={() => FirebaseService.signOut()}
          />
        </div>
      </div>
    </main>
  );
}
